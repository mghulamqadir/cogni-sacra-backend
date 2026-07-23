import { stripe } from '../config/stripe.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import type { CreatePaymentIntentDto, PaymentIntentResult, PaymentDto } from '../dtos/index.js';

async function getUserOrThrow(userId: string) {
  const user = await User.findById(userId).lean().exec();

  if (user === null) {
    throw new AppError('User not found', 404);
  }

  return user;
}

async function ensureStripeCustomerId(userId: string): Promise<string> {
  const user = await getUserOrThrow(userId);

  if (user.stripeCustomerId !== undefined) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
  });

  await User.findByIdAndUpdate(userId, { stripeCustomerId: customer.id }).exec();

  return customer.id;
}

async function createPendingPaymentRecord(
  userId: string,
  dto: CreatePaymentIntentDto,
  paymentIntentId: string
): Promise<void> {
  await Payment.create({
    userId,
    stripePaymentIntentId: paymentIntentId,
    amount: dto.amount,
    currency: dto.currency,
    status: 'pending',
    metadata: dto.metadata,
  });
}

export async function createPaymentIntent(
  userId: string,
  dto: CreatePaymentIntentDto
): Promise<PaymentIntentResult> {
  const stripeCustomerId = await ensureStripeCustomerId(userId);

  const intent = await stripe.paymentIntents.create({
    amount: dto.amount,
    currency: dto.currency,
    customer: stripeCustomerId,
    metadata: { userId, ...dto.metadata },
  });

  if (intent.client_secret === null) {
    throw new AppError('Failed to create payment intent', 500);
  }

  await createPendingPaymentRecord(userId, dto, intent.id);

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
}

export async function getPaymentsByUser(userId: string): Promise<PaymentDto[]> {
  const payments = await Payment.find({ userId }).lean().exec();

  return payments.map((p) => ({
    id: p._id.toString(),
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    stripePaymentIntentId: p.stripePaymentIntentId,
    createdAt: p.createdAt,
  }));
}

// Called from the Stripe webhook — not from a controller directly
export async function handlePaymentSucceeded(paymentIntentId: string): Promise<void> {
  await Payment.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntentId },
    { status: 'succeeded' }
  ).exec();
}

export async function handlePaymentFailed(paymentIntentId: string): Promise<void> {
  await Payment.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntentId },
    { status: 'failed' }
  ).exec();
}
