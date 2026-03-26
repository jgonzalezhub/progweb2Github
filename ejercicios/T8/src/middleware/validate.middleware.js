// src/middleware/validate.middleware.js

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
    req.body = parsed.body ?? req.body;
    req.query = parsed.query ?? req.query;
    req.params = parsed.params ?? req.params;
    next();
  } catch (error) {
    const details = error.issues?.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    res.status(400).json({ error: true, message: 'Error de validación', details });
  }
};
