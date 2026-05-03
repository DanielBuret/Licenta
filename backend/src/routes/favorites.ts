// backend/src/routes/favorites.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const favoritesRouter = Router();

favoritesRouter.use(requireAuth);

favoritesRouter.get('/', async (req, res, next) => {
  try {
    const rows = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      select: { stationId: true },
    });
    res.json(rows.map((r) => r.stationId));
  } catch (e) {
    next(e);
  }
});

const StationIdParam = z.coerce.number().int().positive();

favoritesRouter.put('/:stationId', async (req, res, next) => {
  try {
    const stationId = StationIdParam.parse(req.params.stationId);
    await prisma.favorite.upsert({
      where: { userId_stationId: { userId: req.user!.id, stationId } },
      update: {},
      create: { userId: req.user!.id, stationId },
    });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

favoritesRouter.delete('/:stationId', async (req, res, next) => {
  try {
    const stationId = StationIdParam.parse(req.params.stationId);
    await prisma.favorite
      .delete({ where: { userId_stationId: { userId: req.user!.id, stationId } } })
      .catch(() => null);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
