// backend/src/test/db.ts
import { prisma } from '../lib/prisma.js';

export async function resetDb() {
  await prisma.reservation.deleteMany();
  await prisma.station.deleteMany();
  await prisma.profile.deleteMany();
  // car_models seeded by test fixture, kept across tests
}

export async function makeUser(id: string, fullName = 'Test User', email = `${id}@t.dev`) {
  return prisma.profile.create({
    data: { id, email, fullName, role: 'user' },
  });
}

export async function makeStation(name = 'S1', powerKw = 50) {
  return prisma.station.create({
    data: {
      name,
      address: 'Oradea',
      latitude: 47.07,
      longitude: 21.92,
      powerKw,
    },
  });
}
