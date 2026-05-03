// Vercel serverless catchall for the backend.
// Each Vercel function instance is stateless and short-lived, so we mount the
// existing Express app from src/server.ts. The 1Hz grace-period timer that
// lived in src/index.ts cannot run here — it has been moved to a pg_cron job
// running inside Supabase Postgres. See docs in the deploy guide.
import { buildApp } from '../src/server.js';

const app = buildApp();
export default app;
