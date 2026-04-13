// Responde con un error HTTP estándar con el mensaje y código indicados
export const handleHttpError = (res, message = 'ERROR', code = 403) =>
  res.status(code).json({ error: true, message });
