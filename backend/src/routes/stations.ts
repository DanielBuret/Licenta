// backend/src/routes/stations.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';

export const stationsRouter = Router();

stationsRouter.get('/', async (_req, res, next) => {
  try {
    const stations = await prisma.station.findMany({
      orderBy: { name: 'asc' },
      include: {
        reservations: {
          where: { status: { in: ['reserved', 'charging'] } },
          select: { id: true, status: true, queuePosition: true },
        },
      },
    });

    const result = stations.map((s) => {
      const active = s.reservations;
      return {
        id: s.id,
        name: s.name,
        address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        powerKw: Number(s.powerKw),
        activeReservations: active.length,
        hasCharging: active.some((r) => r.status === 'charging'),
        hasReserved: active.some((r) => r.status === 'reserved'),
      };
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
});

stationsRouter.get('/:id', async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const station = await prisma.station.findUnique({
      where: { id },
      include: {
        reservations: {
          where: { status: { in: ['reserved', 'charging'] } },
          orderBy: { queuePosition: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                carModel: {
                  select: {
                    brand: true,
                    model: true,
                    batteryCapacityKwh: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!station) throw notFound('Station not found');

    res.json({
      id: station.id,
      name: station.name,
      address: station.address,
      latitude: station.latitude,
      longitude: station.longitude,
      powerKw: Number(station.powerKw),
      activeReservations: station.reservations.map((r) => ({
        id: Number(r.id),
        status: r.status,
        queuePosition: r.queuePosition,
        batteryLevelStart: r.batteryLevelStart,
        reservedAt: r.reservedAt.toISOString(),
        chargingStartedAt: r.chargingStartedAt?.toISOString() ?? null,
        userId: r.user.id,
        userFullName: r.user.fullName,
        carModelLabel: r.user.carModel ? `${r.user.carModel.brand} ${r.user.carModel.model}` : null,
        batteryCapacityKwh: r.user.carModel ? Number(r.user.carModel.batteryCapacityKwh) : null,
      })),
    });
  } catch (e) {
    next(e);
  }
});
