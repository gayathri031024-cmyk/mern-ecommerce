import request from 'supertest';
import app from '../../src/app';
import User from '@models/User';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db';
import { createUser, authHeader } from '../helpers/factories';

// The email service hits a real SMTP transport; stub it out for all auth tests
// so registration/reset flows don't try to make network calls.
jest.mock('@services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendOrderConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendOrderStatusUpdateEmail: jest.fn().mockResolvedValue(undefined),
}));

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

/** Performs a GET to pick up the CSRF cookie, then returns { agent, csrfToken }. */
async function primeCsrf() {
  const agent = request.agent(app);
  const res = await agent.get('/health');
  const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
  const csrfCookie = setCookie?.find((c) => c.startsWith('XSRF-TOKEN='));
  const csrfToken = csrfCookie?.split(';')[0].split('=')[1];
  return { agent, csrfToken };
}

describe('POST /api/auth/register', () => {
  it('creates a new user and returns an access token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('jane@example.com');
    expect(res.body.data.user.password).toBeUndefined();

    const stored = await User.findOne({ email: 'jane@example.com' });
    expect(stored).not.toBeNull();
  });

  it('sets a refresh token cookie on successful registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'jane2@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('refreshToken='))).toBe(true);
  });

  it('rejects a duplicate email with 409', async () => {
    await createUser({ email: 'dup@example.com' });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'dup@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects mismatched passwords with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'jane3@example.com',
      password: 'Password123!',
      confirmPassword: 'Different123!',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/validation/i);
  });

  it('rejects a weak password with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'jane4@example.com',
      password: 'short',
      confirmPassword: 'short',
    });

    expect(res.status).toBe(400);
  });

  it('rejects an invalid email format with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'not-an-email',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await createUser({ email: 'login@example.com', password: 'Password123!' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('login@example.com');
  });

  it('rejects an incorrect password with 401', async () => {
    await createUser({ email: 'login2@example.com', password: 'Password123!' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login2@example.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
  });

  it('rejects a nonexistent email with 401 (no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'Password123!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('is case-insensitive on email', async () => {
    await createUser({ email: 'case@example.com', password: 'Password123!' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'CASE@EXAMPLE.com', password: 'Password123!' });

    expect(res.status).toBe(200);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the authenticated user with a valid bearer token', async () => {
    const { user, accessToken } = await createUser({ email: 'me@example.com' });

    const res = await request(app).get('/api/auth/me').set(authHeader(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user.id);
    expect(res.body.data.email).toBe('me@example.com');
  });

  it('rejects a request without an Authorization header with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed/invalid token with 401', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage.token.here');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the refresh cookie given a valid CSRF token', async () => {
    const { agent, csrfToken } = await primeCsrf();

    const res = await agent.post('/api/auth/logout').set('X-CSRF-Token', csrfToken ?? '');

    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('refreshToken=;') || c.includes('refreshToken=;'))).toBe(true);
  });

  it('rejects the request with 403 when the CSRF header is missing', async () => {
    const { agent } = await primeCsrf();
    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(403);
  });

  it('rejects the request with 403 when the CSRF header does not match the cookie', async () => {
    const { agent } = await primeCsrf();
    const res = await agent.post('/api/auth/logout').set('X-CSRF-Token', 'wrong-token');
    expect(res.status).toBe(403);
  });
});

describe('POST /api/auth/refresh', () => {
  it('rejects the request with 401 when no refresh cookie is present', async () => {
    const { agent, csrfToken } = await primeCsrf();
    const res = await agent.post('/api/auth/refresh').set('X-CSRF-Token', csrfToken ?? '');
    expect(res.status).toBe(401);
  });

  it('issues a new access token when a valid refresh cookie + CSRF token are provided', async () => {
    const { agent, csrfToken } = await primeCsrf();

    await agent.post('/api/auth/register').send({
      name: 'Refresh User',
      email: 'refresh@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    const res = await agent.post('/api/auth/refresh').set('X-CSRF-Token', csrfToken ?? '');

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('always returns 200 with a generic message, whether or not the account exists', async () => {
    await createUser({ email: 'forgot@example.com' });

    const existing = await request(app).post('/api/auth/forgot-password').send({ email: 'forgot@example.com' });
    const nonexistent = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });

    expect(existing.status).toBe(200);
    expect(nonexistent.status).toBe(200);
    expect(existing.body.message).toBe(nonexistent.body.message);
  });

  it('sets a passwordResetTokenHash on the user record when the account exists', async () => {
    const { user } = await createUser({ email: 'forgot2@example.com' });
    await request(app).post('/api/auth/forgot-password').send({ email: 'forgot2@example.com' });

    const updated = await User.findById(user.id).select('+passwordResetTokenHash');
    expect(updated!.passwordResetTokenHash).toBeDefined();
  });
});

describe('POST /api/auth/reset-password', () => {
  it('resets the password given a valid token and allows login with the new password', async () => {
    const { user } = await createUser({ email: 'reset@example.com', password: 'OldPassword123!' });
    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, password: 'NewPassword123!' });

    expect(res.status).toBe(200);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@example.com', password: 'NewPassword123!' });
    expect(loginRes.status).toBe(200);
  });

  it('rejects an invalid/expired token with 400', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'not-a-real-token', password: 'NewPassword123!' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/verify-email', () => {
  it('verifies the email given a valid token', async () => {
    const { user } = await createUser({ email: 'verify@example.com', isEmailVerified: false });
    const rawToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const res = await request(app).post('/api/auth/verify-email').send({ token: rawToken });

    expect(res.status).toBe(200);
    const updated = await User.findById(user.id);
    expect(updated!.isEmailVerified).toBe(true);
  });

  it('rejects an invalid token with 400', async () => {
    const res = await request(app).post('/api/auth/verify-email').send({ token: 'bogus' });
    expect(res.status).toBe(400);
  });
});
