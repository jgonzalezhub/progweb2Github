import mongoose from 'mongoose';

export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.parse({ body: req.body, query: req.query, params: req.params });
    // Solo sobrescribir body (Express 5: req.query y req.params son getters read-only)
    if (result.body !== undefined) req.body = result.body;
    next();
  } catch (error) {
    const errors = error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
    res.status(400).json({ error: true, message: 'Error de validación', details: errors });
  }
};

export const validateObjectId = (paramName = 'id') => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName]))
    return res.status(400).json({ error: true, message: `'${paramName}' no es un ID válido` });
  next();
};
