import { roomsModel, messagesModel } from '../../models/index.js';

export const registerRoomHandlers = (io, socket) => {
  // Unirse a una sala
  const joinRoom = async (data, callback) => {
    try {
      const { roomId } = data;

      const room = await roomsModel.findById(roomId);
      if (!room) {
        if (callback) callback({ success: false, error: 'ROOM_NOT_FOUND' });
        return;
      }

      socket.join(roomId);

      // Usuarios actualmente en la sala
      const socketsInRoom = await io.in(roomId).fetchSockets();
      const users = socketsInRoom.map(s => ({ _id: s.user._id, name: s.user.name }));

      // Notificar al resto de la sala
      socket.to(roomId).emit('room:user-joined', {
        user: { _id: socket.user._id, name: socket.user.name }
      });

      // Historial de mensajes recientes
      const history = await messagesModel
        .find({ room: roomId })
        .populate('sender', 'name')
        .sort({ createdAt: -1 })
        .limit(50);

      if (callback) callback({
        success: true,
        room: { _id: room._id, name: room.name, description: room.description },
        users,
        history: history.reverse().map(m => ({
          _id: m._id,
          user: { _id: m.sender._id, name: m.sender.name },
          content: m.content,
          timestamp: m.createdAt
        }))
      });

      console.log(`✅ ${socket.user.name} se unió a la sala "${room.name}"`);
    } catch (err) {
      console.error('❌ Error joinRoom:', err.message);
      if (callback) callback({ success: false, error: 'ERROR_JOIN_ROOM' });
    }
  };

  // Salir de una sala
  const leaveRoom = (data) => {
    const { roomId } = data;
    socket.leave(roomId);
    socket.to(roomId).emit('room:user-left', {
      user: { _id: socket.user._id, name: socket.user.name }
    });
    console.log(`👋 ${socket.user.name} salió de la sala ${roomId}`);
  };

  // Limpiar al desconectar
  const handleDisconnect = () => {
    socket.rooms.forEach(roomId => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('room:user-left', {
          user: { _id: socket.user._id, name: socket.user.name }
        });
      }
    });
  };

  socket.on('room:join', joinRoom);
  socket.on('room:leave', leaveRoom);
  socket.on('disconnect', handleDisconnect);
};
