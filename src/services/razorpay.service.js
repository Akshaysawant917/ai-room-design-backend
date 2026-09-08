import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { createError } from '../utils/errors.js';

export const FIRST_TRANSFORMATION_AMOUNT = 2900;
export const REPEAT_TRANSFORMATION_AMOUNT = 7900;

function getClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw createError(503, 'SERVICE_NOT_CONFIGURED', 'Razorpay is not configured.');
  }
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

export function createOrder(amount) {
  return getClient().orders.create({ amount, currency: 'INR', receipt: `transform_${Date.now()}` });
}

export function verifySignature(orderId, paymentId, signature) {
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}
