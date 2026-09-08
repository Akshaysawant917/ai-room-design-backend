import express from 'express';
import cors from 'cors';
import { configureGoogle, passport } from './services/google.service.js';

import authRoutes from './routes/auth.routes.js';
import imageRoutes from './routes/image.routes.js';
import transformationRoutes from './routes/transformation.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import userRoutes from './routes/user.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();
configureGoogle();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(passport.initialize());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/transformations', transformationRoutes);
app.use('/api/payments', paymentRoutes);

app.use(errorMiddleware);

export default app;
