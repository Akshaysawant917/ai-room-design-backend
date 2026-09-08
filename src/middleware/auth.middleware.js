import prisma from '../utils/prisma.js';
import { verifyToken } from '../utils/jwt.js';
import { createError } from '../utils/errors.js';

export async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) throw createError(401, 'UNAUTHENTICATED', 'Authentication is required.');

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw createError(401, 'UNAUTHENTICATED', 'User no longer exists.');

    req.user = user;
    next();
  } catch (error) {
    next(error.statusCode ? error : createError(401, 'UNAUTHENTICATED', 'Invalid or expired token.'));
  }
}
