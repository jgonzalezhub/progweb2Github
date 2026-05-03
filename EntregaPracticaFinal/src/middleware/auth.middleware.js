import { verifyToken } from '../utils/handleJwt.js';
import { handleHttpError } from '../utils/handleError.js';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization) return handleHttpError(res, 'NOT_TOKEN', 401);

    const token = req.headers.authorization.split(' ').pop();
    const dataToken = verifyToken(token);

    if (!dataToken?._id) return handleHttpError(res, 'ERROR_ID_TOKEN', 401);

    const user = await User.findOne({ _id: dataToken._id, deletedAt: null });
    if (!user) return handleHttpError(res, 'USER_NOT_FOUND', 401);

    req.user = user;
    next();
  } catch {
    handleHttpError(res, 'NOT_SESSION', 401);
  }
};

export default authMiddleware;
