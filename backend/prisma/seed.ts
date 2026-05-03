// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CARS = [
  { brand: 'Tesla', model: 'Model 3', batteryCapacityKwh: 75 },
  { brand: 'Tesla', model: 'Model Y', batteryCapacityKwh: 75 },
  { brand: 'Tesla', model: 'Model S', batteryCapacityKwh: 100 },
  { brand: 'Volkswagen', model: 'ID.3', batteryCapacityKwh: 58 },
  { brand: 'Volkswagen', model: 'ID.4', batteryCapacityKwh: 77 },
  { brand: 'Renault', model: 'Zoe', batteryCapacityKwh: 52 },
  { brand: 'Nissan', model: 'Leaf', batteryCapacityKwh: 40 },
  { brand: 'BMW', model: 'i3', batteryCapacityKwh: 42 },
  { brand: 'BMW', model: 'i4', batteryCapacityKwh: 84 },
  { brand: 'Hyundai', model: 'Kona Electric', batteryCapacityKwh: 64 },
  { brand: 'Kia', model: 'EV6', batteryCapacityKwh: 77 },
  { brand: 'Audi', model: 'e-tron', batteryCapacityKwh: 95 },
];

async function main() {
  for (const car of CARS) {
    await prisma.carModel.upsert({
      where: { brand_model: { brand: car.brand, model: car.model } },
      update: { batteryCapacityKwh: car.batteryCapacityKwh },
      create: car,
    });
  }
  console.log(`Seeded ${CARS.length} car models.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
