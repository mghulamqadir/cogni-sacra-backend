import 'dotenv/config';

import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Swagger docs  → http://localhost:${env.PORT}/api-docs`);
  });
}

bootstrap().catch((err: unknown) => {
  logger.error('Failed to start server', { err });
  process.exit(1);
});
