// src/controllers/tracks.controller.js
import Track from '../models/track.model.js';

export const createTrack = async (req, res) => {
  try {
    // El usuario viene del middleware de autenticación
    const user = req.user;
    
    // Crear track con el usuario como artista
    const track = await Track.create({
      ...req.body,
      artist: user._id
    });
    
    res.status(201).json({ data: track, createdBy: user.name });
  } catch (err) {
    handleHttpError(res, 'ERROR_CREATE_TRACK');
  }
};