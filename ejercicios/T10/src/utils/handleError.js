export const handleHttpError = (res, message = 'ERROR', code = 403) =>
  res.status(code).json({ error: true, message });
