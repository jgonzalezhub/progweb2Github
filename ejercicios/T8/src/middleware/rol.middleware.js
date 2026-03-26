// src/middleware/rol.middleware.js
import { handleHttpError } from '../utils/handleError.js';

const checkRol = (roles) => (req, res, next) => {
  try {
    const { user } = req;
    if (!roles.includes(user.role)) {
      return handleHttpError(res, 'NOT_ALLOWED', 403);
    }
    next();
  } catch (err) {
    handleHttpError(res, 'ERROR_PERMISSIONS', 403);
  }
};

export default checkRol;
