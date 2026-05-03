// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middleware/error.js';
import { profileRouter } from './routes/profile.js';
import { carModelsRouter } from './routes/car-models.js';
import { stationsRouter } from './routes/stations.js';
import { reservationsRouter } from './routes/reservations.js';
import { adminRouter } from './routes/admin/index.js';

export function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/profile', profileRouter);
  app.use('/api/car-models', carModelsRouter);
  app.use('/api/stations', stationsRouter);
  app.use('/api/reservations', reservationsRouter);
  app.use('/api/admin', adminRouter);

  app.use(errorMiddleware);
  return app;
}
