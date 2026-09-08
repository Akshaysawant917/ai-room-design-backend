import prisma from '../utils/prisma.js';
import { uploadBuffer } from '../services/cloudinary.service.js';
import { createError } from '../utils/errors.js';

export async function uploadImage(req, res) {
  if (!req.file) throw createError(400, 'VALIDATION_ERROR', 'An image file is required.');
  const uploaded = await uploadBuffer(req.file.buffer, `ai-home/${req.user.id}/originals`);
  const image = await prisma.image.create({ data: { userId: req.user.id, type: 'ORIGINAL', url: uploaded.url, publicId: uploaded.publicId } });
  res.status(201).json({ success: true, data: { id: image.id, url: image.url, type: image.type } });
}
