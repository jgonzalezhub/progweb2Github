import mongoose from 'mongoose';

// Valida body, query y params de la petición usando un schema Zod
export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.parse({ body: req.body, query: req.query, params: req.params });
    if (result.body !== undefined) req.body = result.body;
    if (result.query !== undefined) req.query = result.query;
    if (result.params !== undefined) req.params = result.params;
    next();
  } catch (error) {
    const errors = error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    res.status(400).json({ error: true, message: 'Error de validación', details: errors });
  }
};

// Comprueba que el parámetro de ruta indicado sea un ObjectId de MongoDB válido
export const validateObjectId = (paramName = 'id') => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName]))
    return res.status(400).json({ error: true, message: `'${paramName}' no es un ID válido` });
  next();
};
