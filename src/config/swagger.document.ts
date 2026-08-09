import { env } from './env.js';
import { swaggerPaths } from './swagger.paths.js';
import { swaggerSchemas } from './swagger.schemas.js';

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Cogni Sacra API',
    version: '1.0.0',
    description: 'Backend API for Cogni Sacra',
  },
  servers: [
    {
      url: `${env.SERVER_URL}/api`,
      description: 'API server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: swaggerSchemas,
  },
  paths: swaggerPaths,
} as const;
