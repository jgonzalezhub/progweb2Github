import DeliveryNote from '../models/DeliveryNote.js';
import Project from '../models/Project.js';
import { handleHttpError } from '../utils/handleError.js';
import { getIO } from '../config/socket.js';
import { generateDeliveryNotePDF } from '../services/pdf.service.js';
import { uploadImage, uploadPDF, deleteFile } from '../services/storage.service.js';

// POST /api/deliverynote
// Crea un albarán de material u horas vinculado a un proyecto de la empresa del usuario
export const createDeliveryNote = async (req, res) => {
  try {
    if (!req.user.company) return handleHttpError(res, 'NO_COMPANY_ASSOCIATED', 400);

    const { project, client, format, description, workDate, material, quantity, unit, hours, workers } =
      req.body;

    const projectDoc = await Project.findOne({
      _id: project,
      company: req.user.company,
      deleted: false
    });
    if (!projectDoc) return handleHttpError(res, 'PROJECT_NOT_FOUND', 404);

    const clientId = client || projectDoc.client;

    const note = await DeliveryNote.create({
      user: req.user._id,
      company: req.user.company,
      client: clientId,
      project,
      format,
      description,
      workDate: workDate || new Date(),
      ...(format === 'material' && { material, quantity, unit }),
      ...(format === 'hours' && { hours, workers })
    });

    const io = getIO();
    if (io) io.to(req.user.company.toString()).emit('deliverynote:new', { note });

    res.status(201).json({ data: note });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_CREATE_DELIVERY_NOTE');
  }
};

// GET /api/deliverynote
// Devuelve la lista paginada de albaranes con filtros por proyecto, cliente, formato, firma y rango de fechas
export const getDeliveryNotes = async (req, res) => {
  try {
    if (!req.user.company) return handleHttpError(res, 'NO_COMPANY_ASSOCIATED', 400);

    const {
      page = 1,
      limit = 10,
      project,
      client,
      format,
      signed,
      from,
      to,
      sort = '-workDate'
    } = req.query;

    const filter = { company: req.user.company, deleted: false };
    if (project) filter.project = project;
    if (client) filter.client = client;
    if (format) filter.format = format;
    if (signed !== undefined) filter.signed = signed === 'true';
    if (from || to) {
      filter.workDate = {};
      if (from) filter.workDate.$gte = new Date(from);
      if (to) filter.workDate.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await DeliveryNote.countDocuments(filter);
    const notes = await DeliveryNote.find(filter).sort(sort).skip(skip).limit(Number(limit));

    res.json({
      data: notes,
      totalItems: total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (err) {
    handleHttpError(res, 'ERROR_GET_DELIVERY_NOTES');
  }
};

// GET /api/deliverynote/:id
// Devuelve un albarán por ID con usuario, cliente y proyecto populados
export const getDeliveryNoteById = async (req, res) => {
  try {
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    })
      .populate('user', 'name lastName email')
      .populate('client', 'name cif email phone address')
      .populate('project', 'name projectCode address');

    if (!note) return handleHttpError(res, 'DELIVERY_NOTE_NOT_FOUND', 404);

    res.json({ data: note });
  } catch (err) {
    handleHttpError(res, 'ERROR_GET_DELIVERY_NOTE');
  }
};

// GET /api/deliverynote/pdf/:id
// Genera el PDF del albarán al vuelo o redirige a la URL en Cloudinary si ya está firmado
export const downloadPDF = async (req, res) => {
  try {
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    })
      .populate('user', 'name lastName email')
      .populate('client', 'name cif email phone address')
      .populate('project', 'name projectCode address');

    if (!note) return handleHttpError(res, 'DELIVERY_NOTE_NOT_FOUND', 404);

    // Si ya está firmado y tiene PDF en la nube, redirigir
    if (note.signed && note.pdfUrl) {
      return res.redirect(note.pdfUrl);
    }

    const pdfBuffer = await generateDeliveryNotePDF(note);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="albaran-${note._id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_DOWNLOAD_PDF');
  }
};

// PATCH /api/deliverynote/:id/sign
// Firma el albarán subiendo la imagen de firma y el PDF generado a Cloudinary
export const signDeliveryNote = async (req, res) => {
  // Guarda el public_id de la firma para poder borrarla si el flujo falla después
  let signaturePublicId = null;
  try {
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    });

    if (!note) return handleHttpError(res, 'DELIVERY_NOTE_NOT_FOUND', 404);
    if (note.signed) return handleHttpError(res, 'DELIVERY_NOTE_ALREADY_SIGNED', 400);
    if (!req.file) return handleHttpError(res, 'SIGNATURE_FILE_REQUIRED', 400);

    // Subir firma a Cloudinary (con optimización Sharp)
    const signatureResult = await uploadImage(req.file.buffer, {
      folder: 'bildyapp/signatures'
    });
    // Punto de compensación: si cualquier paso posterior falla, borramos esta imagen
    signaturePublicId = signatureResult.public_id;

    note.signed = true;
    note.signedAt = new Date();
    note.signatureUrl = signatureResult.secure_url;

    // Poblar en el mismo documento para generar el PDF sin consulta extra
    await note.populate([
      { path: 'user', select: 'name lastName email' },
      { path: 'client', select: 'name cif email phone address' },
      { path: 'project', select: 'name projectCode address' }
    ]);

    // Generar y subir PDF a Cloudinary
    const pdfBuffer = await generateDeliveryNotePDF(note);
    const pdfResult = await uploadPDF(pdfBuffer, {
      folder: 'bildyapp/pdfs',
      public_id: `albaran-${note._id}`
    });

    note.pdfUrl = pdfResult.secure_url;
    await note.save();

    const io = getIO();
    if (io) io.to(req.user.company.toString()).emit('deliverynote:signed', { noteId: note._id });

    res.json({ message: 'Albarán firmado correctamente', data: note });
  } catch (err) {
    // Compensación: si la firma ya se subió pero el flujo posterior falló, borrarla de Cloudinary
    if (signaturePublicId) {
      await deleteFile(signaturePublicId).catch((cleanupErr) =>
        console.error('Error limpiando firma huérfana de Cloudinary:', cleanupErr)
      );
    }
    console.error(err);
    handleHttpError(res, 'ERROR_SIGN_DELIVERY_NOTE');
  }
};

// DELETE /api/deliverynote/:id (solo si no está firmado)
// Elimina permanentemente un albarán siempre que no haya sido firmado previamente
export const deleteDeliveryNote = async (req, res) => {
  try {
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    });

    if (!note) return handleHttpError(res, 'DELIVERY_NOTE_NOT_FOUND', 404);
    if (note.signed) return handleHttpError(res, 'CANNOT_DELETE_SIGNED_NOTE', 400);

    await DeliveryNote.findByIdAndDelete(req.params.id);
    res.json({ message: 'Albarán eliminado correctamente' });
  } catch (err) {
    handleHttpError(res, 'ERROR_DELETE_DELIVERY_NOTE');
  }
};
