import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { configureSocket } from './socket/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Configurar Socket.IO
const io = configureSocket(httpServer);

// ============================================
// Middleware globales
// ============================================
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (interfaz del chat)
app.use(express.static(join(__dirname, '../public')));

// ============================================
// Rutas
// ============================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

// ============================================
// Manejo de errores — SIEMPRE AL FINAL
// ============================================
app.use(notFound);
app.use(errorHandler);

export { app, httpServer, io };
export default app;
