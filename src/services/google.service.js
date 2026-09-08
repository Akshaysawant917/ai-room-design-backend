import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../utils/prisma.js';
import { createToken } from '../utils/jwt.js';

let configured = false;

export function configureGoogle() {
  if (configured || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return;
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://design.getminidesk.com/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const account = profile._json;
      const email = account.email || profile.emails?.[0]?.value;
      if (!email) throw new Error('Google account did not provide an email address.');

      const existingUser = await prisma.user.findUnique({ where: { googleId: profile.id } })
        || await prisma.user.findUnique({ where: { email } });

      const user = existingUser
        ? await prisma.user.update({
          where: { id: existingUser.id },
          data: { googleId: profile.id, name: profile.displayName, email, avatarUrl: account.picture }
        })
        : await prisma.user.create({
          data: { googleId: profile.id, name: profile.displayName, email, avatarUrl: account.picture }
        });
      done(null, { user, token: createToken(user) });
    } catch (error) {
      done(error);
    }
  }));
  configured = true;
}

export { passport };
