import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpError } from '../lib/errors.js';

// 4-arg signature is required by Express to identify this as the error handler.
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
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res.status(409).json({
      error: {
        code: 'conflict',
        message: 'Resource already exists or conflicts with an active record',
      },
    });
  }
  console.error('Unhandled error', err);
  return res.status(500).json({ error: { code: 'internal', message: 'Internal server error' } });
}
