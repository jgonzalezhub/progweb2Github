import { Server } from 'socket.io';
import { verifyToken } from '../utils/handleJwt.js';
import User from '../models/User.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication error'));

      const payload = verifyToken(token);
      if (!payload?._id) return next(new Error('Invalid token'));

      const user = await User.findOne({ _id: payload._id, deletedAt: null });
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      if (user.company) socket.join(user.company.toString());
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket conectado: ${socket.id} | usuario: ${socket.user?.email}`);
    socket.on('disconnect', (reason) => {
      console.log(`Socket desconectado: ${socket.id} — ${reason}`);
    });
  });

  return io;
};

export const getIO = () => io;
