export const handleHttpError = (res, message = 'Error', code = 500) => {
  res.status(code).json({
    error: true,
    message
  });
};