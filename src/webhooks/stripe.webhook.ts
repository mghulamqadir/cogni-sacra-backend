import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import { stripe } from '../config/stripe.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { handlePaymentSucceeded, handlePaymentFailed } from '../services/payment.service.js';

type StripeEventHandler = (event: Stripe.Event) => Promise<void>;

function getStripeSignatureOrThrow(req: Request): string {
  const signature = req.headers['stripe-signature'];

  if (typeof signature !== 'string') {
    throw new AppError('Missing Stripe signature header', 400);
  }

  return signature;
}

function constructStripeEvent(req: Request, signature: string): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(req.body as Buffer, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new AppError('Webhook signature verification failed', 400);
  }
}

function createStripeEventHandlers(): Record<string, StripeEventHandler> {
  return {
    'payment_intent.succeeded': async (stripeEvent) => {
      const intent = stripeEvent.data.object as Stripe.PaymentIntent;
      await handlePaymentSucceeded(intent.id);
    },
    'payment_intent.payment_failed': async (stripeEvent) => {
      const intent = stripeEvent.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(intent.id);
    },
    'customer.subscription.deleted': async (stripeEvent) => {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      logger.info('Subscription deleted', { subscriptionId: subscription.id });
    },
    'customer.subscription.updated': async (stripeEvent) => {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      logger.info('Subscription updated', { subscriptionId: subscription.id });
    },
  };
}

async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  const handler = createStripeEventHandlers()[event.type];

  if (handler === undefined) {
    logger.info(`Unhandled Stripe event type: ${event.type}`);
    return;
  }

  await handler(event);
}

export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const signature = getStripeSignatureOrThrow(req);
  const event = constructStripeEvent(req, signature);

  logger.info(`Stripe event received: ${event.type}`);
  await handleStripeEvent(event);
  res.status(200).json({ received: true });
}
