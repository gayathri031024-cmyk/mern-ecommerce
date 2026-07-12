import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '@config/env';
import { authenticate } from '@middlewares/auth.middleware';
import { verifyCsrfToken } from '@middlewares/csrf.middleware';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateResendVerification,
} from '@validators/auth.validator';
import {
  register,
  login,
  logout,
  refresh,
  me,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} from '@controllers/auth.controller';

const router = Router();

// Stricter limiter for endpoints that are attractive to brute-force/enumeration.
const sensitiveLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

router.post('/register', sensitiveLimiter, validateRegister, register);
router.post('/login', sensitiveLimiter, validateLogin, login);
router.post('/logout', verifyCsrfToken, logout);
router.post('/refresh', verifyCsrfToken, refresh);
router.get('/me', authenticate, me);

router.post('/forgot-password', sensitiveLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', sensitiveLimiter, validateResetPassword, resetPassword);

router.post('/verify-email', validateVerifyEmail, verifyEmail);
router.get('/verify-email', validateVerifyEmail, verifyEmail);
router.post(
  '/resend-verification',
  sensitiveLimiter,
  validateResendVerification,
  resendVerificationEmail,
);

export default router;
