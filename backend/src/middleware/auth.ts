// backend/src/middleware/auth.ts
import type { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import type { UserRole } from '@charging-station/shared';

const JWKS = createRemoteJWKSet(new URL(env.SUPABASE_JWKS_URL));
const ISSUER = `${env.SUPABASE_URL}/auth/v1`;

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'unauthenticated', message: 'Missing bearer token' },
    });
  }

  const token = header.slice('Bearer '.length);
  let userId: string;
  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER });
    if (typeof payload.sub !== 'string') throw new Error('sub missing');
    userId = payload.sub;
  } catch {
    return res.status(401).json({
      error: { code: 'unauthenticated', message: 'Invalid token' },
    });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!profile) {
    return res.status(403).json({
      error: { code: 'forbidden', message: 'Profile not found' },
    });
  }

  req.user = {
    id: profile.id,
    email: profile.email,
    role: profile.role as UserRole,
  };
  next();
}
