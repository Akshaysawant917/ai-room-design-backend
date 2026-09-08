import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { uploadImage } from '../controllers/image.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    callback(null, allowed.includes(file.mimetype));
  }
});

const router = express.Router();

router.post('/upload', authMiddleware, upload.single('image'), uploadImage);

export default router;
