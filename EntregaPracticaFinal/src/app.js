import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { globalLimiter } from './middleware/rate-limit.js';
import { sanitize } from './middleware/sanitize.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

const app = express();

// ── Seguridad ──────────────────────────────────────────────────
app.use(cors());
app.use(helmet());
app.use(sanitize);
// Rate limiting desactivado en tests para no bloquear las peticiones
if (process.env.NODE_ENV !== 'test') app.use(globalLimiter);

// ── Logging ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── Body parsers ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Documentación Swagger ──────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Health ─────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    db: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ── API ────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Manejo de errores ──────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
