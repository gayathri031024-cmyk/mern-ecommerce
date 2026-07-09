export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details?: unknown;
  
    constructor(message: string, statusCode = 500, details?: unknown) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
      this.details = details;
      Object.setPrototypeOf(this, AppError.prototype);
      Error.captureStackTrace(this, this.constructor);
    }
  
    static badRequest(message = 'Bad Request', details?: unknown) { return new AppError(message, 400, details); }
    static unauthorized(message = 'Unauthorized', details?: unknown) { return new AppError(message, 401, details); }
    static forbidden(message = 'Forbidden', details?: unknown) { return new AppError(message, 403, details); }
    static notFound(message = 'Resource not found', details?: unknown) { return new AppError(message, 404, details); }
    static conflict(message = 'Conflict', details?: unknown) { return new AppError(message, 409, details); }
    static internal(message = 'Internal Server Error', details?: unknown) { return new AppError(message, 500, details); }
  }