import express from 'express';
import { configureGoogle, passport } from '../services/google.service.js';

configureGoogle();

const router = express.Router();

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ success: false, error: { code: 'SERVICE_NOT_CONFIGURED', message: 'Google authentication is not configured.' } });
  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (error, result) => {
    if (error) return next(error);
    if (!result?.token) return next(new Error('Google authentication did not return a token.'));
    const frontendUrl = process.env.FRONTEND_URL || 'https://design.getminidesk.com/';
    return res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(result.token)}`);
  })(req, res, next);
});

export default router;
