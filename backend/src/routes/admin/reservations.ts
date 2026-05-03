// backend/src/routes/admin/reservations.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { reservationService } from '../../services/reservation-service.js';

export const adminReservationsRouter = Router();

const Query = z.object({
  status: z.enum(['reserved', 'charging', 'completed', 'cancelled']).optional(),
});

const IdParam = z.coerce.bigint();

function serialize(r: {
  id: bigint;
  stationId: number;
  userId: string;
  batteryLevelStart: number;
  status: string;
  queuePosition: number;
  reservedAt: Date;
  chargingStartedAt: Date | null;
  chargingEndedAt: Date | null;
}) {
  return {
    id: Number(r.id),
    stationId: r.stationId,
    userId: r.userId,
    batteryLevelStart: r.batteryLevelStart,
    status: r.status,
    queuePosition: r.queuePosition,
    reservedAt: r.reservedAt.toISOString(),
    chargingStartedAt: r.chargingStartedAt?.toISOString() ?? null,
    chargingEndedAt: r.chargingEndedAt?.toISOString() ?? null,
  };
}

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
        ...serialize(r),
        user: r.user,
        station: r.station,
      })),
    );
  } catch (e) {
    next(e);
  }
});

adminReservationsRouter.post('/:id/cancel', async (req, res, next) => {
  try {
    const id = IdParam.parse(req.params.id);
    const r = await reservationService.cancel({
      reservationId: id,
      callerId: req.user!.id,
      asAdmin: true,
    });
    res.json(serialize(r));
  } catch (e) {
    next(e);
  }
});

adminReservationsRouter.post('/:id/finish', async (req, res, next) => {
  try {
    const id = IdParam.parse(req.params.id);
    const r = await reservationService.finish({
      reservationId: id,
      callerId: req.user!.id,
      asAdmin: true,
    });
    res.json(serialize(r));
  } catch (e) {
    next(e);
  }
});
