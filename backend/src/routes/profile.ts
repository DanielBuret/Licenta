// backend/src/routes/profile.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound, badRequest } from '../lib/errors.js';

export const profileRouter = Router();

profileRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.user!.id },
      include: { carModel: true },
    });
    if (!profile) throw notFound('Profile not found');
    res.json({
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
      carModelId: profile.carModelId,
      carModel: profile.carModel
        ? {
            id: profile.carModel.id,
            brand: profile.carModel.brand,
            model: profile.carModel.model,
            batteryCapacityKwh: Number(profile.carModel.batteryCapacityKwh),
          }
        : null,
    });
  } catch (e) {
    next(e);
  }
});

const PatchSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  carModelId: z.number().int().positive().nullable().optional(),
});

profileRouter.patch('/', requireAuth, async (req, res, next) => {
  try {
    const body = PatchSchema.parse(req.body);
    if (body.carModelId != null) {
      const exists = await prisma.carModel.findUnique({
        where: { id: body.carModelId },
      });
      if (!exists) throw badRequest('Unknown carModelId');
    }
    const data: { fullName?: string; carModelId?: number | null } = {};
    if (body.fullName !== undefined) data.fullName = body.fullName;
    if (body.carModelId !== undefined) data.carModelId = body.carModelId;
    const updated = await prisma.profile.update({
      where: { id: req.user!.id },
      data,
    });
    res.json({
      id: updated.id,
      fullName: updated.fullName,
      carModelId: updated.carModelId,
    });
  } catch (e) {
    next(e);
  }
});
