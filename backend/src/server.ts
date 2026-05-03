// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middleware/error.js';

export function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Routers will be mounted here in later tasks
  // app.use('/api/profile', profileRouter);
  // ...

  app.use(errorMiddleware);
  return app;
}
