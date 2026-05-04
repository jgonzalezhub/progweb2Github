import { createServer } from 'node:http';
import mongoose from 'mongoose';
import app from './app.js';
import dbConnect from './config/database.js';
import { initSocket } from './config/socket.js';

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = initSocket(httpServer);

const startServer = async () => {
  try {
    await dbConnect();
    httpServer.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
      console.log(`API en http://localhost:${PORT}/api`);
      console.log(`Swagger en http://localhost:${PORT}/api-docs`);
      console.log(`Health en http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('Error al iniciar el servidor:', err);
    process.exit(1);
  }
};

// ── Graceful shutdown ──────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n${signal} recibido. Apagando servidor...`);

  // Timeout de seguridad: forzar salida a los 10s
  const forceTimeout = setTimeout(() => {
    console.error('Apagado forzado por timeout');
    process.exit(1);
  }, 10_000);
  forceTimeout.unref();

  httpServer.close(async () => {
    try {
      io.close(() => console.log('Socket.IO cerrado'));
      await mongoose.connection.close();
      console.log('MongoDB desconectado. Proceso finalizado.');
      process.exit(0);
    } catch (err) {
      console.error('Error en shutdown:', err.message);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
