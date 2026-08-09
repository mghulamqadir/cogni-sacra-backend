import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { setupSwagger } from './config/swagger.js';
import webhookRoutes from './routes/webhook.routes.js';
import router from './routes/index.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    // every URL is allowed to access the API, but credentials are allowed
    origin: '*',
    credentials: true,
  })
);

app.use('/webhooks', webhookRoutes);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(
  morgan('combined', {
    stream: {
      write: (msg: string) => logger.info(msg.trim()),
    },
  })
);

app.use('/api', router);

setupSwagger(app);

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

export default app;
