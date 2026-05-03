import Client from '../models/Client.js';
import { handleHttpError } from '../utils/handleError.js';
import { getIO } from '../config/socket.js';

// POST /api/client
export const createClient = async (req, res) => {
  try {
    if (!req.user.company) return handleHttpError(res, 'NO_COMPANY_ASSOCIATED', 400);

    const { name, cif, email, phone, address } = req.body;

    const existing = await Client.findOne({ company: req.user.company, cif, deleted: false });
    if (existing) return handleHttpError(res, 'CLIENT_CIF_ALREADY_EXISTS', 409);

    const client = await Client.create({
      user: req.user._id,
      company: req.user.company,
      name,
      cif,
      email,
      phone,
      address
    });

    const io = getIO();
    if (io) io.to(req.user.company.toString()).emit('client:new', { client });

    res.status(201).json({ data: client });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_CREATE_CLIENT');
  }
};

// PUT /api/client/:id
export const updateClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    });
    if (!client) return handleHttpError(res, 'CLIENT_NOT_FOUND', 404);

    // Si se cambia CIF, verificar que no exista en la empresa
    if (req.body.cif && req.body.cif !== client.cif) {
      const dup = await Client.findOne({
        company: req.user.company,
        cif: req.body.cif,
        deleted: false,
        _id: { $ne: req.params.id }
      });
      if (dup) return handleHttpError(res, 'CLIENT_CIF_ALREADY_EXISTS', 409);
    }

    const updated = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({ data: updated });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_UPDATE_CLIENT');
  }
};

// GET /api/client
export const getClients = async (req, res) => {
  try {
    if (!req.user.company) return handleHttpError(res, 'NO_COMPANY_ASSOCIATED', 400);

    const { page = 1, limit = 10, name, sort = 'createdAt' } = req.query;

    const filter = { company: req.user.company, deleted: false };
    if (name) filter.name = { $regex: name, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Client.countDocuments(filter);
    const clients = await Client.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      data: clients,
      totalItems: total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (err) {
    handleHttpError(res, 'ERROR_GET_CLIENTS');
  }
};

// GET /api/client/archived
export const getArchivedClients = async (req, res) => {
  try {
    if (!req.user.company) return handleHttpError(res, 'NO_COMPANY_ASSOCIATED', 400);

    const clients = await Client.find({ company: req.user.company, deleted: true });
    res.json({ data: clients });
  } catch (err) {
    handleHttpError(res, 'ERROR_GET_ARCHIVED_CLIENTS');
  }
};

// GET /api/client/:id
export const getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    });
    if (!client) return handleHttpError(res, 'CLIENT_NOT_FOUND', 404);
    res.json({ data: client });
  } catch (err) {
    handleHttpError(res, 'ERROR_GET_CLIENT');
  }
};

// DELETE /api/client/:id (?soft=true)
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    });
    if (!client) return handleHttpError(res, 'CLIENT_NOT_FOUND', 404);

    if (req.query.soft === 'true') {
      await Client.findByIdAndUpdate(req.params.id, { deleted: true });
      return res.json({ message: 'Cliente archivado correctamente' });
    }

    await Client.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (err) {
    handleHttpError(res, 'ERROR_DELETE_CLIENT');
  }
};

// PATCH /api/client/:id/restore
export const restoreClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: true
    });
    if (!client) return handleHttpError(res, 'CLIENT_NOT_FOUND', 404);

    await Client.findByIdAndUpdate(req.params.id, { deleted: false });
    res.json({ message: 'Cliente restaurado correctamente' });
  } catch (err) {
    handleHttpError(res, 'ERROR_RESTORE_CLIENT');
  }
};
