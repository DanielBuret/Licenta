// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorMiddleware } from './middleware/error.js';
import { profileRouter } from './routes/profile.js';
import { carModelsRouter } from './routes/car-models.js';
import { stationsRouter } from './routes/stations.js';
import { reservationsRouter } from './routes/reservations.js';
import { favoritesRouter } from './routes/favorites.js';
import { adminRouter } from './routes/admin/index.js';

export function buildApp() {
  const app = express();
  // CORS_ORIGIN is a comma-separated list of allowed origins in production
  // (e.g. https://my-app.vercel.app). Falls back to allow-all for local dev.
  const corsOptions = env.CORS_ORIGIN
    ? { origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()), credentials: true }
    : undefined;
  app.use(cors(corsOptions));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/profile', profileRouter);
  app.use('/api/car-models', carModelsRouter);
  app.use('/api/stations', stationsRouter);
  app.use('/api/reservations', reservationsRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/admin', adminRouter);

  app.use(errorMiddleware);
  return app;
}
