import { stripe } from '../config/stripe.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import type { CreatePaymentIntentDto, PaymentIntentResult, PaymentDto } from '../dtos/index.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { UserRole } from '../types/index.js';
import { env } from '../config/env.js';
import type Stripe from 'stripe';

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

export async function createCourseCheckout(userId: string, courseId: string) {
  if (!env.FEATURE_PAID_ENROLLMENT)
    throw new AppError('Paid enrollment is disabled', 404, 'FEATURE_DISABLED');
  const [user, course] = await Promise.all([
    User.findById(userId).lean(),
    Course.findOne({ _id: courseId, visibility: 'public', status: 'published' }).lean(),
  ]);
  if (user?.role !== UserRole.IndependentLearner || course === null)
    throw new AppError('Public course not found', 404, 'NOT_FOUND');
  if (course.priceAmount == null || course.currency == null || course.priceAmount <= 0)
    throw new AppError('Course is not paid', 409, 'COURSE_NOT_PAID');
  const existing = await Enrollment.findOne({ courseId, learnerId: userId }).lean();
  if (existing !== null) return { enrollment: existing };
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: await ensureStripeCustomerId(userId),
    success_url: `${env.CLIENT_URL}/courses/${courseId}?checkout=success`,
    cancel_url: `${env.CLIENT_URL}/courses/${courseId}?checkout=cancelled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: course.currency.toLowerCase(),
          unit_amount: course.priceAmount,
          product_data: { name: course.title },
        },
      },
    ],
    metadata: {
      courseId,
      learnerId: userId,
      institutionId: course.institutionId?.toString() ?? '',
    },
  });
  return { checkoutSessionId: session.id, checkoutUrl: session.url };
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== 'paid') return;
  const { courseId, learnerId, institutionId = '' } = session.metadata ?? {};
  if (!courseId || !learnerId)
    throw new AppError('Checkout metadata is invalid', 400, 'INVALID_CHECKOUT_METADATA');
  const [course, user] = await Promise.all([
    Course.findOne({ _id: courseId, visibility: 'public', status: 'published' }).lean(),
    User.findById(learnerId).lean(),
  ]);
  if (
    course === null ||
    user?.role !== UserRole.IndependentLearner ||
    (course.institutionId?.toString() ?? '') !== institutionId
  )
    throw new AppError(
      'Checkout metadata does not match resources',
      400,
      'INVALID_CHECKOUT_METADATA'
    );
  await Enrollment.findOneAndUpdate(
    { courseId, learnerId },
    {
      $setOnInsert: {
        institutionId: course.institutionId,
        source: 'paid',
        enrolledAt: new Date(),
        stripeCheckoutSessionId: session.id,
      },
    },
    { upsert: true }
  );
}
