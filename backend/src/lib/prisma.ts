// backend/src/lib/prisma.ts
// Import from the custom generator output (backend/prisma/generated/) so the
// generated client + engine binary live inside the Vercel function project
// boundary. The npm @prisma/client package is still needed transitively
// (the generated client imports its runtime helpers from it).
import { PrismaClient } from '../../prisma/generated/index.js';

// TEMP DEBUG: surface metadata about the DATABASE_URL the runtime sees so we
// can spot stray quotes, whitespace, or truncation introduced by the host's
// env var UI. Logs once per cold start. Remove after Vercel deploy is stable.
{
  const url = process.env.DATABASE_URL ?? '';
  console.log('[debug] DATABASE_URL diagnostics', {
    length: url.length,
    starts: url.slice(0, 25),
    ends: url.slice(-25),
    hasLeadingSpace: /^\s/.test(url),
    hasTrailingSpace: /\s$/.test(url),
    hasQuotes: url.includes('"') || url.includes("'"),
    hasNewline: /\r|\n/.test(url),
    schemeOk: /^postgres(ql)?:\/\//.test(url),
  });
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
