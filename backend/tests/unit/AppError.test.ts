import { AppError } from '@utils/AppError';

describe('AppError', () => {
  it('sets message, statusCode, isOperational and details from the constructor', () => {
    const error = new AppError('Something broke', 422, { field: 'email' });

    expect(error.message).toBe('Something broke');
    expect(error.statusCode).toBe(422);
    expect(error.isOperational).toBe(true);
    expect(error.details).toEqual({ field: 'email' });
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('defaults statusCode to 500 when not provided', () => {
    const error = new AppError('Generic failure');
    expect(error.statusCode).toBe(500);
  });

  describe('static factory helpers', () => {
    it.each([
      ['badRequest', 400, 'Bad Request'],
      ['unauthorized', 401, 'Unauthorized'],
      ['forbidden', 403, 'Forbidden'],
      ['notFound', 404, 'Resource not found'],
      ['conflict', 409, 'Conflict'],
      ['internal', 500, 'Internal Server Error'],
    ] as const)('%s() produces a %d error with the default message', (method, statusCode, defaultMessage) => {
      const error = AppError[method]();
      expect(error.statusCode).toBe(statusCode);
      expect(error.message).toBe(defaultMessage);
    });

    it('allows overriding the message and attaching details on any factory', () => {
      const error = AppError.badRequest('Invalid payload', ['email is required']);
      expect(error.message).toBe('Invalid payload');
      expect(error.details).toEqual(['email is required']);
    });
  });
});
