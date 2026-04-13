import { handleHttpError } from '../utils/handleError.js';

// Comprueba que el rol del usuario esté entre los roles permitidos
const checkRol = (roles) => (req, res, next) => {
  try {
    if (!roles.includes(req.user.role)) return handleHttpError(res, 'NOT_ALLOWED', 403);
    next();
  } catch (err) {
    handleHttpError(res, 'ERROR_PERMISSIONS', 403);
  }
};

export default checkRol;
