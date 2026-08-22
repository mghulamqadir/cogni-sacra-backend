import type { AppEnv } from '../types/index.js';

function get(key: keyof AppEnv, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const boolean = (value: string): boolean => value === 'true';

export const env: AppEnv = {
  NODE_ENV: (process.env['NODE_ENV'] ?? 'development') as AppEnv['NODE_ENV'],
  PORT: parseInt(process.env['PORT'] ?? '3000', 10),
  SERVER_URL: get('SERVER_URL', `http://localhost:${process.env['PORT'] ?? '3000'}`).replace(
    /\/$/,
    ''
  ),
  CLIENT_URL: get('CLIENT_URL', 'http://localhost:5173'),
  MONGO_URI: get('MONGO_URI'),
  JWT_SECRET: get('JWT_SECRET'),
  JWT_EXPIRES_IN: get('JWT_EXPIRES_IN', '7d'),
  GOOGLE_CLIENT_ID: get('GOOGLE_CLIENT_ID'),
  STRIPE_SECRET_KEY: get('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: get('STRIPE_WEBHOOK_SECRET'),
  CLOUDINARY_CLOUD_NAME: get('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: get('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: get('CLOUDINARY_API_SECRET'),
  BREVO_API_KEY: get('BREVO_API_KEY'),
  SENDER_EMAIL: get('SENDER_EMAIL'),
  SENDER_NAME: get('SENDER_NAME'),
  AI_PROVIDER: get('AI_PROVIDER', 'anthropic'),
  AI_API_KEY: get('AI_API_KEY', ''),
  AI_MODEL: get('AI_MODEL', 'claude-sonnet-4-6'),
  AI_TUTOR_MAX_CONTEXT_TOKENS: Number(get('AI_TUTOR_MAX_CONTEXT_TOKENS', '6000')),
  AI_TUTOR_MAX_QUESTION_CHARS: Number(get('AI_TUTOR_MAX_QUESTION_CHARS', '2000')),
  AI_TUTOR_RATE_LIMIT_PER_HOUR: Number(get('AI_TUTOR_RATE_LIMIT_PER_HOUR', '30')),
  FEATURE_VIRTUAL_LIBRARY: boolean(get('FEATURE_VIRTUAL_LIBRARY', 'false')),
  FEATURE_PAID_ENROLLMENT: boolean(get('FEATURE_PAID_ENROLLMENT', 'false')),
  LOG_LEVEL: get('LOG_LEVEL', 'info'),
};
