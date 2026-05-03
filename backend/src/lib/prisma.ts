// backend/src/lib/prisma.ts
// Import from the custom generator output (backend/prisma/generated/) so the
// generated client + engine binary live inside the Vercel function project
// boundary. The npm @prisma/client package is still needed transitively
// (the generated client imports its runtime helpers from it).
import { PrismaClient } from '../../prisma/generated/index.js';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
