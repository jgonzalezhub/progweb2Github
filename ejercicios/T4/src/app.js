import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import routes from './routes/index.js';
import { logger } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors());

app.use(express.json());

app.use(logger);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
