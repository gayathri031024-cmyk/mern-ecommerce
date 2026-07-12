import crypto from 'crypto';
import { Request, Response } from 'express';
import User from '@models/User';
import { asyncHandler } from '@utils/asyncHandler';
import { AppError } from '@utils/AppError';
import { env, isProduction } from '@config/env';
import { ROLES } from '@constants/roles';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  durationToMs,
} from '@services/token.service';
import { sendVerificationEmail, sendPasswordResetEmail } from '@services/email.service';
import { logActivity } from '@services/activity.service';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/auth';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    path: REFRESH_COOKIE_PATH,
    maxAge: durationToMs(env.JWT_REFRESH_EXPIRES_IN),
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    path: REFRESH_COOKIE_PATH,
  });
}

async function issueSession(res: Response, user: InstanceType<typeof User>) {
  const accessToken = signAccessToken({
    sub: user.id as string,
    role: user.role,
    email: user.email,
  });
  const refreshToken = signRefreshToken({ sub: user.id as string });

  user.setRefreshToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);
  return accessToken;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw AppError.conflict('An account with this email already exists');

  const user = new User({ name, email, password, role: ROLES.CUSTOMER });
  const verificationToken = user.createEmailVerificationToken();
  await user.save();

  await sendVerificationEmail(user.email, user.name, verificationToken);

  const accessToken = await issueSession(res, user);

  res.status(201).json({
    success: true,
    message: 'Account created. Please check your email to verify your address.',
    data: { user: user.toJSON(), accessToken },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const accessToken = await issueSession(res, user);

  void logActivity({ user: user.id, type: 'logged_in', description: 'Signed in' });

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: { user: user.toJSON(), accessToken },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await User.findById(payload.sub).select('+refreshTokenHash');
      if (user && user.compareRefreshToken(token)) {
        user.refreshTokenHash = undefined;
        await user.save({ validateBeforeSave: false });
      }
    } catch {
      // Token already invalid/expired - nothing to revoke server-side.
    }
  }

  clearRefreshCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!token) throw AppError.unauthorized('Refresh token missing');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw AppError.unauthorized('Refresh token expired or invalid');
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.compareRefreshToken(token)) {
    clearRefreshCookie(res);
    throw AppError.unauthorized('Refresh token expired or invalid');
  }

  // Rotate the refresh token on every use.
  const accessToken = await issueSession(res, user);

  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: { accessToken },
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);
  if (!user) throw AppError.notFound('User not found');

  res.status(200).json({ success: true, message: 'Current user', data: user.toJSON() });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond with a generic success message, whether or not the
  // account exists, so the endpoint can't be used to enumerate emails.
  if (user) {
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    await sendPasswordResetEmail(user.email, user.name, resetToken);
  }

  res.status(200).json({
    success: true,
    message: 'If an account exists for that email, a password reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as { token: string; password: string };
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpires');

  if (!user) throw AppError.badRequest('Password reset token is invalid or has expired');

  user.password = password;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokenHash = undefined; // force re-login on all devices
  await user.save();

  clearRefreshCookie(res);
  res
    .status(200)
    .json({ success: true, message: 'Password reset successfully. Please sign in again.' });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const token = ((req.body as Record<string, unknown>).token ?? req.query.token) as string;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationTokenHash +emailVerificationExpires');

  if (!user) throw AppError.badRequest('Verification token is invalid or has expired');

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Email verified successfully' });
});

export const resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const user = await User.findOne({ email: email.toLowerCase() });

  if (user && !user.isEmailVerified) {
    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    await sendVerificationEmail(user.email, user.name, verificationToken);
  }

  res.status(200).json({
    success: true,
    message: 'If an account exists and is unverified, a new verification link has been sent.',
  });
});
