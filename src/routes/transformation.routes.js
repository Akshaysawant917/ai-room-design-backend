import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createTransformation, getTransformation, listTransformations } from '../controllers/transformation.controller.js';

const router = express.Router();

router.post('/', authMiddleware, createTransformation);

router.get('/', authMiddleware, listTransformations);

router.get('/:id', authMiddleware, getTransformation);

export default router;
