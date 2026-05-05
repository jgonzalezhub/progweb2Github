import Project from '../models/Project.js';
import Client from '../models/Client.js';
import { handleHttpError } from '../utils/handleError.js';
import { getIO } from '../config/socket.js';

// POST /api/project
export const createProject = async (req, res) => {
  try {
    if (!req.user.company) return handleHttpError(res, 'NO_COMPANY_ASSOCIATED', 400);

    const { name, projectCode, client, address, email, notes, active } = req.body;

    // Verificar que el cliente pertenece a la empresa
    const clientDoc = await Client.findOne({
      _id: client,
      company: req.user.company,
      deleted: false
    });
    if (!clientDoc) return handleHttpError(res, 'CLIENT_NOT_FOUND', 404);

    // Verificar código único en empresa
    const existing = await Project.findOne({
      company: req.user.company,
      projectCode,
      deleted: false
    });
    if (existing) return handleHttpError(res, 'PROJECT_CODE_ALREADY_EXISTS', 409);

    const project = await Project.create({
      user: req.user._id,
      company: req.user.company,
      client,
      name,
      projectCode,
      address,
      email,
      notes,
      active: active !== undefined ? active : true
    });

    const io = getIO();
    if (io) io.to(req.user.company.toString()).emit('project:new', { project });

    res.status(201).json({ data: project });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_CREATE_PROJECT');
  }
};

// PUT /api/project/:id
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    });
    if (!project) return handleHttpError(res, 'PROJECT_NOT_FOUND', 404);

    // Si se cambia projectCode, verificar unicidad
    if (req.body.projectCode && req.body.projectCode !== project.projectCode) {
      const dup = await Project.findOne({
        company: req.user.company,
        projectCode: req.body.projectCode,
        deleted: false,
        _id: { $ne: req.params.id }
      });
      if (dup) return handleHttpError(res, 'PROJECT_CODE_ALREADY_EXISTS', 409);
    }

    // Si se cambia cliente, verificar que pertenece a la empresa
    if (req.body.client) {
      const clientDoc = await Client.findOne({
        _id: req.body.client,
        company: req.user.company,
        deleted: false
      });
      if (!clientDoc) return handleHttpError(res, 'CLIENT_NOT_FOUND', 404);
    }

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({ data: updated });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_UPDATE_PROJECT');
  }
};

// GET /api/project
export const getProjects = async (req, res) => {
  try {
    if (!req.user.company) return handleHttpError(res, 'NO_COMPANY_ASSOCIATED', 400);

    const { page = 1, limit = 10, client, name, active, sort = '-createdAt' } = req.query;

    const filter = { company: req.user.company, deleted: false };
    if (client) filter.client = client;
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (active !== undefined) filter.active = active === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate('client', 'name cif')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      data: projects,
      totalItems: total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (err) {
    handleHttpError(res, 'ERROR_GET_PROJECTS');
  }
};

// GET /api/project/archived
export const getArchivedProjects = async (req, res) => {
  try {
    if (!req.user.company) return handleHttpError(res, 'NO_COMPANY_ASSOCIATED', 400);

    const { page = 1, limit = 10 } = req.query;
    const filter = { company: req.user.company, deleted: true };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate('client', 'name cif')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      data: projects,
      totalItems: total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (err) {
    handleHttpError(res, 'ERROR_GET_ARCHIVED_PROJECTS');
  }
};

// GET /api/project/:id
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    }).populate('client', 'name cif email');
    if (!project) return handleHttpError(res, 'PROJECT_NOT_FOUND', 404);
    res.json({ data: project });
  } catch (err) {
    handleHttpError(res, 'ERROR_GET_PROJECT');
  }
};

// DELETE /api/project/:id (?soft=true)
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    });
    if (!project) return handleHttpError(res, 'PROJECT_NOT_FOUND', 404);

    if (req.query.soft === 'true') {
      await Project.findByIdAndUpdate(req.params.id, { deleted: true });
      return res.json({ message: 'Proyecto archivado correctamente' });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Proyecto eliminado correctamente' });
  } catch (err) {
    handleHttpError(res, 'ERROR_DELETE_PROJECT');
  }
};

// PATCH /api/project/:id/restore
export const restoreProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: true
    });
    if (!project) return handleHttpError(res, 'PROJECT_NOT_FOUND', 404);

    await Project.findByIdAndUpdate(req.params.id, { deleted: false });
    res.json({ message: 'Proyecto restaurado correctamente' });
  } catch (err) {
    handleHttpError(res, 'ERROR_RESTORE_PROJECT');
  }
};
