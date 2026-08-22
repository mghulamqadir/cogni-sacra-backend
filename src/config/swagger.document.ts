import { env } from './env.js';
import { swaggerPaths } from './swagger.paths.js';
import { swaggerSchemas } from './swagger.schemas.js';

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Cogni Sacra API',
    version: '2.0.0',
    description: 'CogniSacra multi-tenant learning, public catalog, assessment, AI Tutor, library, and payments API. Use Authorize with the JWT returned by login.',
  },
  servers: [
    {
      url: `${env.SERVER_URL}/api/v1`,
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
  tags: [
    { name: 'Auth' }, { name: 'Users' }, { name: 'Institutions' }, { name: 'Courses' },
    { name: 'Course Builder' }, { name: 'Learning' }, { name: 'Assessments' },
    { name: 'AI Tutor' }, { name: 'Analytics' }, { name: 'Library' }, { name: 'Payments' },
    { name: 'Media' }, { name: 'Health' }, { name: 'Webhooks' },
  ],
  paths: swaggerPaths,
} as const;
