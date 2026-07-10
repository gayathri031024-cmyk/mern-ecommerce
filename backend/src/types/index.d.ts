import { Role } from '@constants/roles';

export {};

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        id: string;
        role: Role;
        email: string;
      };
    }
  }
}