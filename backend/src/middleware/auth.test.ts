// backend/src/middleware/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => 'mock-jwks-resolver'),
  jwtVerify: vi.fn(),
}));

vi.mock('../config/env.js', () => ({
  env: {
    SUPABASE_JWKS_URL: 'http://localhost/jwks',
    SUPABASE_URL: 'http://localhost',
  },
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    },
  },
}));

import { jwtVerify } from 'jose';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from './auth.js';
import { errorMiddleware } from './error.js';

function buildApp() {
  const app = express();
  app.get('/protected', requireAuth, (req, res) => {
    res.json({ id: req.user!.id, role: req.user!.role });
  });
  app.use(errorMiddleware);
  return app;
}

describe('requireAuth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no Authorization header', async () => {
    const res = await request(buildApp()).get('/protected');
    expect(res.status).toBe(401);
  });

  it('returns 401 for malformed token', async () => {
    (jwtVerify as any).mockRejectedValue(new Error('invalid token'));
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('returns 403 when JWT is valid but profile not found', async () => {
    (jwtVerify as any).mockResolvedValue({
      payload: { sub: '00000000-0000-0000-0000-000000000001', email: 'a@b.com' },
    });
    (prisma.profile.findUnique as any).mockResolvedValue(null);
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer valid.jwt.here');
    expect(res.status).toBe(403);
  });

  it('attaches user when JWT and profile both valid', async () => {
    (jwtVerify as any).mockResolvedValue({
      payload: { sub: '00000000-0000-0000-0000-000000000001', email: 'a@b.com' },
    });
    (prisma.profile.findUnique as any).mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'a@b.com',
      role: 'user',
    });
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer valid.jwt.here');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: '00000000-0000-0000-0000-000000000001',
      role: 'user',
    });
  });
});
