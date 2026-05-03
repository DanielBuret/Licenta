// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middleware/error.js';
import { profileRouter } from './routes/profile.js';

export function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/profile', profileRouter);

  app.use(errorMiddleware);
  return app;
}
