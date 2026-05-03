import { handleHttpError } from '../utils/handleError.js';

const checkRol = (roles) => (req, res, next) => {
  try {
    if (!roles.includes(req.user.role)) return handleHttpError(res, 'NOT_ALLOWED', 403);
    next();
  } catch {
    handleHttpError(res, 'ERROR_PERMISSIONS', 403);
  }
};

export default checkRol;
