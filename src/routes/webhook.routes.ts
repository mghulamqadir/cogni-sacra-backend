import { Router } from 'express';
import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { stripeWebhookHandler } from '../webhooks/stripe.webhook.js';

const router = Router();

// Stripe requires the raw request body for signature verification.
// express.raw() is applied only to this route, not globally.
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  asyncHandler(stripeWebhookHandler)
);

export default router;
