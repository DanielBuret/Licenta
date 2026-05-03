// backend/src/routes/reservations.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { reservationService } from '../services/reservation-service.js';

export const reservationsRouter = Router();

const CreateBody = z.object({
  stationId: z.number().int().positive(),
  batteryLevelStart: z.number().int().min(0).max(99),
});

reservationsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = CreateBody.parse(req.body);
    const r = await reservationService.create({
      ...body,
      userId: req.user!.id,
    });
    res.status(201).json(serialize(r));
  } catch (e) {
    next(e);
  }
});

reservationsRouter.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const id = z.coerce.bigint().parse(req.params.id);
    const r = await reservationService.cancel({
      reservationId: id,
      callerId: req.user!.id,
    });
    res.json(serialize(r));
  } catch (e) {
    next(e);
  }
});

reservationsRouter.post('/:id/finish', requireAuth, async (req, res, next) => {
  try {
    const id = z.coerce.bigint().parse(req.params.id);
    const r = await reservationService.finish({
      reservationId: id,
      callerId: req.user!.id,
    });
    res.json(serialize(r));
  } catch (e) {
    next(e);
  }
});

reservationsRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const list = await prisma.reservation.findMany({
      where: { userId: req.user!.id },
      orderBy: { reservedAt: 'desc' },
      include: {
        station: {
          select: { id: true, name: true, address: true, powerKw: true },
        },
      },
    });
    res.json(list.map(serialize));
  } catch (e) {
    next(e);
  }
});

function serialize(r: any) {
  return {
    id: Number(r.id),
    stationId: r.stationId,
    userId: r.userId,
    batteryLevelStart: r.batteryLevelStart,
    status: r.status,
    queuePosition: r.queuePosition,
    reservedAt: r.reservedAt instanceof Date ? r.reservedAt.toISOString() : r.reservedAt,
    chargingStartedAt: r.chargingStartedAt
      ? r.chargingStartedAt instanceof Date
        ? r.chargingStartedAt.toISOString()
        : r.chargingStartedAt
      : null,
    chargingEndedAt: r.chargingEndedAt
      ? r.chargingEndedAt instanceof Date
        ? r.chargingEndedAt.toISOString()
        : r.chargingEndedAt
      : null,
    station: r.station
      ? {
          id: r.station.id,
          name: r.station.name,
          address: r.station.address,
          powerKw: Number(r.station.powerKw),
        }
      : undefined,
  };
}
