// src/controllers/podcasts.controller.js
import Podcast from '../models/podcast.model.js';
import { handleHttpError } from '../utils/handleError.js';

// GET /api/podcasts - público, solo publicados
export const getPodcastsCtrl = async (req, res) => {
  try {
    const podcasts = await Podcast.find({ published: true }).populate('author', 'name email');
    res.json({ podcasts });
  } catch {
    handleHttpError(res, 'ERROR_GET_PODCASTS');
  }
};

// GET /api/podcasts/admin/all - admin
export const getAllPodcastsCtrl = async (req, res) => {
  try {
    const podcasts = await Podcast.find().populate('author', 'name email');
    res.json({ podcasts });
  } catch {
    handleHttpError(res, 'ERROR_GET_ALL_PODCASTS');
  }
};

// GET /api/podcasts/:id - público
export const getPodcastCtrl = async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id).populate('author', 'name email');
    if (!podcast) return handleHttpError(res, 'PODCAST_NOT_FOUND', 404);
    res.json({ podcast });
  } catch {
    handleHttpError(res, 'ERROR_GET_PODCAST');
  }
};

// POST /api/podcasts - autenticado
export const createPodcastCtrl = async (req, res) => {
  try {
    const podcast = await Podcast.create({ ...req.body, author: req.user._id });
    res.status(201).json({ podcast });
  } catch {
    handleHttpError(res, 'ERROR_CREATE_PODCAST');
  }
};

// PUT /api/podcasts/:id - autenticado (solo autor)
export const updatePodcastCtrl = async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id);
    if (!podcast) return handleHttpError(res, 'PODCAST_NOT_FOUND', 404);

    if (podcast.author.toString() !== req.user._id.toString()) {
      return handleHttpError(res, 'NOT_ALLOWED', 403);
    }

    const updated = await Podcast.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ podcast: updated });
  } catch {
    handleHttpError(res, 'ERROR_UPDATE_PODCAST');
  }
};

// DELETE /api/podcasts/:id - admin
export const deletePodcastCtrl = async (req, res) => {
  try {
    const podcast = await Podcast.findByIdAndDelete(req.params.id);
    if (!podcast) return handleHttpError(res, 'PODCAST_NOT_FOUND', 404);
    res.json({ message: 'Podcast eliminado' });
  } catch {
    handleHttpError(res, 'ERROR_DELETE_PODCAST');
  }
};

// PATCH /api/podcasts/:id/publish - admin
export const publishPodcastCtrl = async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id);
    if (!podcast) return handleHttpError(res, 'PODCAST_NOT_FOUND', 404);
    podcast.published = !podcast.published;
    await podcast.save();
    res.json({ podcast });
  } catch {
    handleHttpError(res, 'ERROR_PUBLISH_PODCAST');
  }
};
