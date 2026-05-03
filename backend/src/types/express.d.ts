// backend/src/types/express.d.ts
import type { UserRole } from '@charging-station/shared';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export {};
