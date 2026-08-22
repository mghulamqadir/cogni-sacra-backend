import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import { swaggerDocument } from './swagger.document.js';

export function setupSwagger(app: Express): void {
  app.get('/api-docs.json', (_req, res) => res.json(swaggerDocument));
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
      },
    })
  );
}
