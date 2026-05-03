import type { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { forbidden, unauthenticated } from '../lib/errors.js';
import type { UserRole } from '@charging-station/shared';

const JWKS = createRemoteJWKSet(new URL(env.SUPABASE_JWKS_URL));
const ISSUER = `${env.SUPABASE_URL}/auth/v1`;

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header('authorization') ?? req.header('Authorization');
    if (!header?.startsWith('Bearer ')) {
      throw unauthenticated('Missing bearer token');
    }

    const token = header.slice('Bearer '.length);
    let userId: string;
    try {
      const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER });
      if (typeof payload.sub !== 'string') throw new Error('sub missing');
      userId = payload.sub;
    } catch {
      throw unauthenticated('Invalid token');
    }

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
    if (!profile) {
      throw forbidden('Profile not found');
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role as UserRole,
    };
    next();
  } catch (e) {
    next(e);
  }
}
