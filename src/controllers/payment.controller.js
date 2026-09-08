import prisma from '../utils/prisma.js';
import { createOrder, FIRST_TRANSFORMATION_AMOUNT, REPEAT_TRANSFORMATION_AMOUNT, verifySignature } from '../services/razorpay.service.js';
import { startTransformation } from '../services/transformation.service.js';
import { createError, requireFields } from '../utils/errors.js';

export async function createPaymentOrder(req, res) {
  const data = req.body.transformationData;
  if (!data || typeof data !== 'object') throw createError(400, 'VALIDATION_ERROR', 'transformationData is required.');
  requireFields(data, ['imageId', 'roomType', 'budget', 'styles', 'colorPreference']);
  if (!Array.isArray(data.styles) || data.styles.length === 0) throw createError(400, 'VALIDATION_ERROR', 'styles must be a non-empty array.');
  const image = await prisma.image.findFirst({ where: { id: data.imageId, userId: req.user.id, type: 'ORIGINAL' } });
  if (!image) throw createError(404, 'IMAGE_NOT_FOUND', 'Original image not found.');
  const capturedTransformations = await prisma.payment.count({ where: { userId: req.user.id, status: 'CAPTURED' } });
  const amount = capturedTransformations === 0 ? FIRST_TRANSFORMATION_AMOUNT : REPEAT_TRANSFORMATION_AMOUNT;
  const order = await createOrder(amount);
  const transformation = await prisma.transformation.create({ data: { userId: req.user.id, originalImageId: image.id, roomType: data.roomType, budget: data.budget, styles: data.styles, colorPreference: data.colorPreference, status: 'PENDING' } });
  await prisma.payment.create({ data: { userId: req.user.id, transformationId: transformation.id, razorpayOrderId: order.id, amount: order.amount, currency: order.currency } });
  res.status(201).json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID, transformationId: transformation.id } });
}

export async function verifyPayment(req, res) {
  requireFields(req.body, ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature']);
  const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: req.body.razorpay_order_id, userId: req.user.id }, include: { transformation: true } });
  if (!payment) throw createError(404, 'PAYMENT_NOT_FOUND', 'Payment order not found.');
  if (!verifySignature(req.body.razorpay_order_id, req.body.razorpay_payment_id, req.body.razorpay_signature)) throw createError(400, 'PAYMENT_INVALID', 'Payment signature is invalid.');
  await prisma.payment.update({ where: { id: payment.id }, data: { razorpayPaymentId: req.body.razorpay_payment_id, razorpaySignature: req.body.razorpay_signature, status: 'CAPTURED', paidAt: new Date() } });
  await prisma.transformation.update({ where: { id: payment.transformationId }, data: { status: 'PROCESSING' } });
  startTransformation(payment.transformationId);
  res.json({ success: true, data: { transformationId: payment.transformationId, status: 'PROCESSING' } });
}
