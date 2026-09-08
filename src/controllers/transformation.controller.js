import prisma from '../utils/prisma.js';
import { createError, requireFields } from '../utils/errors.js';

function validateTransformation(body) {
  requireFields(body, ['imageId', 'roomType', 'budget', 'styles', 'colorPreference']);
  if (!Array.isArray(body.styles) || body.styles.length === 0 || body.styles.some((style) => typeof style !== 'string')) {
    throw createError(400, 'VALIDATION_ERROR', 'styles must be a non-empty array of strings.');
  }
}

export async function createTransformation(req, res) {
  validateTransformation(req.body);
  const image = await prisma.image.findFirst({ where: { id: req.body.imageId, userId: req.user.id, type: 'ORIGINAL' } });
  if (!image) throw createError(404, 'IMAGE_NOT_FOUND', 'Original image not found.');
  throw createError(402, 'PAYMENT_REQUIRED', 'Payment is required for every transformation. Create a payment order first.');
}

export async function listTransformations(req, res) {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const [items, total] = await Promise.all([
    prisma.transformation.findMany({ where: { userId: req.user.id }, include: { originalImage: true, generatedImage: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.transformation.count({ where: { userId: req.user.id } })
  ]);
  res.json({ success: true, data: { items: items.map(formatTransformation), page, limit, total } });
}

export async function getTransformation(req, res) {
  const item = await prisma.transformation.findFirst({ where: { id: req.params.id, userId: req.user.id }, include: { originalImage: true, generatedImage: true } });
  if (!item) throw createError(404, 'TRANSFORMATION_NOT_FOUND', 'Transformation not found.');
  res.json({ success: true, data: formatTransformation(item) });
}

function formatTransformation(item) {
  return { id: item.id, status: item.status, roomType: item.roomType, budget: item.budget, styles: item.styles, colorPreference: item.colorPreference, originalImageUrl: item.originalImage?.url, generatedImageUrl: item.generatedImage?.url, estimatedCost: item.estimatedCost, currency: 'INR', summary: item.summary, createdAt: item.createdAt, completedAt: item.completedAt };
}
