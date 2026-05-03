// backend/src/middleware/admin.ts
import type { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: { code: 'forbidden', message: 'Admin only' } });
  }
  next();
}
