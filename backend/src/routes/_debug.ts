// TEMP debug endpoint to diagnose env var issues on hosted platforms.
// Returns metadata about each env var WITHOUT exposing the secret values.
// Remove after Vercel deploy is stable.
import { Router } from 'express';

export const debugRouter = Router();

function describe(value: string | undefined) {
  if (value == null) return { present: false };
  return {
    present: true,
    length: value.length,
    starts: value.slice(0, 30),
    ends: value.slice(-30),
    hasLeadingSpace: /^\s/.test(value),
    hasTrailingSpace: /\s$/.test(value),
    hasQuotes: value.includes('"') || value.includes("'"),
    hasNewline: /\r|\n/.test(value),
    hasBackslash: value.includes('\\'),
  };
}

debugRouter.get('/env', (_req, res) => {
  res.json({
    DATABASE_URL: describe(process.env.DATABASE_URL),
    DIRECT_URL: describe(process.env.DIRECT_URL),
    SUPABASE_URL: describe(process.env.SUPABASE_URL),
    SUPABASE_JWKS_URL: describe(process.env.SUPABASE_JWKS_URL),
    SUPABASE_ANON_KEY_set: !!process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
  });
});
