import mongoose from 'mongoose';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (error) {
    res.status(400).json({
      error: true,
      message: 'Error de validación'
    });
  }
};

export const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: true,
      message: `'${paramName}' no es un ID válido`
    });
  }

  next();
};