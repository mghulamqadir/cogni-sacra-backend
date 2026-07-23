# Cogni Sacra Backend

The backend API for **Cogni Sacra**, built with Express.js, TypeScript, and MongoDB. It includes authentication, payments, transactional email, and Cloudinary media uploads.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-success?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%3E%3D5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/express-^5.1.0-black?logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

## 🌟 Features

### Core Architecture

- ✅ **TypeScript** - Strongly typed codebase for better development experience
- ✅ **Express.js 5.x** - Modern, minimal, and flexible web framework
- ✅ **MongoDB + Mongoose** - NoSQL database with schema validation
- ✅ **Modular Structure** - Organized by routes, controllers, services, and models
- ✅ **Environment Configuration** - Flexible `.env` based configuration

### Security & Performance

- 🔒 **Helmet.js** - HTTP headers security
- 🔐 **JWT Authentication** - Secure token-based authentication
- 🛡️ **CORS** - Cross-Origin Resource Sharing support
- 💨 **Rate Limiting** - Built-in rate limiting to prevent abuse
- ✨ **Input Validation** - Joi schema validation on all inputs
- 🧹 **Data Sanitization** - MongoDB injection prevention with express-mongo-sanitize

### Features Integration

- 💳 **Stripe Payments** - Complete payment processing with webhooks
- 📧 **Email Service** - Brevo (Sendinblue) integration for transactional emails
- 📁 **File Upload** - Cloudinary integration for optimized images and videos
- 🖼️ **Image Processing** - Sharp for high-performance image optimization
- 📊 **API Documentation** - Swagger/OpenAPI documentation UI
- 📝 **Logging** - Morgan HTTP request logging with Winston integration
- ⏰ **Cron Jobs** - Background task scheduling with node-cron

### Developer Experience

- 🎯 **ESLint** - Code quality linting with modern configs
- 💅 **Prettier** - Code formatting
- 🐶 **Husky** - Git hooks for code quality enforcement
- 🚀 **Hot Reload** - `tsx watch` for development
- 📚 **Type Safety** - Strict TypeScript configuration

---

## 📋 Project Structure

```
src/
├── app.ts                    # Express app setup
├── index.ts                  # Server entry point
├── config/                   # Configuration files
│   ├── database.ts          # MongoDB connection
│   ├── env.ts               # Environment variables
│   ├── cloudinary.ts        # Cloudinary client
│   ├── stripe.ts            # Stripe client
│   └── swagger.ts           # Swagger documentation
├── controllers/             # Request handlers
│   ├── auth.controller.ts
│   ├── media.controller.ts
│   ├── payment.controller.ts
│   └── user.controller.ts
├── middlewares/             # Express middlewares
│   ├── authenticate.ts      # JWT verification
│   ├── errorHandler.ts      # Global error handling
│   ├── upload.ts            # File upload handling
│   └── validate.ts          # Request validation
├── models/                  # Mongoose schemas
│   ├── User.ts
│   └── Payment.ts
├── routes/                  # API routes
│   ├── auth.routes.ts
│   ├── media.routes.ts
│   ├── payment.routes.ts
│   ├── user.routes.ts
│   └── webhook.routes.ts
├── services/                # Business logic
│   ├── auth.service.ts
│   ├── email.service.ts
│   ├── media.service.ts
│   ├── payment.service.ts
│   └── user.service.ts
├── types/                   # TypeScript types
│   └── index.ts
├── utils/                   # Utility functions
│   ├── AppError.ts          # Custom error class
│   ├── asyncHandler.ts      # Async error wrapper
│   ├── logger.ts            # Winston logger
│   └── response.ts          # Standardized responses
├── validations/             # Joi schemas
│   ├── auth.validation.ts
│   ├── payment.validation.ts
│   └── user.validation.ts
└── webhooks/               # Webhooks handlers
    └── stripe.webhook.ts
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 24
- **npm** or **yarn**
- **MongoDB** (local or Atlas URI)
- **Cloudinary** credentials (for file uploads)
- **Stripe** API keys
- **Brevo** API key (for emails)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mghulamqadir/cogni-sacra-backend.git
   cd cogni-sacra-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create environment file**

   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env`**

   ```env
   # Server
   PORT=3000
   NODE_ENV=development

   # Database
   MONGO_URI=mongodb://localhost:27017/cogni_sacra

   # JWT
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_test_...

   # Email (Brevo)
   BREVO_API_KEY=your_brevo_api_key
   BREVO_SENDER_EMAIL=noreply@example.com

   # CORS
   CLIENT_URL=http://localhost:3000
   ```

5. **Build the project**

   ```bash
   npm run build
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:3000`

---

## 📖 Available Scripts

| Script             | Description                              |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Start development server with hot reload |
| `npm run build`    | Compile TypeScript to JavaScript         |
| `npm start`        | Start production server                  |
| `npm run lint`     | Run ESLint for code quality              |
| `npm run lint:fix` | Auto-fix ESLint issues                   |
| `npm run format`   | Format code with Prettier                |

---

## 🔑 Key Features Explained

### Authentication

JWT-based authentication with secure token generation and verification

- User registration and login
- Password hashing with bcryptjs
- Protected routes with `authenticate` middleware

### Payment Processing

Stripe integration for secure payment handling

- Payment creation and processing
- Webhook handling for payment events
- Transaction logging and status tracking

### File Upload & Storage

Cloudinary integration for image and video uploads

- Image optimization using Sharp
- Image uploads up to 5 MB and video uploads up to 100 MB
- Secure file upload middleware

### Error Handling

Comprehensive error handling with custom AppError class

- Standardized error responses
- Async error wrapper for controller functions
- Global error middleware for uncaught errors

```typescript
throw new AppError('Invalid credentials', 401);
```

### Input Validation

Joi schema validation on all endpoints

- Automatic request validation
- Clear error messages
- Type-safe validation schemas

### Logging

Morgan-based HTTP request logging with Winston integration

- HTTP request logging via Morgan
- Application error logging via Winston
- Structured log formats with timestamps

---

## 📚 API Documentation

Interactive Swagger documentation is available at:

```
http://localhost:3000/api-docs
```

Documentation is automatically generated from route definitions and can be customized in `src/config/swagger.ts`

---

## 🔐 Security Best Practices

This boilerplate includes:

- ✅ Helmet.js for HTTP security headers
- ✅ CORS configuration
- ✅ Rate limiting on API endpoints
- ✅ MongoDB injection prevention
- ✅ JWT token verification
- ✅ Password hashing with salt rounds
- ✅ Environment variable encryption (recommended)

**Additional Recommendations:**

- Always use HTTPS in production
- Rotate JWT secrets regularly
- Implement CSRF protection if needed
- Keep dependencies updated: `npm audit`

---

## 📦 Dependencies Overview

### Core

- **express** - Web framework
- **mongoose** - MongoDB ORM

### Authentication & Security

- **jsonwebtoken** - JWT implementation
- **bcryptjs** - Password hashing
- **helmet** - Security headers

### API Features

- **stripe** - Payment processing
- **cloudinary** - Image and video storage
- **@getbrevo/brevo** - Email service
- **multer** - File upload handling
- **sharp** - Image processing

### Validation & Quality

- **joi** - Schema validation
- **express-rate-limit** - Rate limiting

### Utilities

- **morgan** - HTTP request logging
- **uuid** - Unique identifier generation

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🆘 Troubleshooting

### Port already in use

```bash
# Change PORT in .env or use different port
PORT=3001 npm run dev
```

### MongoDB connection failed

- Verify MongoDB URI in `.env`
- Check network access (MongoDB Atlas)
- Ensure MongoDB service is running

### Cloudinary upload errors

- Verify Cloudinary credentials in `.env`
- Check your Cloudinary account storage and bandwidth limits
- Confirm the uploaded file type and size are supported

### Stripe webhook not working

- Verify webhook secret in `.env`
- Check Stripe endpoint configuration
- Ensure your app is publicly accessible

---
