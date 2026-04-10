import { Server } from 'socket.io';
import { socketAuthMiddleware } from '../middleware/session.middleware.js';
import { registerChatHandlers } from './handlers/chat.handler.js';
import { registerRoomHandlers } from './handlers/room.handler.js';

export const configureSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Autenticación JWT para Socket.IO
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`✅ Cliente conectado: ${socket.id} (${socket.user.name})`);

    // Notificar a todos que el usuario está online
    io.emit('user:online', { userId: socket.user._id, name: socket.user.name });

    // Registrar handlers
    registerChatHandlers(io, socket);
    registerRoomHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`❌ Cliente desconectado: ${socket.id} - ${reason}`);
      io.emit('user:offline', { userId: socket.user._id, name: socket.user.name });
    });

    socket.on('error', (error) => {
      console.error('Error de socket:', error);
    });
  });

  return io;
};
