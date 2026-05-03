// backend/src/services/reservation-service.ts
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { conflict, badRequest, forbidden, notFound } from '../lib/errors.js';

export interface CreateReservationInput {
  stationId: number;
  userId: string;
  batteryLevelStart: number;
}

async function promoteQueueIfNeeded(tx: Prisma.TransactionClient, stationId: number) {
  const next = await tx.reservation.findFirst({
    where: { stationId, status: 'reserved', queuePosition: 2 },
  });
  if (!next) return;
  await tx.reservation.update({
    where: { id: next.id },
    data: { queuePosition: 1, reservedAt: new Date(), status: 'reserved' },
  });
}

export const reservationService = {
  async create(input: CreateReservationInput) {
    if (input.batteryLevelStart < 0 || input.batteryLevelStart > 99) {
      throw badRequest('batteryLevelStart must be in [0, 99]');
    }

    return prisma.$transaction(async (tx) => {
      const userActive = await tx.reservation.findFirst({
        where: {
          userId: input.userId,
          status: { in: ['reserved', 'charging'] },
        },
      });
      if (userActive) {
        throw conflict('User already has an active reservation');
      }

      const active = await tx.reservation.findMany({
        where: {
          stationId: input.stationId,
          status: { in: ['reserved', 'charging'] },
        },
        orderBy: { queuePosition: 'asc' },
        select: { queuePosition: true },
      });
      if (active.length >= 2) {
        throw conflict('Station is full');
      }

      const queuePosition = active.some((r) => r.queuePosition === 1) ? 2 : 1;

      return tx.reservation.create({
        data: {
          stationId: input.stationId,
          userId: input.userId,
          batteryLevelStart: input.batteryLevelStart,
          queuePosition,
          status: 'reserved',
        },
      });
    });
  },

  async cancel(input: { reservationId: bigint | number; callerId: string }) {
    const id =
      typeof input.reservationId === 'bigint' ? input.reservationId : BigInt(input.reservationId);
    return prisma.$transaction(async (tx) => {
      const r = await tx.reservation.findUnique({ where: { id } });
      if (!r) throw notFound('Reservation not found');
      if (r.userId !== input.callerId) throw forbidden('Not the owner');
      if (r.status === 'completed' || r.status === 'cancelled') {
        throw badRequest('Reservation is already terminal');
      }

      const updated = await tx.reservation.update({
        where: { id },
        data: { status: 'cancelled' },
      });

      if (r.queuePosition === 1) {
        await promoteQueueIfNeeded(tx, r.stationId);
      }
      return updated;
    });
  },
};
