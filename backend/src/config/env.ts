// backend/src/config/env.ts
import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';

// In dev/test the repo's `.env` lives at the monorepo root and the running
// file is `backend/src/config/env.ts`, so we walk up three levels.
// When deployed (esbuild-bundled to `backend/dist/server.mjs`) it's two
// levels up. In hosted environments (Render, Vercel, etc.) there is no
// `.env` file at all — env vars come from the platform — so we silently
// skip the load if no candidate file exists.
const here = dirname(fileURLToPath(import.meta.url));
const candidates = [
  resolve(here, '../../../.env'), // backend/src/config -> root
  resolve(here, '../../.env'), // backend/dist -> root
  resolve(here, '../.env'), // edge cases
];
for (const path of candidates) {
  if (existsSync(path)) {
    loadDotenv({ path });
    break;
  }
}

// Hosted UIs (Vercel, Render, etc.) preserve trailing whitespace/newlines
// from copy-paste, which Prisma rejects with "invalid domain character".
// Defensively trim the values that downstream tooling reads directly from
// process.env (Prisma reads DATABASE_URL/DIRECT_URL itself, not the parsed
// env object below).
for (const key of [
  'DATABASE_URL',
  'DIRECT_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWKS_URL',
  'CORS_ORIGIN',
]) {
  const v = process.env[key];
  if (typeof v === 'string') process.env[key] = v.trim();
}

// z.string().url() uses the WHATWG URL parser which has trouble with some
// Postgres connection strings (special chars in passwords, dotted usernames
// like `postgres.<projectref>`). Use a permissive regex instead — Prisma
// will surface its own error if the string is unparseable later.
const postgresUrl = z.string().regex(/^postgres(ql)?:\/\//, {
  message: 'must start with postgres:// or postgresql://',
});

const Schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  TIME_SCALE_FACTOR: z.coerce.number().positive().default(60),
  DATABASE_URL: postgresUrl,
  DIRECT_URL: postgresUrl,
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWKS_URL: z.string().url(),
  CORS_ORIGIN: z.string().optional(),
});

const parsed = Schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
