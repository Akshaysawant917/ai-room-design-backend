import prisma from '../utils/prisma.js';
import { generateRoomTransformation } from './openai.service.js';
import { uploadBuffer } from './cloudinary.service.js';

export async function startTransformation(transformationId) {
  const transformation = await prisma.transformation.findUnique({
    where: { id: transformationId },
    include: { originalImage: true }
  });
  if (!transformation) return;

  try {
    await prisma.transformation.update({ where: { id: transformationId }, data: { status: 'PROCESSING' } });
    const generated = await generateRoomTransformation({
      imageUrl: transformation.originalImage?.url,
      roomType: transformation.roomType,
      budget: transformation.budget,
      styles: transformation.styles,
      colorPreference: transformation.colorPreference
    });
    const uploaded = await uploadBuffer(generated.buffer, `ai-home/${transformation.userId}/generated`);
    const image = await prisma.image.create({ data: { userId: transformation.userId, type: 'GENERATED', url: uploaded.url, publicId: uploaded.publicId } });
    await prisma.transformation.update({
      where: { id: transformationId },
      data: { generatedImageId: image.id, summary: generated.summary, status: 'COMPLETED', completedAt: new Date() }
    });
  } catch (error) {
    await prisma.transformation.update({ where: { id: transformationId }, data: { status: 'FAILED' } });
    console.error('Transformation failed:', error);
  }
}
