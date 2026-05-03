// backend/src/middleware/error.ts
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/errors.js';

// 4-arg signature is REQUIRED by Express to identify this as the error handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'validation',
        message: 'Invalid input',
        details: err.flatten(),
      },
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  console.error('Unhandled error', err);
  return res.status(500).json({ error: { code: 'internal', message: 'Internal server error' } });
}
