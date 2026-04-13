import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';

// Responde con 404 cuando ninguna ruta coincide con la petición
export const notFound = (req, res, next) => {
  res.status(404).json({
    error: true,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`
  });
};

// Manejador global de errores: distingue errores operacionales, de Mongoose, Zod y JWT
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // AppError operacional
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: true, message: err.message });
  }

  // Errores Mongoose
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
    return res.status(400).json({ error: true, message: 'Error de validación', details });
  }
  if (err instanceof mongoose.Error.CastError)
    return res.status(400).json({ error: true, message: `Valor inválido para '${err.path}'` });
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({ error: true, message: `Ya existe un registro con ese '${field}'` });
  }

  // Zod
  if (err.name === 'ZodError') {
    const details = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return res.status(400).json({ error: true, message: 'Error de validación', details });
  }

  // JWT
  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ error: true, message: 'Token inválido' });
  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ error: true, message: 'Token expirado' });

  res.status(err.status || 500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message
  });
};
