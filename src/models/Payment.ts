import { Schema, model } from 'mongoose';
import type { Document, Model, Types } from 'mongoose';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface IPayment {
  userId: Types.ObjectId;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentDocument extends IPayment, Document<Types.ObjectId> {}

type IPaymentModel = Model<IPaymentDocument>;

const paymentSchema = new Schema<IPaymentDocument, IPaymentModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      lowercase: true,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'] satisfies PaymentStatus[],
      default: 'pending',
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true }
);

export const Payment = model<IPaymentDocument, IPaymentModel>('Payment', paymentSchema);
