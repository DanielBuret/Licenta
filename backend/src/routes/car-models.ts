// backend/src/routes/car-models.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const carModelsRouter = Router();

carModelsRouter.get('/', async (_req, res, next) => {
  try {
    const cars = await prisma.carModel.findMany({
      orderBy: [{ brand: 'asc' }, { model: 'asc' }],
    });
    res.json(
      cars.map((c) => ({
        id: c.id,
        brand: c.brand,
        model: c.model,
        batteryCapacityKwh: Number(c.batteryCapacityKwh),
      })),
    );
  } catch (e) {
    next(e);
  }
});
