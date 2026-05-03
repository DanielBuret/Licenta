// backend/src/routes/admin/reservations.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

export const adminReservationsRouter = Router();

const Query = z.object({
  status: z.enum(['reserved', 'charging', 'completed', 'cancelled']).optional(),
});

adminReservationsRouter.get('/', async (req, res, next) => {
  try {
    const q = Query.parse(req.query);
    const list = await prisma.reservation.findMany({
      ...(q.status ? { where: { status: q.status } } : {}),
      orderBy: { reservedAt: 'desc' },
      take: 200,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        station: { select: { id: true, name: true } },
      },
    });
    res.json(
      list.map((r) => ({
        id: Number(r.id),
        status: r.status,
        queuePosition: r.queuePosition,
        batteryLevelStart: r.batteryLevelStart,
        reservedAt: r.reservedAt.toISOString(),
        chargingStartedAt: r.chargingStartedAt?.toISOString() ?? null,
        chargingEndedAt: r.chargingEndedAt?.toISOString() ?? null,
        user: r.user,
        station: r.station,
      })),
    );
  } catch (e) {
    next(e);
  }
});
