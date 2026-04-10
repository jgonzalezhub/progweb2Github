import { messagesModel } from '../../models/index.js';

export const registerChatHandlers = (io, socket) => {
  // Enviar mensaje a una sala
  const sendMessage = async (data, callback) => {
    try {
      const { roomId, content } = data;
      if (!roomId || !content) {
        if (callback) callback({ success: false, error: 'roomId y content son requeridos' });
        return;
      }

      const message = await messagesModel.create({
        room: roomId,
        sender: socket.user._id,
        content
      });
      await message.populate('sender', 'name');

      io.to(roomId).emit('chat:message', {
        _id: message._id,
        user: { _id: message.sender._id, name: message.sender.name },
        content: message.content,
        timestamp: message.createdAt
      });

      if (callback) callback({ success: true, messageId: message._id });
    } catch (err) {
      console.error('❌ Error sendMessage:', err.message);
      if (callback) callback({ success: false, error: 'ERROR_SEND_MESSAGE' });
    }
  };

  // Indicador de escritura
  const typing = (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('chat:typing', {
      user: { _id: socket.user._id, name: socket.user.name }
    });
  };

  socket.on('chat:message', sendMessage);
  socket.on('chat:typing', typing);
};
