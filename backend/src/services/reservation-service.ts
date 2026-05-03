// backend/src/services/reservation-service.ts
import { prisma } from '../lib/prisma.js';
import { conflict, badRequest } from '../lib/errors.js';

export interface CreateReservationInput {
  stationId: number;
  userId: string;
  batteryLevelStart: number;
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
};
