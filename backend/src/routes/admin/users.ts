// backend/src/routes/admin/users.ts
import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

export const adminUsersRouter = Router();

adminUsersRouter.get('/', async (_req, res, next) => {
  try {
    const users = await prisma.profile.findMany({
      orderBy: { createdAt: 'desc' },
      include: { carModel: true },
    });
    res.json(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        carModel: u.carModel
          ? {
              id: u.carModel.id,
              brand: u.carModel.brand,
              model: u.carModel.model,
              batteryCapacityKwh: Number(u.carModel.batteryCapacityKwh),
            }
          : null,
      })),
    );
  } catch (e) {
    next(e);
  }
});
