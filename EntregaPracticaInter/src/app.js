import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ============================================
// Middleware globales
// ============================================
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: true, message: 'Demasiadas peticiones, intenta más tarde' }
});
app.use(limiter);

// Archivos estáticos
app.use('/uploads', express.static(join(__dirname, '../storage')));

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

export default app;
