import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import { swaggerDocument } from './swagger.document.js';

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
