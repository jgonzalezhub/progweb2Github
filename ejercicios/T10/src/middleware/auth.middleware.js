import { verifyToken } from '../utils/jwt.js';
import { handleHttpError } from '../utils/handleError.js';
import { usersModel } from '../models/index.js';

// Middleware HTTP para rutas REST
export const authMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization) return handleHttpError(res, 'NOT_TOKEN', 401);

    const token = req.headers.authorization.split(' ').pop(); // "Bearer <token>"
    const dataToken = verifyToken(token);

    if (!dataToken?._id) return handleHttpError(res, 'ERROR_ID_TOKEN', 401);

    const user = await usersModel.findById(dataToken._id);
    if (!user) return handleHttpError(res, 'USER_NOT_FOUND', 401);

    req.user = user;
    next();
  } catch (err) {
    handleHttpError(res, 'NOT_SESSION', 401);
  }
};

// Middleware Socket.IO para autenticación con JWT
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Token no proporcionado'));

    const decoded = verifyToken(token);
    if (!decoded?._id) return next(new Error('Token inválido'));

    const user = await usersModel.findById(decoded._id);
    if (!user) return next(new Error('Usuario no encontrado'));

    socket.user = user; // usuario completo disponible en handlers
    next();
  } catch (err) {
    next(new Error('Error de autenticación'));
  }
};
