# Charging Station Implementation Plan — Phase 1: Foundation & Backend

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the monorepo, configure Supabase + Prisma, and build a fully tested Express backend that supports auth, station/reservation CRUD, queue management, and the 1Hz grace-period timer described in the spec.

**Architecture:** npm workspaces with three packages — `shared/` (types + charging math), `backend/` (Express + Prisma + Supabase SDK), and a placeholder `frontend/` (built out in Phase 2). Backend uses Supabase Postgres for storage, Supabase Auth for identity (verifies JWT server-side), and a 1 Hz `setInterval` job for the reserved → charging transition.

**Tech Stack:** Node.js 20, TypeScript 5, Express 4, Prisma 5, Supabase JS SDK, zod, jsonwebtoken (JWKS verification), Vitest, ESLint, Prettier.

**Spec reference:** `docs/superpowers/specs/2026-05-03-charging-station-design.md`

**Out of scope for Phase 1:** Frontend (Vite, React, map, admin UI). All UI work is in Phase 2.

---

## Pre-flight: Supabase project

Before starting, the user creates a free Supabase project at https://supabase.com and notes the following from `Project Settings → API` and `Settings → Database`:

- `Project URL` → `SUPABASE_URL`
- `anon public` key → `SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (treat as secret)
- `JWT secret` → `SUPABASE_JWT_SECRET`
- Connection string (`URI`, with the password substituted) → `DATABASE_URL`

These values populate `.env` (created in Task 3 below). The plan does NOT commit them.

---

## Phase A — Repo & Monorepo Setup

### Task 1: Root `package.json` with npm workspaces

**Files:**

- Create: `/Users/mbp16tb/Licenta/package.json`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "charging-station",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "workspaces": ["shared", "backend", "frontend"],
  "scripts": {
    "build:shared": "npm --workspace shared run build",
    "dev:backend": "npm --workspace backend run dev",
    "test": "npm --workspaces --if-present run test",
    "lint": "npm --workspaces --if-present run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\""
  },
  "devDependencies": {
    "prettier": "^3.3.3",
    "typescript": "^5.5.4"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: initialize npm workspaces"
```

---

### Task 2: Root `tsconfig.base.json` and `.prettierrc`

**Files:**

- Create: `/Users/mbp16tb/Licenta/tsconfig.base.json`
- Create: `/Users/mbp16tb/Licenta/.prettierrc.json`
- Create: `/Users/mbp16tb/Licenta/.editorconfig`

- [ ] **Step 1: Write `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- [ ] **Step 2: Write `.prettierrc.json`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **Step 3: Write `.editorconfig`**

```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

- [ ] **Step 4: Commit**

```bash
git add tsconfig.base.json .prettierrc.json .editorconfig
git commit -m "chore: add shared TS config and formatter rules"
```

---

### Task 3: `.env.example` and verify `.gitignore`

**Files:**

- Create: `/Users/mbp16tb/Licenta/.env.example`
- Verify: `/Users/mbp16tb/Licenta/.gitignore` already excludes `.env`

- [ ] **Step 1: Write `.env.example`**

```
# Supabase project values (copy from Supabase dashboard)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# Postgres connection string (from Supabase → Settings → Database)
DATABASE_URL=

# Backend
PORT=4000
TIME_SCALE_FACTOR=60

# Frontend (consumed by Vite in Phase 2)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:4000
VITE_TIME_SCALE_FACTOR=60
```

- [ ] **Step 2: Verify `.gitignore` already lists `.env`**

```bash
grep -E "^\.env$" .gitignore
```

Expected: prints `.env`. (Already added in the spec commit.)

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: add .env.example with required keys"
```

---

### Task 4: Empty `frontend` workspace placeholder

This keeps `npm install` happy and reserves the directory for Phase 2.

**Files:**

- Create: `/Users/mbp16tb/Licenta/frontend/package.json`

- [ ] **Step 1: Write minimal `package.json`**

```json
{
  "name": "@charging-station/frontend",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "test": "echo \"frontend tests come in phase 2\" && exit 0"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/package.json
git commit -m "chore: add frontend workspace placeholder"
```

---

## Phase B — Shared Package (Types + Charging Math)

### Task 5: Initialize `shared` workspace

**Files:**

- Create: `/Users/mbp16tb/Licenta/shared/package.json`
- Create: `/Users/mbp16tb/Licenta/shared/tsconfig.json`
- Create: `/Users/mbp16tb/Licenta/shared/src/index.ts` (placeholder)

- [ ] **Step 1: Write `shared/package.json`**

```json
{
  "name": "@charging-station/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint \"src/**/*.ts\""
  },
  "devDependencies": {
    "vitest": "^2.0.5",
    "typescript": "^5.5.4"
  }
}
```

- [ ] **Step 2: Write `shared/tsconfig.json`**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Write `shared/src/index.ts` placeholder**

```ts
export * from "./types/index.js";
export * from "./charging.js";
```

- [ ] **Step 4: Install workspace deps**

```bash
npm install
```

Expected: succeeds, no errors. Creates root `node_modules` and `package-lock.json`.

- [ ] **Step 5: Commit**

```bash
git add shared/ package-lock.json
git commit -m "feat(shared): initialize shared workspace"
```

---

### Task 6: Shared types

**Files:**

- Create: `/Users/mbp16tb/Licenta/shared/src/types/index.ts`
- Create: `/Users/mbp16tb/Licenta/shared/src/types/station.ts`
- Create: `/Users/mbp16tb/Licenta/shared/src/types/reservation.ts`
- Create: `/Users/mbp16tb/Licenta/shared/src/types/profile.ts`
- Create: `/Users/mbp16tb/Licenta/shared/src/types/car-model.ts`

- [ ] **Step 1: Write `types/profile.ts`**

```ts
export type UserRole = "user" | "admin";

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  carModelId: number | null;
  role: UserRole;
  createdAt: string;
}
```

- [ ] **Step 2: Write `types/car-model.ts`**

```ts
export interface CarModel {
  id: number;
  brand: string;
  model: string;
  batteryCapacityKwh: number;
}
```

- [ ] **Step 3: Write `types/station.ts`**

```ts
export interface Station {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  powerKw: number;
  createdBy: string | null;
  createdAt: string;
}

export interface StationWithActivity extends Station {
  activeReservations: number;
  hasCharging: boolean;
  hasReserved: boolean;
}
```

- [ ] **Step 4: Write `types/reservation.ts`**

```ts
export type ReservationStatus =
  | "reserved"
  | "charging"
  | "completed"
  | "cancelled";

export type QueuePosition = 1 | 2;

export interface Reservation {
  id: number;
  stationId: number;
  userId: string;
  batteryLevelStart: number;
  status: ReservationStatus;
  queuePosition: QueuePosition;
  reservedAt: string;
  chargingStartedAt: string | null;
  chargingEndedAt: string | null;
}

export interface ReservationWithUser extends Reservation {
  userFullName: string;
  carModelLabel: string | null;
  batteryCapacityKwh: number | null;
}

export const ACTIVE_STATUSES: ReadonlyArray<ReservationStatus> = [
  "reserved",
  "charging",
] as const;
```

- [ ] **Step 5: Write `types/index.ts`**

```ts
export * from "./profile.js";
export * from "./car-model.js";
export * from "./station.js";
export * from "./reservation.js";
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npm --workspace shared run build
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add shared/src/types/
git commit -m "feat(shared): add domain types"
```

---

### Task 7: TDD — `estimateChargingSeconds`

**Files:**

- Create: `/Users/mbp16tb/Licenta/shared/src/charging.ts`
- Create: `/Users/mbp16tb/Licenta/shared/src/charging.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// shared/src/charging.test.ts
import { describe, it, expect } from "vitest";
import { estimateChargingSeconds } from "./charging.js";

describe("estimateChargingSeconds", () => {
  it("full charge from 0% on a 50kW charger with a 75kWh battery is 1h real (60s with factor 60)", () => {
    expect(estimateChargingSeconds(75, 0, 50, 60)).toBeCloseTo(90, 1);
    // Wait — 75 / 50 = 1.5h = 5400s real → / 60 = 90s. Correct.
  });

  it("with timeScaleFactor=1 returns physical seconds", () => {
    expect(estimateChargingSeconds(75, 0, 50, 1)).toBeCloseTo(5400, 0);
  });

  it("partial charge from 20% on the same setup is 0.8 of full", () => {
    expect(estimateChargingSeconds(75, 20, 50, 60)).toBeCloseTo(72, 1);
  });

  it("starting at 99% returns near zero", () => {
    expect(estimateChargingSeconds(75, 99, 50, 60)).toBeCloseTo(0.9, 1);
  });

  it("throws if station power is zero or negative", () => {
    expect(() => estimateChargingSeconds(75, 0, 0, 60)).toThrow();
    expect(() => estimateChargingSeconds(75, 0, -10, 60)).toThrow();
  });

  it("throws if battery capacity is non-positive", () => {
    expect(() => estimateChargingSeconds(0, 0, 50, 60)).toThrow();
  });

  it("throws if start percent is outside [0,99]", () => {
    expect(() => estimateChargingSeconds(75, -1, 50, 60)).toThrow();
    expect(() => estimateChargingSeconds(75, 100, 50, 60)).toThrow();
  });

  it("throws if timeScaleFactor is non-positive", () => {
    expect(() => estimateChargingSeconds(75, 0, 50, 0)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm --workspace shared test
```

Expected: FAIL with "Cannot find module './charging.js'" or similar.

- [ ] **Step 3: Write the implementation**

```ts
// shared/src/charging.ts
export function estimateChargingSeconds(
  batteryCapacityKwh: number,
  batteryStartPercent: number,
  stationPowerKw: number,
  timeScaleFactor: number,
): number {
  if (!Number.isFinite(batteryCapacityKwh) || batteryCapacityKwh <= 0) {
    throw new Error("batteryCapacityKwh must be a positive number");
  }
  if (!Number.isFinite(stationPowerKw) || stationPowerKw <= 0) {
    throw new Error("stationPowerKw must be a positive number");
  }
  if (!Number.isFinite(timeScaleFactor) || timeScaleFactor <= 0) {
    throw new Error("timeScaleFactor must be a positive number");
  }
  if (
    !Number.isFinite(batteryStartPercent) ||
    batteryStartPercent < 0 ||
    batteryStartPercent > 99
  ) {
    throw new Error("batteryStartPercent must be in [0, 99]");
  }

  const energyKwh = (batteryCapacityKwh * (100 - batteryStartPercent)) / 100;
  const realSeconds = (energyKwh / stationPowerKw) * 3600;
  return realSeconds / timeScaleFactor;
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npm --workspace shared test
```

Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add shared/src/charging.ts shared/src/charging.test.ts
git commit -m "feat(shared): add estimateChargingSeconds with tests"
```

---

## Phase C — Database & Prisma

### Task 8: Initialize `backend` workspace

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/package.json`
- Create: `/Users/mbp16tb/Licenta/backend/tsconfig.json`

- [ ] **Step 1: Write `backend/package.json`**

```json
{
  "name": "@charging-station/backend",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint \"src/**/*.ts\"",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:reset": "prisma migrate reset",
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@charging-station/shared": "*",
    "@prisma/client": "^5.18.0",
    "@supabase/supabase-js": "^2.45.4",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "jose": "^5.6.3",
    "pino": "^9.4.0",
    "pino-pretty": "^11.2.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^22.5.0",
    "prisma": "^5.18.0",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2",
    "tsx": "^4.19.0",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 2: Write `backend/tsconfig.json`**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Install dependencies**

```bash
npm install
```

Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add backend/package.json backend/tsconfig.json package-lock.json
git commit -m "feat(backend): initialize backend workspace"
```

---

### Task 9: Prisma schema mirroring spec §6

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/prisma/schema.prisma`

- [ ] **Step 1: Write schema**

```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model CarModel {
  id                  Int      @id @default(autoincrement())
  brand               String
  model               String
  batteryCapacityKwh  Decimal  @map("battery_capacity_kwh") @db.Decimal(5, 1)

  profiles            Profile[]

  @@unique([brand, model])
  @@map("car_models")
}

model Profile {
  id           String   @id @db.Uuid
  email        String   @unique
  fullName     String   @map("full_name")
  carModelId   Int?     @map("car_model_id")
  role         String   @default("user")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz()

  carModel     CarModel?      @relation(fields: [carModelId], references: [id])
  reservations Reservation[]
  stations     Station[]      @relation("StationCreatedBy")

  @@map("profiles")
}

model Station {
  id          Int      @id @default(autoincrement())
  name        String
  address     String
  latitude    Float
  longitude   Float
  powerKw     Decimal  @map("power_kw") @db.Decimal(5, 1)
  createdBy   String?  @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz()

  creator      Profile?      @relation("StationCreatedBy", fields: [createdBy], references: [id])
  reservations Reservation[]

  @@map("stations")
}

model Reservation {
  id                 BigInt   @id @default(autoincrement())
  stationId          Int      @map("station_id")
  userId             String   @map("user_id") @db.Uuid
  batteryLevelStart  Int      @map("battery_level_start")
  status             String   @default("reserved")
  queuePosition      Int      @map("queue_position") @db.SmallInt
  reservedAt         DateTime @default(now()) @map("reserved_at") @db.Timestamptz()
  chargingStartedAt  DateTime? @map("charging_started_at") @db.Timestamptz()
  chargingEndedAt    DateTime? @map("charging_ended_at") @db.Timestamptz()

  station Station @relation(fields: [stationId], references: [id], onDelete: Restrict)
  user    Profile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("reservations")
}
```

Note: Prisma cannot natively express the partial unique index from the spec. We add it as a raw SQL migration in Task 11.

- [ ] **Step 2: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat(backend): add Prisma schema"
```

---

### Task 10: First Prisma migration

This requires `DATABASE_URL` to be set in `.env`. The user creates the Supabase project (Pre-flight section above) and fills `.env` before this task.

**Files:**

- Created (by Prisma): `/Users/mbp16tb/Licenta/backend/prisma/migrations/<timestamp>_init/migration.sql`

- [ ] **Step 1: Confirm `.env` has `DATABASE_URL`**

```bash
grep -E "^DATABASE_URL=postgres" /Users/mbp16tb/Licenta/.env
```

Expected: prints a `DATABASE_URL=...` line. If not, fill `.env` from `.env.example`.

- [ ] **Step 2: Run initial migration**

```bash
cd /Users/mbp16tb/Licenta && npx --workspace backend prisma migrate dev --name init
```

Expected: migration created in `backend/prisma/migrations/<ts>_init/migration.sql`, applied to Supabase, `@prisma/client` generated.

- [ ] **Step 3: Verify tables in Supabase**

In Supabase dashboard → Table Editor, confirm: `car_models`, `profiles`, `stations`, `reservations`. (No raw SQL extras yet — those land in Task 11.)

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/migrations/
git commit -m "feat(backend): initial Prisma migration"
```

---

### Task 11: Raw-SQL migration — partial unique index, RLS, profile trigger

Prisma's "create empty migration" feature lets us hand-write SQL.

**Files:**

- Created (by Prisma): `/Users/mbp16tb/Licenta/backend/prisma/migrations/<timestamp>_postgres_extras/migration.sql`

- [ ] **Step 1: Generate empty migration**

```bash
cd /Users/mbp16tb/Licenta && npx --workspace backend prisma migrate dev --create-only --name postgres_extras
```

This creates an empty migration without applying it. Open the new file (printed in stdout) for editing.

- [ ] **Step 2: Replace migration body**

```sql
-- backend/prisma/migrations/<ts>_postgres_extras/migration.sql

-- Status check + queue_position check
ALTER TABLE reservations
  ADD CONSTRAINT reservations_status_chk
    CHECK (status IN ('reserved','charging','completed','cancelled'));

ALTER TABLE reservations
  ADD CONSTRAINT reservations_queue_position_chk
    CHECK (queue_position IN (1,2));

ALTER TABLE reservations
  ADD CONSTRAINT reservations_battery_level_chk
    CHECK (battery_level_start BETWEEN 0 AND 99);

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_chk
    CHECK (role IN ('user','admin'));

ALTER TABLE car_models
  ADD CONSTRAINT car_models_capacity_chk
    CHECK (battery_capacity_kwh > 0);

ALTER TABLE stations
  ADD CONSTRAINT stations_power_chk
    CHECK (power_kw > 0);

-- Partial unique index: at most one active reservation per (station, position)
CREATE UNIQUE INDEX one_active_per_position
  ON reservations(station_id, queue_position)
  WHERE status IN ('reserved','charging');

-- Helper indexes
CREATE INDEX idx_reservations_user
  ON reservations(user_id);

CREATE INDEX idx_reservations_station_active
  ON reservations(station_id)
  WHERE status IN ('reserved','charging');

-- Foreign key: profiles.id references auth.users
ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_fk_auth_users
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Trigger: when a Supabase Auth user is created, insert a default profile row
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Row Level Security
ALTER TABLE car_models   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Public read on car_models, stations, reservations (for realtime + map display)
CREATE POLICY "car_models_select_all"
  ON car_models FOR SELECT
  USING (true);

CREATE POLICY "stations_select_all"
  ON stations FOR SELECT
  USING (true);

CREATE POLICY "reservations_select_all"
  ON reservations FOR SELECT
  USING (true);

-- Profiles: users see their own row only
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

- [ ] **Step 3: Apply the migration**

```bash
npx --workspace backend prisma migrate dev
```

Expected: migration applies with no errors.

- [ ] **Step 4: Quick smoke verification**

In Supabase SQL editor:

```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'reservations';
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
SELECT polname FROM pg_policies WHERE tablename IN ('car_models','stations','profiles','reservations');
```

Expected: index `one_active_per_position` exists, trigger exists, four RLS policies listed.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/migrations/
git commit -m "feat(backend): add partial unique index, RLS policies, profile trigger"
```

---

### Task 12: Seed script for `car_models`

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/prisma/seed.ts`

- [ ] **Step 1: Write seed**

```ts
// backend/prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CARS = [
  { brand: "Tesla", model: "Model 3", batteryCapacityKwh: 75 },
  { brand: "Tesla", model: "Model Y", batteryCapacityKwh: 75 },
  { brand: "Tesla", model: "Model S", batteryCapacityKwh: 100 },
  { brand: "Volkswagen", model: "ID.3", batteryCapacityKwh: 58 },
  { brand: "Volkswagen", model: "ID.4", batteryCapacityKwh: 77 },
  { brand: "Renault", model: "Zoe", batteryCapacityKwh: 52 },
  { brand: "Nissan", model: "Leaf", batteryCapacityKwh: 40 },
  { brand: "BMW", model: "i3", batteryCapacityKwh: 42 },
  { brand: "BMW", model: "i4", batteryCapacityKwh: 84 },
  { brand: "Hyundai", model: "Kona Electric", batteryCapacityKwh: 64 },
  { brand: "Kia", model: "EV6", batteryCapacityKwh: 77 },
  { brand: "Audi", model: "e-tron", batteryCapacityKwh: 95 },
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
```

- [ ] **Step 2: Run seed**

```bash
npm --workspace backend run seed
```

Expected: prints `Seeded 12 car models.`. Verify in Supabase Table Editor → `car_models` has 12 rows.

- [ ] **Step 3: Commit**

```bash
git add backend/prisma/seed.ts
git commit -m "feat(backend): seed 12 EV car models"
```

---

## Phase D — Backend Foundations

### Task 13: Env loader with zod validation

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/src/config/env.ts`

- [ ] **Step 1: Write env loader**

```ts
// backend/src/config/env.ts
import "dotenv/config";
import { z } from "zod";

const Schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  TIME_SCALE_FACTOR: z.coerce.number().positive().default(60),
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),
});

const parsed = Schema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "Invalid environment configuration:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
```

- [ ] **Step 2: Sanity test (no automated test, just import)**

```bash
cd /Users/mbp16tb/Licenta && node --import tsx --eval "import('./backend/src/config/env.ts').then(m => console.log(m.env.NODE_ENV))"
```

Expected: prints `development`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/config/env.ts
git commit -m "feat(backend): add zod-validated env loader"
```

---

### Task 14: Prisma + Supabase admin clients (singletons)

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/src/lib/prisma.ts`
- Create: `/Users/mbp16tb/Licenta/backend/src/lib/supabase-admin.ts`

- [ ] **Step 1: Write `lib/prisma.ts`**

```ts
// backend/src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
```

- [ ] **Step 2: Write `lib/supabase-admin.ts`**

```ts
// backend/src/lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/lib/
git commit -m "feat(backend): add prisma and supabase admin clients"
```

---

### Task 15: Auth middleware (JWT verification)

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/src/middleware/auth.ts`
- Create: `/Users/mbp16tb/Licenta/backend/src/middleware/auth.test.ts`
- Create: `/Users/mbp16tb/Licenta/backend/src/types/express.d.ts`

- [ ] **Step 1: Augment `Request` with `user`**

```ts
// backend/src/types/express.d.ts
import type { UserRole } from "@charging-station/shared";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export {};
```

- [ ] **Step 2: Write the failing test**

```ts
// backend/src/middleware/auth.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { SignJWT } from "jose";
import { requireAuth } from "./auth.js";

const TEST_SECRET = "unit-test-secret-must-be-32-chars-long-or-more";

vi.mock("../config/env.js", () => ({
  env: { SUPABASE_JWT_SECRET: TEST_SECRET },
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "../lib/prisma.js";

async function makeJwt(sub: string) {
  const secret = new TextEncoder().encode(TEST_SECRET);
  return await new SignJWT({ sub, email: "a@b.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

function buildApp() {
  const app = express();
  app.get("/protected", requireAuth, (req, res) => {
    res.json({ id: req.user!.id, role: req.user!.role });
  });
  return app;
}

describe("requireAuth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when no Authorization header", async () => {
    const res = await request(buildApp()).get("/protected");
    expect(res.status).toBe(401);
  });

  it("returns 401 for malformed token", async () => {
    const res = await request(buildApp())
      .get("/protected")
      .set("Authorization", "Bearer not-a-jwt");
    expect(res.status).toBe(401);
  });

  it("returns 403 when JWT is valid but profile not found", async () => {
    (prisma.profile.findUnique as any).mockResolvedValue(null);
    const jwt = await makeJwt("00000000-0000-0000-0000-000000000001");
    const res = await request(buildApp())
      .get("/protected")
      .set("Authorization", `Bearer ${jwt}`);
    expect(res.status).toBe(403);
  });

  it("attaches user when JWT and profile both valid", async () => {
    (prisma.profile.findUnique as any).mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      email: "a@b.com",
      role: "user",
    });
    const jwt = await makeJwt("00000000-0000-0000-0000-000000000001");
    const res = await request(buildApp())
      .get("/protected")
      .set("Authorization", `Bearer ${jwt}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: "00000000-0000-0000-0000-000000000001",
      role: "user",
    });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm --workspace backend test
```

Expected: FAIL with module not found.

- [ ] **Step 4: Write the middleware**

```ts
// backend/src/middleware/auth.ts
import type { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import type { UserRole } from "@charging-station/shared";

const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.header("authorization") ?? req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({
        error: { code: "unauthenticated", message: "Missing bearer token" },
      });
  }

  const token = header.slice("Bearer ".length);
  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.sub !== "string") throw new Error("sub missing");
    userId = payload.sub;
  } catch {
    return res
      .status(401)
      .json({ error: { code: "unauthenticated", message: "Invalid token" } });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!profile) {
    return res
      .status(403)
      .json({ error: { code: "forbidden", message: "Profile not found" } });
  }

  req.user = {
    id: profile.id,
    email: profile.email,
    role: profile.role as UserRole,
  };
  next();
}
```

- [ ] **Step 5: Run tests, verify pass**

```bash
npm --workspace backend test
```

Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/src/middleware/auth.ts backend/src/middleware/auth.test.ts backend/src/types/express.d.ts
git commit -m "feat(backend): add auth middleware with JWT verification"
```

---

### Task 16: Admin middleware

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/src/middleware/admin.ts`

- [ ] **Step 1: Write middleware**

```ts
// backend/src/middleware/admin.ts
import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ error: { code: "forbidden", message: "Admin only" } });
  }
  next();
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/middleware/admin.ts
git commit -m "feat(backend): add admin role guard"
```

---

### Task 17: Error handler middleware

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/src/middleware/error.ts`
- Create: `/Users/mbp16tb/Licenta/backend/src/lib/errors.ts`

- [ ] **Step 1: Write error classes**

```ts
// backend/src/lib/errors.ts
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new HttpError(400, "bad_request", msg, details);
export const notFound = (msg = "Not found") =>
  new HttpError(404, "not_found", msg);
export const conflict = (msg: string) => new HttpError(409, "conflict", msg);
export const forbidden = (msg = "Forbidden") =>
  new HttpError(403, "forbidden", msg);
```

- [ ] **Step 2: Write error middleware**

```ts
// backend/src/middleware/error.ts
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors.js";

// 4-arg signature is REQUIRED by Express to identify this as the error handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "validation",
        message: "Invalid input",
        details: err.flatten(),
      },
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  console.error("Unhandled error", err);
  return res
    .status(500)
    .json({ error: { code: "internal", message: "Internal server error" } });
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/middleware/error.ts backend/src/lib/errors.ts
git commit -m "feat(backend): add error handler and HttpError types"
```

---

### Task 18: Express server skeleton with health route

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/src/server.ts`
- Create: `/Users/mbp16tb/Licenta/backend/src/index.ts`

- [ ] **Step 1: Write `server.ts`**

```ts
// backend/src/server.ts
import express from "express";
import cors from "cors";
import { errorMiddleware } from "./middleware/error.js";

export function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // Routers will be mounted here in later tasks
  // app.use('/api/profile', profileRouter);
  // ...

  app.use(errorMiddleware);
  return app;
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
// backend/src/index.ts
import { buildApp } from "./server.js";
import { env } from "./config/env.js";

const app = buildApp();
app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
```

- [ ] **Step 3: Boot it**

```bash
npm --workspace backend run dev
```

In a second terminal:

```bash
curl http://localhost:4000/api/health
```

Expected: `{"status":"ok","uptime":...}`. Stop the dev server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add backend/src/server.ts backend/src/index.ts
git commit -m "feat(backend): add Express skeleton with health route"
```

---

## Phase E — Public Routes

### Task 19: Profile routes

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/src/routes/profile.ts`
- Modify: `/Users/mbp16tb/Licenta/backend/src/server.ts` (mount router)

- [ ] **Step 1: Write router**

```ts
// backend/src/routes/profile.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { notFound, badRequest } from "../lib/errors.js";

export const profileRouter = Router();

profileRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.user!.id },
      include: { carModel: true },
    });
    if (!profile) throw notFound("Profile not found");
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

profileRouter.patch("/", requireAuth, async (req, res, next) => {
  try {
    const body = PatchSchema.parse(req.body);
    if (body.carModelId != null) {
      const exists = await prisma.carModel.findUnique({
        where: { id: body.carModelId },
      });
      if (!exists) throw badRequest("Unknown carModelId");
    }
    const updated = await prisma.profile.update({
      where: { id: req.user!.id },
      data: body,
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
```

- [ ] **Step 2: Mount router in `server.ts`**

```ts
// in backend/src/server.ts, replace the mount-point comment with:
import { profileRouter } from "./routes/profile.js";
// ...
app.use("/api/profile", profileRouter);
```

- [ ] **Step 3: Manual smoke**

Boot the server, then (with a JWT obtained from a test user — the user can create one via Supabase dashboard's "Send magic link" or directly via `/auth/v1/signup` REST):

```bash
JWT="..."
curl -H "Authorization: Bearer $JWT" http://localhost:4000/api/profile
```

Expected: 200 with the user's profile, possibly with `carModelId: null` until `PATCH` is called.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/profile.ts backend/src/server.ts
git commit -m "feat(backend): add profile GET/PATCH routes"
```

---

### Task 20: Car models route

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/src/routes/car-models.ts`
- Modify: `/Users/mbp16tb/Licenta/backend/src/server.ts`

- [ ] **Step 1: Write router**

```ts
// backend/src/routes/car-models.ts
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const carModelsRouter = Router();

carModelsRouter.get("/", async (_req, res, next) => {
  try {
    const cars = await prisma.carModel.findMany({
      orderBy: [{ brand: "asc" }, { model: "asc" }],
    });
    res.json(
      cars.map((c) => ({
        id: c.id,
        brand: c.brand,
        model: c.model,
        batteryCapacityKwh: Number(c.batteryCapacityKwh),
      })),
    );
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 2: Mount in `server.ts`**

```ts
import { carModelsRouter } from "./routes/car-models.js";
app.use("/api/car-models", carModelsRouter);
```

- [ ] **Step 3: Smoke test**

```bash
curl http://localhost:4000/api/car-models | head
```

Expected: JSON array with 12 entries. (Not auth-gated — needed for register form.)

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/car-models.ts backend/src/server.ts
git commit -m "feat(backend): expose car-models for registration"
```

---

### Task 21: Stations list/detail routes

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/src/routes/stations.ts`
- Modify: `/Users/mbp16tb/Licenta/backend/src/server.ts`

- [ ] **Step 1: Write router**

```ts
// backend/src/routes/stations.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/errors.js";

export const stationsRouter = Router();

stationsRouter.get("/", async (_req, res, next) => {
  try {
    const stations = await prisma.station.findMany({
      orderBy: { name: "asc" },
      include: {
        reservations: {
          where: { status: { in: ["reserved", "charging"] } },
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
        hasCharging: active.some((r) => r.status === "charging"),
        hasReserved: active.some((r) => r.status === "reserved"),
      };
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
});

stationsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const station = await prisma.station.findUnique({
      where: { id },
      include: {
        reservations: {
          where: { status: { in: ["reserved", "charging"] } },
          orderBy: { queuePosition: "asc" },
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
    if (!station) throw notFound("Station not found");

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
        carModelLabel: r.user.carModel
          ? `${r.user.carModel.brand} ${r.user.carModel.model}`
          : null,
        batteryCapacityKwh: r.user.carModel
          ? Number(r.user.carModel.batteryCapacityKwh)
          : null,
      })),
    });
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 2: Mount in `server.ts`**

```ts
import { stationsRouter } from "./routes/stations.js";
app.use("/api/stations", stationsRouter);
```

- [ ] **Step 3: Smoke test**

```bash
curl http://localhost:4000/api/stations
```

Expected: `[]` (no stations yet — admin route comes later).

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/stations.ts backend/src/server.ts
git commit -m "feat(backend): add stations list and detail routes"
```

---

## Phase F — Reservation Service & Routes

### Task 22: TDD — `createReservation`

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/src/services/reservation-service.ts`
- Create: `/Users/mbp16tb/Licenta/backend/src/services/reservation-service.test.ts`
- Create: `/Users/mbp16tb/Licenta/backend/src/test/db.ts` (test helper)

- [ ] **Step 1: Write integration-test helper**

```ts
// backend/src/test/db.ts
import { prisma } from "../lib/prisma.js";

export async function resetDb() {
  await prisma.reservation.deleteMany();
  await prisma.station.deleteMany();
  await prisma.profile.deleteMany();
  // car_models seeded by test fixture, kept across tests
}

export async function makeUser(
  id: string,
  fullName = "Test User",
  email = `${id}@t.dev`,
) {
  return prisma.profile.create({
    data: { id, email, fullName, role: "user" },
  });
}

export async function makeStation(name = "S1", powerKw = 50) {
  return prisma.station.create({
    data: {
      name,
      address: "Oradea",
      latitude: 47.07,
      longitude: 21.92,
      powerKw,
    },
  });
}
```

> **Note on test DB:** Tests run against the same Supabase Postgres. To avoid clashing with real data, use a separate Supabase project for testing OR prefix test data and `resetDb` only clears those rows. For simplicity in this thesis, use a separate Supabase project labelled "charging-station-test" and point a `.env.test` file at its `DATABASE_URL`. Vitest is configured to load `.env.test` via `dotenv-cli` in Step 4 below.

- [ ] **Step 2: Write the failing test**

```ts
// backend/src/services/reservation-service.test.ts
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { reservationService } from "./reservation-service.js";
import { resetDb, makeUser, makeStation } from "../test/db.js";

const ALICE = "00000000-0000-0000-0000-00000000A11C";
const BOB = "00000000-0000-0000-0000-00000000B0B0";

describe("reservationService.create", () => {
  beforeAll(async () => {
    await resetDb();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it("creates a reservation at queue_position=1 when station empty", async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 20,
    });
    expect(r.queuePosition).toBe(1);
    expect(r.status).toBe("reserved");
  });

  it("creates queue_position=2 when an active row already exists", async () => {
    await makeUser(ALICE);
    await makeUser(BOB);
    const st = await makeStation();
    await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    const r = await reservationService.create({
      stationId: st.id,
      userId: BOB,
      batteryLevelStart: 30,
    });
    expect(r.queuePosition).toBe(2);
  });

  it("rejects when station already has 2 active reservations", async () => {
    await makeUser(ALICE);
    await makeUser(BOB);
    await makeUser("00000000-0000-0000-0000-00000000CCCC", "C");
    const st = await makeStation();
    await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    await reservationService.create({
      stationId: st.id,
      userId: BOB,
      batteryLevelStart: 30,
    });
    await expect(
      reservationService.create({
        stationId: st.id,
        userId: "00000000-0000-0000-0000-00000000CCCC",
        batteryLevelStart: 50,
      }),
    ).rejects.toThrow(/full/i);
  });

  it("rejects when the user already holds an active reservation", async () => {
    await makeUser(ALICE);
    const s1 = await makeStation("S1");
    const s2 = await makeStation("S2");
    await reservationService.create({
      stationId: s1.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    await expect(
      reservationService.create({
        stationId: s2.id,
        userId: ALICE,
        batteryLevelStart: 20,
      }),
    ).rejects.toThrow(/already/i);
  });

  it("rejects invalid battery percent", async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    await expect(
      reservationService.create({
        stationId: st.id,
        userId: ALICE,
        batteryLevelStart: 100,
      }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Add test env loader to `package.json`**

In `backend/package.json` adjust the test script:

```json
"test": "dotenv -e ../.env.test -- vitest run",
"test:watch": "dotenv -e ../.env.test -- vitest"
```

And add the dependency:

```bash
npm install -D --workspace backend dotenv-cli
```

Create `/Users/mbp16tb/Licenta/.env.test` (gitignored — already covered by `.env.local` pattern; we'll widen `.gitignore` next).

- [ ] **Step 4: Widen `.gitignore` for `.env.test`**

```bash
grep -q "^\.env\.test$" .gitignore || echo ".env.test" >> .gitignore
```

- [ ] **Step 5: User fills `.env.test`**

User creates a second Supabase project for tests, copies the same five env vars, fills `/Users/mbp16tb/Licenta/.env.test`, and runs migrations against it:

```bash
DOTENV_CONFIG_PATH=.env.test npx --workspace backend prisma migrate deploy
DOTENV_CONFIG_PATH=.env.test npm --workspace backend run seed
```

- [ ] **Step 6: Run the failing test**

```bash
npm --workspace backend test
```

Expected: FAIL with module-not-found for `./reservation-service.js`.

- [ ] **Step 7: Implement `create`**

```ts
// backend/src/services/reservation-service.ts
import { prisma } from "../lib/prisma.js";
import { conflict, badRequest } from "../lib/errors.js";

export interface CreateReservationInput {
  stationId: number;
  userId: string;
  batteryLevelStart: number;
}

export const reservationService = {
  async create(input: CreateReservationInput) {
    if (input.batteryLevelStart < 0 || input.batteryLevelStart > 99) {
      throw badRequest("batteryLevelStart must be in [0, 99]");
    }

    return prisma.$transaction(async (tx) => {
      const userActive = await tx.reservation.findFirst({
        where: {
          userId: input.userId,
          status: { in: ["reserved", "charging"] },
        },
      });
      if (userActive) {
        throw conflict("User already has an active reservation");
      }

      const active = await tx.reservation.findMany({
        where: {
          stationId: input.stationId,
          status: { in: ["reserved", "charging"] },
        },
        orderBy: { queuePosition: "asc" },
        select: { queuePosition: true },
      });
      if (active.length >= 2) {
        throw conflict("Station is full");
      }

      const queuePosition = active.some((r) => r.queuePosition === 1) ? 2 : 1;

      return tx.reservation.create({
        data: {
          stationId: input.stationId,
          userId: input.userId,
          batteryLevelStart: input.batteryLevelStart,
          queuePosition,
          status: "reserved",
        },
      });
    });
  },
};
```

- [ ] **Step 8: Run tests, verify pass**

```bash
npm --workspace backend test
```

Expected: 5 tests pass.

- [ ] **Step 9: Commit**

```bash
git add backend/src/services/reservation-service.ts backend/src/services/reservation-service.test.ts backend/src/test/ backend/package.json package-lock.json .gitignore
git commit -m "feat(backend): reservation create with queue + uniqueness rules"
```

---

### Task 23: TDD — `cancelReservation`

**Files:**

- Modify: `/Users/mbp16tb/Licenta/backend/src/services/reservation-service.ts`
- Modify: `/Users/mbp16tb/Licenta/backend/src/services/reservation-service.test.ts`

- [ ] **Step 1: Add tests**

```ts
describe("reservationService.cancel", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("cancels own reserved row", async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    const after = await reservationService.cancel({
      reservationId: r.id,
      callerId: ALICE,
    });
    expect(after.status).toBe("cancelled");
  });

  it("promotes queue_position=2 to 1 when active row is cancelled", async () => {
    await makeUser(ALICE);
    await makeUser(BOB);
    const st = await makeStation();
    const a = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    const b = await reservationService.create({
      stationId: st.id,
      userId: BOB,
      batteryLevelStart: 30,
    });
    await reservationService.cancel({ reservationId: a.id, callerId: ALICE });
    const refreshed = await prisma.reservation.findUnique({
      where: { id: b.id },
    });
    expect(refreshed?.queuePosition).toBe(1);
    expect(refreshed?.status).toBe("reserved");
    // reservedAt should have been updated to start a fresh grace
    expect(refreshed!.reservedAt.getTime()).toBeGreaterThanOrEqual(
      b.reservedAt.getTime(),
    );
  });

  it("rejects when caller is not the owner", async () => {
    await makeUser(ALICE);
    await makeUser(BOB);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    await expect(
      reservationService.cancel({ reservationId: r.id, callerId: BOB }),
    ).rejects.toThrow(/not the owner|forbidden/i);
  });

  it("rejects already terminal rows", async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    await reservationService.cancel({ reservationId: r.id, callerId: ALICE });
    await expect(
      reservationService.cancel({ reservationId: r.id, callerId: ALICE }),
    ).rejects.toThrow(/terminal|already/i);
  });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
npm --workspace backend test
```

Expected: 4 new tests fail with "cancel is not a function".

- [ ] **Step 3: Add `cancel` and a private `promoteQueueIfNeeded`**

```ts
// in reservation-service.ts, add:
import { forbidden, notFound } from '../lib/errors.js';

// extend the reservationService object with these two methods:
async cancel(input: { reservationId: bigint | number; callerId: string }) {
  const id = typeof input.reservationId === 'bigint' ? input.reservationId : BigInt(input.reservationId);
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
```

And add the helper near the top of the file:

```ts
import type { Prisma } from "@prisma/client";

async function promoteQueueIfNeeded(
  tx: Prisma.TransactionClient,
  stationId: number,
) {
  const next = await tx.reservation.findFirst({
    where: { stationId, status: "reserved", queuePosition: 2 },
  });
  if (!next) return;
  await tx.reservation.update({
    where: { id: next.id },
    data: { queuePosition: 1, reservedAt: new Date(), status: "reserved" },
  });
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm --workspace backend test
```

Expected: 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/reservation-service.ts backend/src/services/reservation-service.test.ts
git commit -m "feat(backend): reservation cancel with queue promotion"
```

---

### Task 24: TDD — `finishReservation`

**Files:**

- Modify: `/Users/mbp16tb/Licenta/backend/src/services/reservation-service.ts`
- Modify: `/Users/mbp16tb/Licenta/backend/src/services/reservation-service.test.ts`

- [ ] **Step 1: Add tests**

```ts
describe("reservationService.finish", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("rejects finishing a row that is not in `charging`", async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    await expect(
      reservationService.finish({ reservationId: r.id, callerId: ALICE }),
    ).rejects.toThrow(/charging/i);
  });

  it("marks completed and promotes queue", async () => {
    await makeUser(ALICE);
    await makeUser(BOB);
    const st = await makeStation();
    const a = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    const b = await reservationService.create({
      stationId: st.id,
      userId: BOB,
      batteryLevelStart: 30,
    });
    // Force `a` into charging directly (timer would normally do this)
    await prisma.reservation.update({
      where: { id: a.id },
      data: { status: "charging", chargingStartedAt: new Date() },
    });

    await reservationService.finish({ reservationId: a.id, callerId: ALICE });
    const after = await prisma.reservation.findUnique({ where: { id: a.id } });
    expect(after?.status).toBe("completed");
    expect(after?.chargingEndedAt).not.toBeNull();

    const promoted = await prisma.reservation.findUnique({
      where: { id: b.id },
    });
    expect(promoted?.queuePosition).toBe(1);
  });

  it("rejects when caller is not owner", async () => {
    await makeUser(ALICE);
    await makeUser(BOB);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    await prisma.reservation.update({
      where: { id: r.id },
      data: { status: "charging" },
    });
    await expect(
      reservationService.finish({ reservationId: r.id, callerId: BOB }),
    ).rejects.toThrow(/owner|forbidden/i);
  });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
npm --workspace backend test
```

Expected: 3 new tests fail.

- [ ] **Step 3: Add `finish` to the service**

```ts
async finish(input: { reservationId: bigint | number; callerId: string }) {
  const id = typeof input.reservationId === 'bigint' ? input.reservationId : BigInt(input.reservationId);
  return prisma.$transaction(async (tx) => {
    const r = await tx.reservation.findUnique({ where: { id } });
    if (!r) throw notFound('Reservation not found');
    if (r.userId !== input.callerId) throw forbidden('Not the owner');
    if (r.status !== 'charging') throw badRequest('Reservation is not in charging state');

    const updated = await tx.reservation.update({
      where: { id },
      data: { status: 'completed', chargingEndedAt: new Date() },
    });
    await promoteQueueIfNeeded(tx, r.stationId);
    return updated;
  });
},
```

- [ ] **Step 4: Run, verify pass**

```bash
npm --workspace backend test
```

Expected: 12 tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/
git commit -m "feat(backend): reservation finish with queue promotion"
```

---

### Task 25: Reservation routes

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/src/routes/reservations.ts`
- Modify: `/Users/mbp16tb/Licenta/backend/src/server.ts`

- [ ] **Step 1: Write router**

```ts
// backend/src/routes/reservations.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { reservationService } from "../services/reservation-service.js";

export const reservationsRouter = Router();

const CreateBody = z.object({
  stationId: z.number().int().positive(),
  batteryLevelStart: z.number().int().min(0).max(99),
});

reservationsRouter.post("/", requireAuth, async (req, res, next) => {
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

reservationsRouter.post("/:id/cancel", requireAuth, async (req, res, next) => {
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

reservationsRouter.post("/:id/finish", requireAuth, async (req, res, next) => {
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

reservationsRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const list = await prisma.reservation.findMany({
      where: { userId: req.user!.id },
      orderBy: { reservedAt: "desc" },
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
    reservedAt:
      r.reservedAt instanceof Date ? r.reservedAt.toISOString() : r.reservedAt,
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
```

- [ ] **Step 2: Mount in `server.ts`**

```ts
import { reservationsRouter } from "./routes/reservations.js";
app.use("/api/reservations", reservationsRouter);
```

- [ ] **Step 3: Smoke test (with JWT)**

```bash
curl -X POST -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"stationId": 1, "batteryLevelStart": 20}' \
  http://localhost:4000/api/reservations
```

(Skip if no station yet — coming in next phase. Test will be exercised end-to-end after admin route exists.)

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/reservations.ts backend/src/server.ts
git commit -m "feat(backend): add reservation routes (create/cancel/finish/me)"
```

---

## Phase G — Admin Routes

### Task 26: Admin stations CRUD

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/src/routes/admin/stations.ts`
- Create: `/Users/mbp16tb/Licenta/backend/src/routes/admin/index.ts`
- Modify: `/Users/mbp16tb/Licenta/backend/src/server.ts`

- [ ] **Step 1: Write `admin/stations.ts`**

```ts
// backend/src/routes/admin/stations.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { conflict, notFound } from "../../lib/errors.js";

export const adminStationsRouter = Router();

const StationBody = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1).max(255),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  powerKw: z.number().positive(),
});

adminStationsRouter.post("/", async (req, res, next) => {
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

adminStationsRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = StationBody.partial().parse(req.body);
    const s = await prisma.station.update({ where: { id }, data: body });
    res.json(serialize(s));
  } catch (e) {
    next(e);
  }
});

adminStationsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const active = await prisma.reservation.count({
      where: { stationId: id, status: { in: ["reserved", "charging"] } },
    });
    if (active > 0) throw conflict("Station has active reservations");
    const exists = await prisma.station.findUnique({ where: { id } });
    if (!exists) throw notFound("Station not found");
    await prisma.station.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

function serialize(s: any) {
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    latitude: s.latitude,
    longitude: s.longitude,
    powerKw: Number(s.powerKw),
    createdBy: s.createdBy,
    createdAt:
      s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
  };
}
```

- [ ] **Step 2: Write admin index (mount + middleware)**

```ts
// backend/src/routes/admin/index.ts
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import { adminStationsRouter } from "./stations.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);
adminRouter.use("/stations", adminStationsRouter);
```

- [ ] **Step 3: Mount in `server.ts`**

```ts
import { adminRouter } from "./routes/admin/index.js";
app.use("/api/admin", adminRouter);
```

- [ ] **Step 4: Smoke test**

```bash
# As admin (after promoting your user via SQL):
curl -X POST -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"name":"S1","address":"Oradea","latitude":47.07,"longitude":21.92,"powerKw":50}' \
  http://localhost:4000/api/admin/stations
```

Expected: 201 with the station JSON.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/admin/ backend/src/server.ts
git commit -m "feat(backend): admin stations CRUD"
```

---

### Task 27: Admin users + reservations listings

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/src/routes/admin/users.ts`
- Create: `/Users/mbp16tb/Licenta/backend/src/routes/admin/reservations.ts`
- Modify: `/Users/mbp16tb/Licenta/backend/src/routes/admin/index.ts`

- [ ] **Step 1: Write `users.ts`**

```ts
// backend/src/routes/admin/users.ts
import { Router } from "express";
import { prisma } from "../../lib/prisma.js";

export const adminUsersRouter = Router();

adminUsersRouter.get("/", async (_req, res, next) => {
  try {
    const users = await prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      include: { carModel: true },
    });
    res.json(
      users.map((u) => ({
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
      })),
    );
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 2: Write `reservations.ts`**

```ts
// backend/src/routes/admin/reservations.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

export const adminReservationsRouter = Router();

const Query = z.object({
  status: z.enum(["reserved", "charging", "completed", "cancelled"]).optional(),
});

adminReservationsRouter.get("/", async (req, res, next) => {
  try {
    const q = Query.parse(req.query);
    const list = await prisma.reservation.findMany({
      where: q.status ? { status: q.status } : undefined,
      orderBy: { reservedAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        station: { select: { id: true, name: true } },
      },
    });
    res.json(
      list.map((r) => ({
        id: Number(r.id),
        status: r.status,
        queuePosition: r.queuePosition,
        batteryLevelStart: r.batteryLevelStart,
        reservedAt: r.reservedAt.toISOString(),
        chargingStartedAt: r.chargingStartedAt?.toISOString() ?? null,
        chargingEndedAt: r.chargingEndedAt?.toISOString() ?? null,
        user: r.user,
        station: r.station,
      })),
    );
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 3: Mount in `admin/index.ts`**

```ts
import { adminUsersRouter } from "./users.js";
import { adminReservationsRouter } from "./reservations.js";
adminRouter.use("/users", adminUsersRouter);
adminRouter.use("/reservations", adminReservationsRouter);
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/admin/
git commit -m "feat(backend): admin users and reservations listings"
```

---

## Phase H — Grace Timer Job

### Task 28: TDD — `chargingTimer.tick`

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/src/services/charging-timer.ts`
- Create: `/Users/mbp16tb/Licenta/backend/src/services/charging-timer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// backend/src/services/charging-timer.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../lib/prisma.js";
import { chargingTimer } from "./charging-timer.js";
import { resetDb, makeUser, makeStation } from "../test/db.js";
import { reservationService } from "./reservation-service.js";

const ALICE = "00000000-0000-0000-0000-00000000A11C";

describe("chargingTimer.tick", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("does not promote a reservation younger than 15s", async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 20,
    });
    await chargingTimer.tick();
    const after = await prisma.reservation.findUnique({ where: { id: r.id } });
    expect(after?.status).toBe("reserved");
  });

  it("promotes a reservation older than 15s to charging", async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 20,
    });
    // Backdate
    await prisma.reservation.update({
      where: { id: r.id },
      data: { reservedAt: new Date(Date.now() - 16_000) },
    });
    const promotedIds = await chargingTimer.tick();
    expect(promotedIds.map(String)).toContain(String(r.id));
    const after = await prisma.reservation.findUnique({ where: { id: r.id } });
    expect(after?.status).toBe("charging");
    expect(after?.chargingStartedAt).not.toBeNull();
  });

  it("is idempotent (already-charging rows are not modified)", async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 20,
    });
    await prisma.reservation.update({
      where: { id: r.id },
      data: { reservedAt: new Date(Date.now() - 30_000) },
    });
    await chargingTimer.tick();
    const beforeStartedAt = (await prisma.reservation.findUnique({
      where: { id: r.id },
    }))!.chargingStartedAt!;
    const promoted = await chargingTimer.tick();
    expect(promoted).toEqual([]);
    const afterStartedAt = (await prisma.reservation.findUnique({
      where: { id: r.id },
    }))!.chargingStartedAt!;
    expect(afterStartedAt.getTime()).toBe(beforeStartedAt.getTime());
  });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
npm --workspace backend test
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement timer**

```ts
// backend/src/services/charging-timer.ts
import { prisma } from "../lib/prisma.js";

export const chargingTimer = {
  async tick(): Promise<bigint[]> {
    const result = await prisma.$queryRaw<Array<{ id: bigint }>>`
      UPDATE reservations
         SET status = 'charging',
             charging_started_at = now()
       WHERE status = 'reserved'
         AND queue_position = 1
         AND reserved_at + interval '15 seconds' <= now()
       RETURNING id
    `;
    return result.map((r) => r.id);
  },

  start(intervalMs = 1000) {
    const handle = setInterval(() => {
      this.tick().catch((err) => {
        console.error("chargingTimer tick failed", err);
      });
    }, intervalMs);
    return () => clearInterval(handle);
  },
};
```

- [ ] **Step 4: Run, verify pass**

```bash
npm --workspace backend test
```

Expected: 15 tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/charging-timer.ts backend/src/services/charging-timer.test.ts
git commit -m "feat(backend): grace-period timer with idempotent tick"
```

---

### Task 29: Wire timer into server boot

**Files:**

- Modify: `/Users/mbp16tb/Licenta/backend/src/index.ts`

- [ ] **Step 1: Update `index.ts`**

```ts
// backend/src/index.ts
import { buildApp } from "./server.js";
import { env } from "./config/env.js";
import { chargingTimer } from "./services/charging-timer.js";

const app = buildApp();
const stopTimer = chargingTimer.start(1000);

const server = app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
  console.log(
    `Charging timer running (1Hz, TIME_SCALE_FACTOR=${env.TIME_SCALE_FACTOR})`,
  );
});

function shutdown() {
  console.log("Shutting down…");
  stopTimer();
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
```

- [ ] **Step 2: Boot, observe logs**

```bash
npm --workspace backend run dev
```

Expected: both lines printed. Server stays up. Ctrl+C cleanly exits with "Shutting down…".

- [ ] **Step 3: Commit**

```bash
git add backend/src/index.ts
git commit -m "feat(backend): start grace timer on server boot with graceful shutdown"
```

---

## Phase I — Wrap-Up

### Task 30: Vitest config + run all tests

**Files:**

- Create: `/Users/mbp16tb/Licenta/backend/vitest.config.ts`
- Create: `/Users/mbp16tb/Licenta/shared/vitest.config.ts`

- [ ] **Step 1: Write `backend/vitest.config.ts`**

```ts
// backend/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    sequence: { concurrent: false }, // tests share a DB
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 15000,
  },
});
```

- [ ] **Step 2: Write `shared/vitest.config.ts`**

```ts
// shared/vitest.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node" } });
```

- [ ] **Step 3: Run all tests from root**

```bash
cd /Users/mbp16tb/Licenta && npm test
```

Expected: shared (8) + backend (15) all pass.

- [ ] **Step 4: Commit**

```bash
git add backend/vitest.config.ts shared/vitest.config.ts
git commit -m "test: add vitest configs for shared and backend"
```

---

### Task 31: README

**Files:**

- Create: `/Users/mbp16tb/Licenta/README.md`

- [ ] **Step 1: Write README**

````md
# Charging Station

Bachelor thesis project: web app for managing electric vehicle charging stations in Oradea, Romania.

- **Frontend:** React + TypeScript + Vite + Leaflet (added in Phase 2)
- **Backend:** Node.js + TypeScript + Express + Prisma
- **DB / Auth / Realtime:** Supabase (Postgres)

## Local development (Phase 1: backend only)

### Prerequisites

- Node.js ≥ 20, npm ≥ 10
- A Supabase project (free tier) — https://supabase.com
- A second Supabase project for tests (recommended)

### Setup

1. `cp .env.example .env` and fill in values from the Supabase dashboard:
   - Project Settings → API: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
   - Settings → Database → Connection string: `DATABASE_URL`
2. `cp .env.example .env.test` and fill in the corresponding values for your test project.
3. `npm install`
4. `npm --workspace backend run prisma:migrate`
5. `npm --workspace backend run seed`
6. Apply migrations to the test DB too:
   ```bash
   DOTENV_CONFIG_PATH=.env.test npx --workspace backend prisma migrate deploy
   ```
7. Promote yourself to admin (after registering through the eventual frontend, or via Supabase Auth REST):
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'you@example.com';
   ```

### Run

```bash
npm --workspace backend run dev   # http://localhost:4000
```

### Tests

```bash
npm test
```

## Documentation

- Spec: `docs/superpowers/specs/2026-05-03-charging-station-design.md`
- Phase 1 plan: `docs/superpowers/plans/2026-05-03-charging-station-phase-1-foundation-backend.md`
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with local dev setup"
```

---

### Task 32: Final smoke test

This is a manual end-to-end exercise of the backend.

- [ ] **Step 1: Boot backend**

```bash
npm --workspace backend run dev
```

- [ ] **Step 2: Register a Supabase user**

In Supabase dashboard → Authentication → Users → "Invite user" or use the SQL/REST. Note the user's UUID.

- [ ] **Step 3: Get a JWT for that user**

Use Supabase Auth API with email+password (or magic link → exchange). Store in shell var `JWT`.

- [ ] **Step 4: Sequence**

```bash
# Profile should exist (created by trigger)
curl -s -H "Authorization: Bearer $JWT" http://localhost:4000/api/profile | jq

# Update car model
curl -s -X PATCH -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"fullName":"Demo User","carModelId":1}' http://localhost:4000/api/profile | jq

# (Promote yourself to admin via SQL in Supabase, then re-fetch JWT.)

# Create a station
curl -s -X POST -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"name":"Lotus Center","address":"Strada Nufărului","latitude":47.058,"longitude":21.939,"powerKw":50}' \
  http://localhost:4000/api/admin/stations | jq

# List stations
curl -s http://localhost:4000/api/stations | jq

# Reserve (as a non-admin user — repeat steps 2-3 for a second account, or temporarily switch role to user)
curl -s -X POST -H "Authorization: Bearer $JWT2" -H "Content-Type: application/json" \
  -d '{"stationId":1,"batteryLevelStart":20}' http://localhost:4000/api/reservations | jq

# Wait ~16s, then verify status flipped to charging
sleep 16
curl -s http://localhost:4000/api/stations/1 | jq

# Finish charging
curl -s -X POST -H "Authorization: Bearer $JWT2" \
  http://localhost:4000/api/reservations/1/finish | jq
```

Expected: all calls return 200/201 with sensible JSON. After 16s the reservation status is `charging`. After `finish` the status is `completed`.

- [ ] **Step 5: Tag**

```bash
git tag -a v0.1.0-backend -m "Phase 1 complete: foundation + tested backend"
```

- [ ] **Step 6: Push to GitHub**

If the user has not yet created a GitHub remote, prompt them to:

1. Create a private repository on GitHub (`charging-station` or similar).
2. Add it: `git remote add origin git@github.com:<user>/<repo>.git`.
3. Push: `git push -u origin main && git push --tags`.

---

## Phase 1 done — what's next

This plan delivers a tested backend. Phase 2 will cover:

- Vite + React frontend scaffold (`frontend/` workspace fully wired up).
- Auth pages (register with car-model picker, login).
- Public map page (react-leaflet, Oradea center, station markers driven by realtime).
- Reservation dialog + dashboard.
- Admin pages (map-based station CRUD, users + reservations tables).
- Realtime hookup via `@supabase/supabase-js` channels.
- E2E smoke test instructions.

Phase 2 plan to be written after Phase 1 is executed and reviewed.

---

## Self-review checklist (consumed during plan authoring)

- [x] Spec §4 stack reflected in tasks 1, 5, 8, 9
- [x] Spec §5 repo structure produced by tasks 1, 4, 5, 8 (frontend/ stub only)
- [x] Spec §6 data model produced by tasks 9–11
- [x] Spec §7 API surface produced by tasks 19–21, 25–27
- [x] Spec §8 charging math produced by task 7 (tested)
- [x] Spec §9 state machine enforced by tasks 22–24 (tested)
- [x] Spec §10 grace timer produced by tasks 28–29 (tested)
- [x] Spec §11 realtime — backend writes propagate via Supabase Realtime; frontend subscribe is Phase 2
- [x] Spec §14 auth flow produced by tasks 11 (trigger), 15 (middleware)
- [x] Spec §15 env config produced by task 13
- [x] Spec §16 testing produced by tasks 7, 22–24, 28
- [x] Spec §17 local dev produced by tasks 31
- [x] Spec §18 git workflow respected (Conventional Commits throughout)
- [x] Spec §19 risks: timer idempotency exercised in task 28
