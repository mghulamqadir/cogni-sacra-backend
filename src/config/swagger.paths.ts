import { env } from './env.js';

const jsonBody = (schema: { $ref: string }) => ({
  required: true,
  content: {
    'application/json': { schema },
  },
});

const response = (description: string, schemaRef?: string) => ({
  description,
  ...(schemaRef === undefined
    ? {}
    : {
        content: {
          'application/json': {
            schema: { $ref: schemaRef },
          },
        },
      }),
});

const errorResponse = (description: string) =>
  response(description, '#/components/schemas/ErrorResponse');

const bearerSecurity = [{ bearerAuth: [] }];

export const swaggerPaths = {
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new user',
      description:
        'Creates an unverified password user and sends an email verification link. This endpoint does not return an auth token.',
      requestBody: jsonBody({ $ref: '#/components/schemas/RegisterBody' }),
      responses: {
        201: response('Registration successful', '#/components/schemas/RegisterResponse'),
        409: errorResponse('Email already registered'),
        422: errorResponse('Validation error'),
        500: errorResponse('Email provider or server error'),
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login with email and password',
      requestBody: jsonBody({ $ref: '#/components/schemas/LoginBody' }),
      responses: {
        200: response('Login successful', '#/components/schemas/AuthResponse'),
        401: errorResponse('Invalid email or password'),
        422: errorResponse('Validation error'),
      },
    },
  },
  '/auth/google': {
    post: {
      tags: ['Auth'],
      summary: 'Login or register with Google',
      description:
        'Verifies a Google ID token. If the email belongs to an existing password account, password may be required once to link Google.',
      requestBody: jsonBody({ $ref: '#/components/schemas/GoogleLoginBody' }),
      responses: {
        200: response('Google login successful', '#/components/schemas/AuthResponse'),
        401: errorResponse('Invalid Google credential or unverified Google email'),
        409: errorResponse('Google account conflict'),
        422: errorResponse('Validation error'),
      },
    },
  },
  '/auth/verify-email': {
    get: {
      tags: ['Auth'],
      summary: 'Verify email address',
      parameters: [
        {
          name: 'token',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'Email verification token from the verification link',
        },
      ],
      responses: {
        200: response('Email verified successfully', '#/components/schemas/UserWrappedResponse'),
        400: errorResponse('Verification token is required'),
        401: errorResponse('Invalid or expired verification token'),
        404: errorResponse('User not found'),
      },
    },
  },
  '/auth/forgot-password': {
    post: {
      tags: ['Auth'],
      summary: 'Send password reset email',
      requestBody: jsonBody({ $ref: '#/components/schemas/ForgotPasswordBody' }),
      responses: {
        200: response('Password reset email sent', '#/components/schemas/MessageResponse'),
        400: errorResponse('Email is not registered'),
        422: errorResponse('Validation error'),
        500: errorResponse('Email provider or server error'),
      },
    },
  },
  '/auth/reset-password': {
    post: {
      tags: ['Auth'],
      summary: 'Reset password',
      requestBody: jsonBody({ $ref: '#/components/schemas/ResetPasswordBody' }),
      responses: {
        200: response('Password reset successfully', '#/components/schemas/UserWrappedResponse'),
        401: errorResponse('Invalid or expired password reset token'),
        422: errorResponse('Validation error'),
      },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Get current authenticated user',
      security: bearerSecurity,
      responses: {
        200: response('User fetched', '#/components/schemas/UserResponse'),
        401: errorResponse('Missing, invalid, or expired bearer token'),
        404: errorResponse('User not found'),
      },
    },
  },
  '/auth/change-password': {
    patch: {
      tags: ['Auth'],
      summary: 'Change current user password',
      security: bearerSecurity,
      requestBody: jsonBody({ $ref: '#/components/schemas/ChangePasswordBody' }),
      responses: {
        200: response('Password changed successfully', '#/components/schemas/MessageResponse'),
        400: errorResponse('Current password is incorrect'),
        401: errorResponse('Missing, invalid, or expired bearer token'),
        404: errorResponse('User not found'),
        422: errorResponse('Validation error'),
      },
    },
  },
  '/users/me': {
    get: {
      tags: ['Users'],
      summary: 'Get own profile',
      security: bearerSecurity,
      responses: {
        200: response('Profile fetched', '#/components/schemas/UserListItemResponse'),
        401: errorResponse('Missing, invalid, or expired bearer token'),
        404: errorResponse('User not found'),
      },
    },
    patch: {
      tags: ['Users'],
      summary: 'Update own profile',
      security: bearerSecurity,
      requestBody: jsonBody({ $ref: '#/components/schemas/UpdateProfileBody' }),
      responses: {
        200: response('Profile updated', '#/components/schemas/UserListItemResponse'),
        401: errorResponse('Missing, invalid, or expired bearer token'),
        404: errorResponse('User not found'),
        422: errorResponse('Validation error'),
      },
    },
  },
  '/users': {
    get: {
      tags: ['Users'],
      summary: 'List users',
      description: 'Admin only.',
      security: bearerSecurity,
      parameters: [
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
        {
          name: 'role',
          in: 'query',
          required: false,
          schema: { type: 'string', enum: ['user', 'admin'] },
        },
        {
          name: 'search',
          in: 'query',
          required: false,
          schema: { type: 'string', maxLength: 100 },
          description: 'Case-insensitive search across name and email',
        },
      ],
      responses: {
        200: response('Users fetched', '#/components/schemas/PaginatedUsersResponse'),
        401: errorResponse('Missing, invalid, or expired bearer token'),
        403: errorResponse('Admin role required'),
        422: errorResponse('Validation error'),
      },
    },
  },
  '/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Get user by ID',
      description: 'Admin only.',
      security: bearerSecurity,
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: response('User fetched', '#/components/schemas/UserListItemResponse'),
        401: errorResponse('Missing, invalid, or expired bearer token'),
        403: errorResponse('Admin role required'),
        404: errorResponse('User not found'),
      },
    },
    delete: {
      tags: ['Users'],
      summary: 'Delete user by ID',
      description: 'Admin only.',
      security: bearerSecurity,
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: response('User deleted', '#/components/schemas/MessageResponse'),
        401: errorResponse('Missing, invalid, or expired bearer token'),
        403: errorResponse('Admin role required'),
        404: errorResponse('User not found'),
      },
    },
  },
  '/payments/create-intent': {
    post: {
      tags: ['Payments'],
      summary: 'Create a Stripe payment intent',
      security: bearerSecurity,
      requestBody: jsonBody({ $ref: '#/components/schemas/CreatePaymentIntentBody' }),
      responses: {
        201: response('Payment intent created', '#/components/schemas/PaymentIntentResponse'),
        401: errorResponse('Missing, invalid, or expired bearer token'),
        404: errorResponse('User not found'),
        422: errorResponse('Validation error'),
        500: errorResponse('Stripe or server error'),
      },
    },
  },
  '/payments/my-payments': {
    get: {
      tags: ['Payments'],
      summary: 'Get current user payment history',
      security: bearerSecurity,
      responses: {
        200: response('Payments fetched', '#/components/schemas/PaymentsResponse'),
        401: errorResponse('Missing, invalid, or expired bearer token'),
      },
    },
  },
  '/media/image': {
    post: {
      tags: ['Media'],
      summary: 'Upload an image to Cloudinary',
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['image'],
              properties: {
                image: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: {
        201: response('Image uploaded', '#/components/schemas/UploadResponse'),
        400: errorResponse('No file provided'),
        401: errorResponse('Missing, invalid, or expired bearer token'),
        500: errorResponse('Cloudinary or server error'),
      },
    },
  },
  '/media/video': {
    post: {
      tags: ['Media'],
      summary: 'Upload a video to Cloudinary',
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['video'],
              properties: {
                video: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: {
        201: response('Video uploaded', '#/components/schemas/UploadResponse'),
        400: errorResponse('No file provided'),
        401: errorResponse('Missing, invalid, or expired bearer token'),
        500: errorResponse('Cloudinary or server error'),
      },
    },
  },
  '/webhooks/stripe': {
    post: {
      tags: ['Webhooks'],
      summary: 'Receive Stripe webhook events',
      description:
        'Mounted outside /api. Stripe sends a raw JSON body with a stripe-signature header.',
      servers: [{ url: env.SERVER_URL }],
      parameters: [
        {
          name: 'stripe-signature',
          in: 'header',
          required: true,
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true },
          },
        },
      },
      responses: {
        200: response('Webhook received', '#/components/schemas/StripeWebhookResponse'),
        400: errorResponse('Missing or invalid Stripe signature'),
      },
    },
  },
} as const;
