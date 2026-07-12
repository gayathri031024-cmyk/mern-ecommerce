import jwt from 'jsonwebtoken';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  durationToMs,
} from '@services/token.service';

describe('token.service', () => {
  const payload = { sub: 'user123', role: 'customer' as const, email: 'user@example.com' };

  describe('access tokens', () => {
    it('signs a token that verifies back to the original payload', () => {
      const token = signAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.email).toBe(payload.email);
    });

    it('throws when verifying a token signed with a different secret', () => {
      const foreignToken = jwt.sign(payload, 'wrong-secret');
      expect(() => verifyAccessToken(foreignToken)).toThrow();
    });

    it('throws when verifying a malformed token', () => {
      expect(() => verifyAccessToken('not-a-real-token')).toThrow();
    });

    it('throws for an expired token', () => {
      const expired = jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, { expiresIn: -10 });
      expect(() => verifyAccessToken(expired)).toThrow(/expired/i);
    });
  });

  describe('refresh tokens', () => {
    it('signs and verifies a refresh token', () => {
      const token = signRefreshToken({ sub: 'user123' });
      const decoded = verifyRefreshToken(token);
      expect(decoded.sub).toBe('user123');
    });

    it('rejects an access token verified as a refresh token (different secrets)', () => {
      const accessToken = signAccessToken(payload);
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });
  });

  describe('durationToMs', () => {
    it.each([
      ['30s', 30 * 1000],
      ['15m', 15 * 60 * 1000],
      ['2h', 2 * 60 * 60 * 1000],
      ['7d', 7 * 24 * 60 * 60 * 1000],
    ])('converts %s to %d ms', (input, expected) => {
      expect(durationToMs(input)).toBe(expected);
    });

    it('falls back to 15 minutes for an unrecognized format', () => {
      expect(durationToMs('garbage')).toBe(15 * 60 * 1000);
    });
  });
});
