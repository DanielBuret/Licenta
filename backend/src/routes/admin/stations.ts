// backend/src/routes/admin/stations.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { conflict, notFound } from '../../lib/errors.js';

export const adminStationsRouter = Router();

const StationBody = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1).max(255),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  powerKw: z.number().positive(),
});

adminStationsRouter.post('/', async (req, res, next) => {
  try {
    const body = StationBody.parse(req.body);
    const s = await prisma.station.create({
      data: { ...body, createdBy: req.user!.id },
    });
    res.status(201).json(serialize(s));
  } catch (e) {
    next(e);
  }
});

adminStationsRouter.patch('/:id', async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = StationBody.partial().parse(req.body);
    const data: {
      name?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      powerKw?: number;
    } = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.address !== undefined) data.address = body.address;
    if (body.latitude !== undefined) data.latitude = body.latitude;
    if (body.longitude !== undefined) data.longitude = body.longitude;
    if (body.powerKw !== undefined) data.powerKw = body.powerKw;
    const s = await prisma.station.update({ where: { id }, data });
    res.json(serialize(s));
  } catch (e) {
    next(e);
  }
});

adminStationsRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const active = await prisma.reservation.count({
      where: { stationId: id, status: { in: ['reserved', 'charging'] } },
    });
    if (active > 0) throw conflict('Station has active reservations');
    const exists = await prisma.station.findUnique({ where: { id } });
    if (!exists) throw notFound('Station not found');
    await prisma.station.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

type StationRow = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  powerKw: { toString(): string } | number;
  createdBy: string | null;
  createdAt: Date | string;
};

function serialize(s: StationRow) {
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    latitude: s.latitude,
    longitude: s.longitude,
    powerKw: Number(s.powerKw),
    createdBy: s.createdBy,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
  };
}
