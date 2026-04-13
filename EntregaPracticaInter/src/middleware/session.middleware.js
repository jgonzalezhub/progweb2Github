import { verifyToken } from '../utils/handleJwt.js';
import { handleHttpError } from '../utils/handleError.js';
import { usersModel } from '../models/index.js';

// Verifica el JWT del header Authorization y adjunta el usuario autenticado a req.user
const authMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization) return handleHttpError(res, 'NOT_TOKEN', 401);

    const token = req.headers.authorization.split(' ').pop();
    const dataToken = await verifyToken(token);

    if (!dataToken?._id) return handleHttpError(res, 'ERROR_ID_TOKEN', 401);

    const user = await usersModel.findOne({ _id: dataToken._id, deletedAt: null });
    if (!user) return handleHttpError(res, 'USER_NOT_FOUND', 401);

    req.user = user;
    next();
  } catch (err) {
    handleHttpError(res, 'NOT_SESSION', 401);
  }
};

export default authMiddleware;
