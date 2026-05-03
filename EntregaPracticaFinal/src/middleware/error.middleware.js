import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import { logError } from '../services/logger.service.js';

export const notFound = (req, res) => {
  res.status(404).json({
    error: true,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`
  });
};

export const errorHandler = async (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: true, message: err.message });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({ error: true, message: 'Error de validación', details });
  }
  if (err instanceof mongoose.Error.CastError)
    return res.status(400).json({ error: true, message: `Valor inválido para '${err.path}'` });
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({ error: true, message: `Ya existe un registro con ese '${field}'` });
  }

  if (err.name === 'ZodError') {
    const details = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
    return res.status(400).json({ error: true, message: 'Error de validación', details });
  }

  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ error: true, message: 'Token inválido' });
  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ error: true, message: 'Token expirado' });

  // Enviar errores 5XX a Slack
  const statusCode = err.status || 500;
  if (statusCode >= 500) {
    await logError(req, err).catch(() => {});
  }

  res.status(statusCode).json({
    error: true,
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message
  });
};
