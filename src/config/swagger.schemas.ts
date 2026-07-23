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
} as const;
