export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }

  static notFound(message = 'Recurso no encontrado') {
    return new ApiError(404, message);
  }
}

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  res.status(500).json({
    error: 'Error interno del servidor'
  });
};
