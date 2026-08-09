export const swaggerSchemas = {
  ApiResponse: {
    type: 'object',
    required: ['success', 'message'],
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      data: {},
    },
  },
  ErrorResponse: {
    type: 'object',
    required: ['success', 'message'],
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string' },
    },
  },
  User: {
    type: 'object',
    required: ['id', 'name', 'email', 'role', 'isEmailVerified'],
    properties: {
      id: { type: 'string', example: '66f2e6d6f1d2c8a3f1f5b7a1' },
      name: { type: 'string', example: 'Ghulam Qadir' },
      email: { type: 'string', format: 'email', example: 'ghulam.qadir@zweidevs.com' },
      role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
      isEmailVerified: { type: 'boolean', example: false },
    },
  },
  UserListItem: {
    allOf: [
      { $ref: '#/components/schemas/User' },
      {
        type: 'object',
        required: ['createdAt'],
        properties: {
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    ],
  },
  RegisterBody: {
    type: 'object',
    required: ['name', 'email', 'password', 'confirmPassword'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 80, example: 'Ghulam Qadir' },
      email: { type: 'string', format: 'email', example: 'ghulam.qadir@zweidevs.com' },
      password: { type: 'string', minLength: 8, maxLength: 128, example: 'Test@123' },
      confirmPassword: { type: 'string', minLength: 8, maxLength: 128, example: 'Test@123' },
    },
  },
  RegisterResponse: {
    type: 'object',
    required: ['success', 'message', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      message: {
        type: 'string',
        example: 'Registration successful. Please check your email to verify your account.',
      },
      data: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { $ref: '#/components/schemas/User' },
        },
      },
    },
  },
  LoginBody: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'ghulam.qadir@zweidevs.com' },
      password: { type: 'string', example: 'Test@123' },
    },
  },
  AuthResponse: {
    type: 'object',
    required: ['success', 'message', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Login successful' },
      data: {
        type: 'object',
        required: ['token', 'user'],
        properties: {
          token: { type: 'string', description: 'Application JWT bearer token' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
    },
  },
  GoogleLoginBody: {
    type: 'object',
    required: ['credential'],
    properties: {
      credential: {
        type: 'string',
        maxLength: 10000,
        description: 'Google Identity Services ID token returned to the browser',
      },
      password: {
        type: 'string',
        maxLength: 128,
        description: 'Required once when linking an existing password account',
      },
    },
  },
  ForgotPasswordBody: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email', example: 'ghulam.qadir@zweidevs.com' },
    },
  },
  ResetPasswordBody: {
    type: 'object',
    required: ['token', 'password'],
    properties: {
      token: { type: 'string', description: 'Password reset token from the email link' },
      password: { type: 'string', minLength: 8, maxLength: 128, example: 'NewTest@123' },
    },
  },
  ChangePasswordBody: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: { type: 'string', example: 'Test@123' },
      newPassword: { type: 'string', minLength: 8, maxLength: 128, example: 'NewTest@123' },
    },
  },
  UpdateProfileBody: {
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 80, example: 'Ghulam Qadir' },
    },
  },
  UserResponse: {
    type: 'object',
    required: ['success', 'message', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'User fetched' },
      data: { $ref: '#/components/schemas/User' },
    },
  },
  UserListItemResponse: {
    type: 'object',
    required: ['success', 'message', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'User fetched' },
      data: { $ref: '#/components/schemas/UserListItem' },
    },
  },
  UserWrappedResponse: {
    type: 'object',
    required: ['success', 'message', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Email verified successfully' },
      data: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { $ref: '#/components/schemas/User' },
        },
      },
    },
  },
  PaginatedUsersResponse: {
    type: 'object',
    required: ['success', 'message', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Users fetched' },
      data: {
        type: 'object',
        required: ['users', 'total', 'page', 'totalPages'],
        properties: {
          users: {
            type: 'array',
            items: { $ref: '#/components/schemas/UserListItem' },
          },
          total: { type: 'integer', example: 42 },
          page: { type: 'integer', example: 1 },
          totalPages: { type: 'integer', example: 3 },
        },
      },
    },
  },
  CreatePaymentIntentBody: {
    type: 'object',
    required: ['amount'],
    properties: {
      amount: { type: 'integer', minimum: 50, description: 'Amount in cents', example: 2500 },
      currency: {
        type: 'string',
        minLength: 3,
        maxLength: 3,
        default: 'usd',
        example: 'usd',
      },
      metadata: {
        type: 'object',
        additionalProperties: { type: 'string' },
        example: { plan: 'monthly' },
      },
    },
  },
  PaymentIntentResponse: {
    type: 'object',
    required: ['success', 'message', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Payment intent created' },
      data: {
        type: 'object',
        required: ['clientSecret', 'paymentIntentId'],
        properties: {
          clientSecret: { type: 'string' },
          paymentIntentId: { type: 'string', example: 'pi_3N...' },
        },
      },
    },
  },
  Payment: {
    type: 'object',
    required: ['id', 'amount', 'currency', 'status', 'stripePaymentIntentId', 'createdAt'],
    properties: {
      id: { type: 'string', example: '66f2e6d6f1d2c8a3f1f5b7a1' },
      amount: { type: 'integer', example: 2500 },
      currency: { type: 'string', example: 'usd' },
      status: { type: 'string', enum: ['pending', 'succeeded', 'failed', 'refunded'] },
      stripePaymentIntentId: { type: 'string', example: 'pi_3N...' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  PaymentsResponse: {
    type: 'object',
    required: ['success', 'message', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Payments fetched' },
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Payment' },
      },
    },
  },
  UploadResponse: {
    type: 'object',
    required: ['success', 'message', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Image uploaded' },
      data: {
        type: 'object',
        required: ['url', 'key'],
        properties: {
          url: { type: 'string', format: 'uri' },
          key: { type: 'string', example: 'cogni-sacra/images/uuid' },
        },
      },
    },
  },
  MessageResponse: {
    type: 'object',
    required: ['success', 'message'],
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string' },
    },
  },
  StripeWebhookResponse: {
    type: 'object',
    required: ['received'],
    properties: {
      received: { type: 'boolean', example: true },
    },
  },
} as const;
