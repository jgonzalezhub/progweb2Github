import 'dotenv/config';
import { httpServer } from './app.js';
import dbConnect from './config/db.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await dbConnect();
    httpServer.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
      console.log(`Chat en http://localhost:${PORT}/chat.html`);
      console.log(`API en http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar:', error);
    process.exit(1);
  }
};

startServer();
