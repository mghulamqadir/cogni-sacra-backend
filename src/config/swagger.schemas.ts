export const swaggerSchemas = {
  ApiResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      data: { type: 'object' },
    },
  },
  RegisterBody: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 80 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
    },
  },
  LoginBody: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
    },
  },
  GoogleLoginBody: {
    type: 'object',
    required: ['credential'],
    properties: {
      credential: {
        type: 'string',
        description: 'Google Identity Services ID token returned to the browser',
      },
      password: {
        type: 'string',
        description: 'Required once when linking an existing password account',
      },
    },
  },
} as const;
