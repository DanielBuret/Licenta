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

type SeedStation = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  powerKw: number;
};

// 20 stații în Oradea: 4 grupuri (cu 4, 3, 2, 2 stații) + 9 individuale = 20.
// Stațiile dintr-un grup sunt la ~20-30 m unele de altele, ca să se clusterizeze la zoom out.
const STATIONS: SeedStation[] = [
  // Era Park — 4 stații în parcare
  {
    name: 'Era Park A1',
    address: 'Calea Sântandrei 4, Oradea',
    latitude: 47.0539,
    longitude: 21.9067,
    powerKw: 22,
  },
  {
    name: 'Era Park A2',
    address: 'Calea Sântandrei 4, Oradea',
    latitude: 47.054,
    longitude: 21.9069,
    powerKw: 22,
  },
  {
    name: 'Era Park B1',
    address: 'Calea Sântandrei 4, Oradea',
    latitude: 47.0538,
    longitude: 21.907,
    powerKw: 50,
  },
  {
    name: 'Era Park B2',
    address: 'Calea Sântandrei 4, Oradea',
    latitude: 47.0541,
    longitude: 21.9066,
    powerKw: 50,
  },

  // Lotus Center — 3 stații
  {
    name: 'Lotus Center 1',
    address: 'Strada Nufărului 30, Oradea',
    latitude: 47.0598,
    longitude: 21.9421,
    powerKw: 22,
  },
  {
    name: 'Lotus Center 2',
    address: 'Strada Nufărului 30, Oradea',
    latitude: 47.0599,
    longitude: 21.9423,
    powerKw: 50,
  },
  {
    name: 'Lotus Center 3',
    address: 'Strada Nufărului 30, Oradea',
    latitude: 47.0597,
    longitude: 21.942,
    powerKw: 22,
  },

  // Piața Unirii (Vulturul Negru) — 2 stații
  {
    name: 'Piața Unirii 1',
    address: 'Piața Unirii 2, Oradea',
    latitude: 47.0573,
    longitude: 21.929,
    powerKw: 11,
  },
  {
    name: 'Piața Unirii 2',
    address: 'Piața Unirii 2, Oradea',
    latitude: 47.0572,
    longitude: 21.9292,
    powerKw: 22,
  },

  // Gara Oradea — 2 stații
  {
    name: 'Gara Oradea 1',
    address: 'Piața Bucureşti 1, Oradea',
    latitude: 47.0653,
    longitude: 21.9325,
    powerKw: 50,
  },
  {
    name: 'Gara Oradea 2',
    address: 'Piața Bucureşti 1, Oradea',
    latitude: 47.0654,
    longitude: 21.9327,
    powerKw: 50,
  },

  // 9 stații individuale, distribuite prin oraș
  {
    name: 'Cetatea Oradea',
    address: 'Piața Emanuil Gojdu 39-41, Oradea',
    latitude: 47.0613,
    longitude: 21.9358,
    powerKw: 22,
  },
  {
    name: 'Auchan Oradea',
    address: 'Calea Borșului 2, Oradea',
    latitude: 47.0768,
    longitude: 21.8901,
    powerKw: 50,
  },
  {
    name: 'Universitatea Oradea',
    address: 'Strada Universității 1, Oradea',
    latitude: 47.0454,
    longitude: 21.9182,
    powerKw: 22,
  },
  {
    name: 'Spitalul Județean',
    address: 'Strada Republicii 37, Oradea',
    latitude: 47.0666,
    longitude: 21.9303,
    powerKw: 22,
  },
  {
    name: 'Aeroport Oradea',
    address: 'Calea Aradului 80, Oradea',
    latitude: 47.025,
    longitude: 21.9026,
    powerKw: 50,
  },
  {
    name: 'Parc Industrial Vest',
    address: 'Calea Borșului 23, Oradea',
    latitude: 47.081,
    longitude: 21.88,
    powerKw: 75,
  },
  {
    name: 'Băile 1 Mai',
    address: 'Strada Tudor Vladimirescu 48, Oradea',
    latitude: 47.0498,
    longitude: 21.8985,
    powerKw: 22,
  },
  {
    name: 'Cartier Rogerius',
    address: 'Bulevardul Ștefan cel Mare 30, Oradea',
    latitude: 47.0732,
    longitude: 21.9176,
    powerKw: 22,
  },
  {
    name: 'Iosia Nord',
    address: 'Strada Nojoridului 12, Oradea',
    latitude: 47.0405,
    longitude: 21.9305,
    powerKw: 11,
  },
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

  let created = 0;
  let skipped = 0;
  for (const station of STATIONS) {
    const existing = await prisma.station.findFirst({ where: { name: station.name } });
    if (existing) {
      skipped += 1;
      continue;
    }
    await prisma.station.create({ data: station });
    created += 1;
  }
  console.log(`Seeded stations: ${created} created, ${skipped} already existed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
