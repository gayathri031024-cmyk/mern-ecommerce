import User from '@models/User';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db';

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('User model', () => {
  it('hashes the password before saving and never stores it in plaintext', async () => {
    const user = await User.create({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'Password123!' });
    const stored = await User.findById(user.id).select('+password');

    expect(stored!.password).not.toBe('Password123!');
    expect(stored!.password.length).toBeGreaterThan(20);
  });

  it('does not rehash the password when unrelated fields change', async () => {
    const user = await User.create({ name: 'Ada Lovelace', email: 'ada2@example.com', password: 'Password123!' });
    const original = (await User.findById(user.id).select('+password'))!.password;

    user.name = 'Ada L.';
    await user.save();
    const after = (await User.findById(user.id).select('+password'))!.password;

    expect(after).toBe(original);
  });

  describe('comparePassword', () => {
    it('resolves true for the correct password', async () => {
      const user = await User.create({ name: 'Grace Hopper', email: 'grace@example.com', password: 'Password123!' });
      const withPassword = await User.findById(user.id).select('+password');
      await expect(withPassword!.comparePassword('Password123!')).resolves.toBe(true);
    });

    it('resolves false for an incorrect password', async () => {
      const user = await User.create({ name: 'Grace Hopper', email: 'grace2@example.com', password: 'Password123!' });
      const withPassword = await User.findById(user.id).select('+password');
      await expect(withPassword!.comparePassword('WrongPassword')).resolves.toBe(false);
    });
  });

  describe('email verification & password reset tokens', () => {
    it('creates a hashed email verification token distinct from the raw token returned', async () => {
      const user = await User.create({ name: 'Alan Turing', email: 'alan@example.com', password: 'Password123!' });
      const rawToken = user.createEmailVerificationToken();

      expect(rawToken).toHaveLength(64);
      expect(user.emailVerificationTokenHash).toBeDefined();
      expect(user.emailVerificationTokenHash).not.toBe(rawToken);
      expect(user.emailVerificationExpires!.getTime()).toBeGreaterThan(Date.now());
    });

    it('creates a hashed password reset token with a ~1h expiry', async () => {
      const user = await User.create({ name: 'Alan Turing', email: 'alan2@example.com', password: 'Password123!' });
      const rawToken = user.createPasswordResetToken();

      expect(rawToken).toHaveLength(64);
      expect(user.passwordResetTokenHash).toBeDefined();
      const expiresInMs = user.passwordResetExpires!.getTime() - Date.now();
      expect(expiresInMs).toBeGreaterThan(55 * 60 * 1000);
      expect(expiresInMs).toBeLessThanOrEqual(60 * 60 * 1000);
    });
  });

  describe('refresh token handling', () => {
    it('stores only a hash of the refresh token and can verify a matching candidate', async () => {
      const user = await User.create({ name: 'Test', email: 'refresh@example.com', password: 'Password123!' });
      user.setRefreshToken('raw-refresh-token');

      expect(user.refreshTokenHash).toBeDefined();
      expect(user.refreshTokenHash).not.toBe('raw-refresh-token');
      expect(user.compareRefreshToken('raw-refresh-token')).toBe(true);
      expect(user.compareRefreshToken('wrong-token')).toBe(false);
    });

    it('compareRefreshToken returns false when no refresh token has been set', async () => {
      const user = await User.create({ name: 'Test', email: 'norefresh@example.com', password: 'Password123!' });
      expect(user.compareRefreshToken('anything')).toBe(false);
    });
  });

  describe('validation', () => {
    it('rejects an invalid email format', async () => {
      await expect(
        User.create({ name: 'Bad Email', email: 'not-an-email', password: 'Password123!' }),
      ).rejects.toThrow();
    });

    it('rejects a password shorter than 8 characters', async () => {
      await expect(
        User.create({ name: 'Short Pw', email: 'short@example.com', password: '1234567' }),
      ).rejects.toThrow();
    });

    it('rejects duplicate (non-deleted) emails', async () => {
      await User.create({ name: 'First', email: 'dup@example.com', password: 'Password123!' });
      await expect(
        User.create({ name: 'Second', email: 'dup@example.com', password: 'Password123!' }),
      ).rejects.toThrow();
    });

    it('defaults role to "customer"', async () => {
      const user = await User.create({ name: 'Default Role', email: 'defrole@example.com', password: 'Password123!' });
      expect(user.role).toBe('customer');
    });
  });

  describe('addresses', () => {
    it('automatically marks the first address as default when none is', async () => {
      const user = await User.create({
        name: 'Addr',
        email: 'addr@example.com',
        password: 'Password123!',
        addresses: [
          { line1: '1 Main St', city: 'Springfield', state: 'IL', postalCode: '62701', country: 'US' },
        ],
      });

      expect(user.addresses[0].isDefault).toBe(true);
    });

    it('keeps only one default address when multiple are marked default', async () => {
      const user = new User({
        name: 'Addr2',
        email: 'addr2@example.com',
        password: 'Password123!',
        addresses: [
          { line1: '1 Main St', city: 'A', state: 'S', postalCode: '11111', country: 'US', isDefault: true },
          { line1: '2 Main St', city: 'B', state: 'S', postalCode: '22222', country: 'US', isDefault: true },
        ],
      });
      await user.save();

      const defaults = user.addresses.filter((a) => a.isDefault);
      expect(defaults).toHaveLength(1);
    });
  });

  describe('toJSON', () => {
    it('strips sensitive fields and exposes id instead of _id', async () => {
      const user = await User.create({ name: 'JSON Test', email: 'json@example.com', password: 'Password123!' });
      const json = user.toJSON() as Record<string, unknown>;

      expect(json.id).toBeDefined();
      expect(json._id).toBeUndefined();
      expect(json.password).toBeUndefined();
      expect(json.refreshTokenHash).toBeUndefined();
      expect(json.passwordResetTokenHash).toBeUndefined();
      expect(json.emailVerificationTokenHash).toBeUndefined();
    });
  });
});
