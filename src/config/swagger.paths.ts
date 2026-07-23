export const swaggerPaths = {
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterBody' },
          },
        },
      },
      responses: {
        201: { description: 'Registration successful' },
        409: { description: 'Email already registered' },
        422: { description: 'Validation error' },
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginBody' },
          },
        },
      },
      responses: {
        200: { description: 'Login successful' },
        401: { description: 'Invalid credentials' },
      },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Get current user',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'User fetched' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/users/me': {
    get: {
      tags: ['Users'],
      summary: 'Get own profile',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Profile fetched' } },
    },
    patch: {
      tags: ['Users'],
      summary: 'Update own profile',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Profile updated' } },
    },
  },
  '/payments/create-intent': {
    post: {
      tags: ['Payments'],
      summary: 'Create a Stripe payment intent',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amount'],
              properties: {
                amount: { type: 'integer', minimum: 50, description: 'Amount in cents' },
                currency: { type: 'string', default: 'usd' },
              },
            },
          },
        },
      },
      responses: { 201: { description: 'Payment intent created' } },
    },
  },
  '/payments/my-payments': {
    get: {
      tags: ['Payments'],
      summary: 'Get current user payment history',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Payments fetched' } },
    },
  },
  '/media/image': {
    post: {
      tags: ['Media'],
      summary: 'Upload an image to Cloudinary',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                image: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: { 201: { description: 'Image uploaded' } },
    },
  },
  '/media/video': {
    post: {
      tags: ['Media'],
      summary: 'Upload a video to Cloudinary',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                video: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: { 201: { description: 'Video uploaded' } },
    },
  },
} as const;
