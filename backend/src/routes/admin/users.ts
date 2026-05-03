// backend/src/routes/admin/users.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { supabaseAdmin } from '../../lib/supabase-admin.js';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';

export const adminUsersRouter = Router();

const CreateBody = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(72),
  fullName: z.string().min(1).max(120),
  carModelId: z.number().int().positive().optional().nullable(),
  role: z.enum(['user', 'admin']).optional(),
});

const RoleBody = z.object({ role: z.enum(['user', 'admin']) });
const EmailBody = z.object({ email: z.string().email() });
const PasswordBody = z.object({ password: z.string().min(6).max(72) });
const IdParam = z.string().uuid();

function serialize(u: {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: Date;
  carModel: { id: number; brand: string; model: string; batteryCapacityKwh: unknown } | null;
}) {
  return {
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
  };
}

adminUsersRouter.get('/', async (_req, res, next) => {
  try {
    const users = await prisma.profile.findMany({
      orderBy: { createdAt: 'desc' },
      include: { carModel: true },
    });
    res.json(users.map(serialize));
  } catch (e) {
    next(e);
  }
});

adminUsersRouter.post('/', async (req, res, next) => {
  try {
    const body = CreateBody.parse(req.body);

    if (body.carModelId != null) {
      const car = await prisma.carModel.findUnique({ where: { id: body.carModelId } });
      if (!car) throw badRequest('Invalid car_model_id');
    }

    const created = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });
    if (created.error || !created.data.user) {
      throw badRequest(created.error?.message ?? 'Failed to create user');
    }

    const userId = created.data.user.id;
    const profile = await prisma.profile.upsert({
      where: { id: userId },
      update: {
        email: body.email,
        fullName: body.fullName,
        carModelId: body.carModelId ?? null,
        role: body.role ?? 'user',
      },
      create: {
        id: userId,
        email: body.email,
        fullName: body.fullName,
        carModelId: body.carModelId ?? null,
        role: body.role ?? 'user',
      },
      include: { carModel: true },
    });

    res.status(201).json(serialize(profile));
  } catch (e) {
    next(e);
  }
});

adminUsersRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = IdParam.parse(req.params.id);
    if (id === req.user!.id) throw forbidden('Cannot delete your own account');

    const profile = await prisma.profile.findUnique({ where: { id } });
    if (!profile) throw notFound('User not found');

    const result = await supabaseAdmin.auth.admin.deleteUser(id);
    if (result.error) throw badRequest(result.error.message);

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

adminUsersRouter.patch('/:id/role', async (req, res, next) => {
  try {
    const id = IdParam.parse(req.params.id);
    const { role } = RoleBody.parse(req.body);

    if (id === req.user!.id && role !== 'admin') {
      throw forbidden('Cannot demote your own admin role');
    }

    const exists = await prisma.profile.findUnique({ where: { id } });
    if (!exists) throw notFound('User not found');

    const updated = await prisma.profile.update({
      where: { id },
      data: { role },
      include: { carModel: true },
    });
    res.json(serialize(updated));
  } catch (e) {
    next(e);
  }
});

adminUsersRouter.patch('/:id/email', async (req, res, next) => {
  try {
    const id = IdParam.parse(req.params.id);
    const { email } = EmailBody.parse(req.body);

    const exists = await prisma.profile.findUnique({ where: { id } });
    if (!exists) throw notFound('User not found');

    const dup = await prisma.profile.findFirst({ where: { email, NOT: { id } } });
    if (dup) throw conflict('Email already in use');

    const result = await supabaseAdmin.auth.admin.updateUserById(id, {
      email,
      email_confirm: true,
    });
    if (result.error) throw badRequest(result.error.message);

    const updated = await prisma.profile.update({
      where: { id },
      data: { email },
      include: { carModel: true },
    });
    res.json(serialize(updated));
  } catch (e) {
    next(e);
  }
});

adminUsersRouter.patch('/:id/password', async (req, res, next) => {
  try {
    const id = IdParam.parse(req.params.id);
    const { password } = PasswordBody.parse(req.body);

    const exists = await prisma.profile.findUnique({ where: { id } });
    if (!exists) throw notFound('User not found');

    const result = await supabaseAdmin.auth.admin.updateUserById(id, { password });
    if (result.error) throw badRequest(result.error.message);

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
