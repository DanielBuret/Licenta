# Charging Station — Design Document

**Author:** Danila Buret
**Date:** 2026-05-03
**Status:** Draft (pending review)

## 1. Overview

A web application for managing electric vehicle charging stations in Oradea, Romania. End users register, view stations on an interactive map, and reserve free or queued stations. Administrators manage stations through a privileged map-based interface. The application simulates the full charging lifecycle (reserve → grace period → charging → finish) with real-time UI updates.

Primary purpose: thesis demonstration of full-stack TypeScript skills, real-time data synchronization, and clean architectural separation.

## 2. Goals

- Map-driven UX with three clearly distinguishable station states (free / reserved / charging).
- Realistic charging-time calculation derived from car battery capacity, station power, and current charge level.
- Reservation queue with capacity 2 (one active charging + one waiting).
- Real-time UI updates on station and reservation changes (no polling).
- Admin panel for CRUD on stations using interactive map (click-to-place + address geocoding).
- Defensible architecture for thesis defence: separate frontend / backend / shared types, typed end-to-end.

## 3. Non-Goals (YAGNI)

- Real payment integration.
- Native mobile app.
- Multi-city support (Oradea only).
- Multi-language UI (Romanian only).
- Real EV hardware integration.
- Production-grade observability (logging, tracing, dashboards).
- Email confirmations / SMS notifications.
- Password reset and email verification flows beyond Supabase defaults.

## 4. Tech Stack

| Layer                | Choice                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Frontend             | React 18, TypeScript, Vite, styled-components, react-leaflet, react-router 6, react-hook-form, zod, @tanstack/react-query, axios |
| Backend              | Node.js 20, TypeScript, Express 4, Prisma 5, zod, jsonwebtoken                                                                   |
| DB / Auth / Realtime | Supabase (Postgres + Auth + Realtime channels)                                                                                   |
| Map tiles            | OpenStreetMap (via Leaflet)                                                                                                      |
| Geocoding            | Nominatim (OpenStreetMap, free)                                                                                                  |
| Tests                | Vitest (frontend, backend, shared)                                                                                               |
| Linting              | ESLint + Prettier                                                                                                                |

Rationale highlights:

- Supabase bundles the three external services we need (DB, auth, realtime) on a single free tier and supplies a JS SDK with typed client, removing the need to write WebSocket plumbing.
- A separate Express backend (rather than serverless functions or BaaS-only) is required by the thesis brief and allows business logic — queue promotion, grace timer, validation — to live server-side under real-world load patterns.
- Prisma over raw SQL for type-safe queries and easy migrations; Postgres-only features (enums, partial unique indexes) are still accessible via raw SQL when needed.

## 5. Repository Structure (npm workspaces)

```
Licenta/
├── .git/
├── .gitignore                 # node_modules, .env, dist, .superpowers, .DS_Store
├── .env.example               # all required env keys, no secrets
├── README.md                  # local dev instructions
├── package.json               # workspaces: shared, frontend, backend
├── tsconfig.base.json         # shared compiler options
├── docs/
│   └── superpowers/specs/2026-05-03-charging-station-design.md
├── shared/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── types/             # Station, Reservation, Profile, CarModel, enums
│       └── charging.ts        # estimateChargingSeconds (used both sides)
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── lib/
│       │   ├── supabase.ts    # client SDK init
│       │   └── api.ts         # axios instance with auth interceptor
│       ├── hooks/             # useStations, useMyReservations, useRealtime
│       ├── components/
│       │   ├── Map/
│       │   ├── StationPopup/
│       │   ├── ReservationDialog/
│       │   └── Layout/
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── DashboardPage.tsx
│       │   └── admin/
│       │       ├── AdminLayout.tsx
│       │       ├── StationsAdminPage.tsx
│       │       └── UsersAdminPage.tsx
│       ├── routes/            # router config + ProtectedRoute, AdminRoute
│       └── styles/            # theme, GlobalStyle
└── backend/
    ├── package.json
    ├── tsconfig.json
    ├── prisma/
    │   ├── schema.prisma
    │   ├── migrations/
    │   └── seed.ts
    └── src/
        ├── index.ts           # entrypoint
        ├── server.ts          # express app setup
        ├── config/env.ts      # zod-validated env
        ├── lib/
        │   └── supabase-admin.ts   # service-role client (server only)
        ├── middleware/
        │   ├── auth.ts        # verify JWT, attach user
        │   ├── admin.ts       # require role='admin'
        │   └── error.ts
        ├── services/
        │   ├── reservation-service.ts
        │   ├── charging-timer.ts    # 1Hz job, promotes grace → charging
        │   └── station-service.ts
        └── routes/
            ├── stations.ts
            ├── reservations.ts
            ├── profile.ts
            ├── car-models.ts
            └── admin.ts
```

## 6. Data Model

All tables live in the Supabase Postgres `public` schema except `auth.users` (managed by Supabase Auth).

### 6.1 `profiles` (extends `auth.users`)

```sql
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  full_name       TEXT NOT NULL,
  car_model_id    INT REFERENCES car_models(id),
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

A trigger on `auth.users` insert creates a matching `profiles` row with `role='user'`. Admin promotion is performed manually via SQL.

### 6.2 `car_models`

```sql
CREATE TABLE car_models (
  id                     SERIAL PRIMARY KEY,
  brand                  TEXT NOT NULL,
  model                  TEXT NOT NULL,
  battery_capacity_kwh   NUMERIC(5,1) NOT NULL CHECK (battery_capacity_kwh > 0),
  UNIQUE (brand, model)
);
```

Seed list (12 models): Tesla Model 3 / Model Y / Model S, VW ID.3 / ID.4, Renault Zoe, Nissan Leaf, BMW i3 / i4, Hyundai Kona Electric, Kia EV6, Audi e-tron.

### 6.3 `stations`

```sql
CREATE TABLE stations (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  address      TEXT NOT NULL,
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  power_kw     NUMERIC(5,1) NOT NULL CHECK (power_kw > 0),
  created_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6.4 `reservations`

```sql
CREATE TYPE reservation_status AS ENUM ('reserved','charging','completed','cancelled');

CREATE TABLE reservations (
  id                    BIGSERIAL PRIMARY KEY,
  station_id            INT NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  battery_level_start   INT NOT NULL CHECK (battery_level_start BETWEEN 0 AND 99),
  status                reservation_status NOT NULL DEFAULT 'reserved',
  queue_position        SMALLINT NOT NULL CHECK (queue_position IN (1,2)),
  reserved_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  charging_started_at   TIMESTAMPTZ,
  charging_ended_at     TIMESTAMPTZ
);

-- One active reservation per (station, queue_position)
CREATE UNIQUE INDEX one_active_per_position
  ON reservations(station_id, queue_position)
  WHERE status IN ('reserved','charging');

-- Helpful indexes
CREATE INDEX idx_reservations_user        ON reservations(user_id);
CREATE INDEX idx_reservations_station_active
  ON reservations(station_id) WHERE status IN ('reserved','charging');
```

### 6.5 Row Level Security (RLS)

The frontend reads via the anon key + Supabase Realtime; writes go through the backend using the service role key.

- `profiles`: SELECT own row only; no INSERT/UPDATE/DELETE from anon.
- `car_models`: SELECT all; no writes.
- `stations`: SELECT all; no writes.
- `reservations`: SELECT all (so the queue is visible to everyone); no writes.

All mutations happen via the backend, which uses the service role key and bypasses RLS.

## 7. API Surface (Express)

All routes are under `/api`. Authenticated routes require `Authorization: Bearer <jwt>` issued by Supabase Auth.

### 7.1 User routes

| Method | Path                           | Purpose                                                                            |
| ------ | ------------------------------ | ---------------------------------------------------------------------------------- |
| GET    | `/api/car-models`              | List seed cars (used in register form)                                             |
| GET    | `/api/profile`                 | Current user's profile + car model                                                 |
| PATCH  | `/api/profile`                 | Update `full_name`, `car_model_id`                                                 |
| GET    | `/api/stations`                | All stations + active reservation summary                                          |
| GET    | `/api/stations/:id`            | Station detail with active queue (with user names)                                 |
| POST   | `/api/reservations`            | Body: `{station_id, battery_level_start}`                                          |
| POST   | `/api/reservations/:id/cancel` | Cancel own reservation; promote queue if needed                                    |
| POST   | `/api/reservations/:id/finish` | Finish active charging (only owner, only when `charging`); promote queue if needed |
| GET    | `/api/reservations/me`         | Current user's reservation history                                                 |

### 7.2 Admin routes (require `role='admin'`)

| Method | Path                      | Purpose                                         |
| ------ | ------------------------- | ----------------------------------------------- |
| POST   | `/api/admin/stations`     | Create station                                  |
| PATCH  | `/api/admin/stations/:id` | Update station                                  |
| DELETE | `/api/admin/stations/:id` | Delete (rejected if active reservations exist)  |
| GET    | `/api/admin/users`        | List users with profile + car                   |
| GET    | `/api/admin/reservations` | All reservations (filter by status, date range) |

All inputs are validated server-side with `zod`. Errors return `{error: {code, message, details?}}` with appropriate status codes.

## 8. Charging Time Calculation

Lives in `shared/charging.ts` so frontend and backend agree:

```ts
export function estimateChargingSeconds(
  batteryCapacityKwh: number,
  batteryStartPercent: number, // 0..99
  stationPowerKw: number,
  timeScaleFactor: number, // configurable; demo default 60
): number {
  const energyKwh = (batteryCapacityKwh * (100 - batteryStartPercent)) / 100;
  const realSeconds = (energyKwh / stationPowerKw) * 3600;
  return realSeconds / timeScaleFactor;
}
```

The factor `TIME_SCALE_FACTOR` is exposed as an env var read by both sides (`VITE_TIME_SCALE_FACTOR`, `TIME_SCALE_FACTOR`). For the thesis defence we use 60 (one real hour ≈ one demo minute). Setting it to 1 yields physically realistic durations.

## 9. Reservation State Machine

```
                ┌─────────────────────────────────────────┐
                │                                         │
                ▼                                         │
   POST /reservations  ──▶  reserved (qp=1 or qp=2)       │
                                │                         │
                                │ 15s grace timer         │ POST /cancel
                                ▼                         │ (by owner)
                            charging  ─────▶  cancelled  ─┤
                                │                         │
                       POST /finish (by owner)             │
                                │                         │
                                ▼                         │
                            completed  ◀─────────────────┘
```

Rules:

- A new reservation is allowed only if the station has fewer than 2 active rows (`status IN ('reserved','charging')`). New row gets `queue_position = 1` if no active row exists, otherwise `2`.
- A user cannot have a second active reservation at the same station.
- A user cannot have more than 1 simultaneous active reservation across the whole system (simplifying assumption).
- The 15s grace timer is enforced server-side by a 1Hz job (see §10). Only after the grace window does `status` change from `reserved` to `charging`.
- `POST /finish` is allowed only when `status='charging'` and `user_id` matches the caller.
- `POST /cancel` is allowed when `status IN ('reserved','charging')` and `user_id` matches the caller.
- On finish or cancel of the qp=1 row: if a qp=2 row exists, it is promoted (`queue_position=1`, `status='reserved'`, `reserved_at = now()`), and a fresh 15s grace begins for that user.
- Promotion happens atomically inside a single Postgres transaction.
- `completed` and `cancelled` are terminal: no further transitions are valid from those states.

## 10. Backend Charging Timer Job

A single in-process `setInterval` running at 1 Hz queries:

```sql
UPDATE reservations
   SET status = 'charging',
       charging_started_at = now()
 WHERE status = 'reserved'
   AND reserved_at + interval '15 seconds' <= now()
RETURNING id;
```

Because the transition is idempotent (already-`charging` rows are excluded by the WHERE clause), a brief restart does not corrupt state. If the backend restarts mid-grace, the reservation simply transitions on the next tick after recovery.

The decision to keep this in-process (rather than persistent queue or pg_cron) is justified by the thesis-demo scope: simplicity over fault tolerance.

## 11. Real-time UI Updates

Frontend subscribes to two Supabase Realtime channels:

- `public:stations` — INSERT/UPDATE/DELETE events refresh the markers list.
- `public:reservations` — INSERT/UPDATE events trigger React Query invalidation for the affected `station_id`, which re-renders the marker icon and any open popup.

The frontend never polls. The backend's 1Hz timer is the only periodic process; its DB writes propagate to clients via Supabase Realtime automatically.

## 12. Frontend State & Routing

- **Server state:** `@tanstack/react-query` (queries: stations, station detail, my reservations, car models).
- **Auth state:** `useAuth` hook backed by `supabase.auth.getSession()` + `onAuthStateChange`.
- **Forms:** `react-hook-form` + `zod` for validation (login, register, reservation, station creation).
- **Routes:**

```
/                    HomePage (map, public, but reservation requires auth)
/login               LoginPage (redirect to / on success)
/register            RegisterPage (email, password, full_name, car_model)
/dashboard           DashboardPage (my reservations, profile)
/admin               AdminLayout (guarded: role='admin')
  /admin/stations    map-based CRUD
  /admin/users       table view
```

## 13. Map UX

### 13.1 User-facing map

- Centered on Oradea (47.0722, 21.9211), zoom 13.
- Markers are SVG icons, color-coded by the highest-priority active row at the station:
  - 🔴 Red — at least one row has `status='charging'` (covers both "just charging" and "charging + queued").
  - 🟡 Amber — no `charging` row exists, but at least one `status='reserved'` row exists.
  - 🟢 Green — no active rows at all.
- A small numeric badge shows total active reservations (1 or 2). Hidden when 0.
- Click → popup with name, address, power, current activity, and a `Rezervă` button (or `Stația plină`).
- Popup auto-refreshes via realtime subscription while open.

### 13.2 Admin map

- Same base map with the same markers.
- Click on empty area → opens "Adaugă stație" modal pre-filled with reverse-geocoded address.
- Existing markers gain a context menu: edit, delete (delete blocked if active reservations exist).
- Address-first flow: user types address, presses "Caută" → forward geocode via Nominatim → recenters map and pre-fills coords.

## 14. Auth Flow

1. Register: frontend calls `supabase.auth.signUp({email, password})`. On success, frontend calls `POST /api/profile` with `{full_name, car_model_id}` to populate the row that the trigger created with defaults.
2. Login: `supabase.auth.signInWithPassword`. JWT is stored by the SDK in `localStorage`.
3. Frontend axios instance attaches `Authorization: Bearer ${session.access_token}` on every request.
4. Backend middleware verifies the JWT against the Supabase JWT secret (loaded from env), extracts `sub` (user id), looks up the profile row to get `role`, attaches `req.user`.
5. Admin-only routes require `req.user.role === 'admin'`.

## 15. Environment Configuration

`.env.example`:

```
# Supabase (both shared)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # backend only
SUPABASE_JWT_SECRET=        # backend only

# Database (backend)
DATABASE_URL=               # Postgres connection string from Supabase

# App
TIME_SCALE_FACTOR=60        # backend
PORT=4000                   # backend

# Frontend (Vite)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:4000
VITE_TIME_SCALE_FACTOR=60
```

Frontend env vars must be prefixed `VITE_`; backend env vars are validated with `zod` at startup and the process exits on missing keys.

## 16. Testing Strategy

Focused on regions where bugs are silent and dangerous:

- `shared/charging.test.ts` — `estimateChargingSeconds` across full / partial / edge inputs.
- `backend/services/reservation-service.test.ts` —
  - Reservation creation when station is empty / has qp=1 / has qp=1 and qp=2.
  - Cancel of qp=1 with qp=2 waiting promotes qp=2.
  - Cancel of qp=1 alone leaves the station free.
  - Finish promotes queue identically.
  - Cannot reserve a station where you already hold an active reservation.
  - Cannot finish a reservation that is not yours.
- `backend/services/charging-timer.test.ts` — promotion from `reserved` to `charging` only after 15s.

Manual end-to-end walkthrough is documented in `README.md`.

CI is deferred (no GitHub Actions workflow at MVP; can be added later).

## 17. Local Development Setup

1. Install Node.js ≥ 20 and `npm` ≥ 10.
2. Create a Supabase project (free tier) at supabase.com.
3. From Supabase dashboard, copy: project URL, anon key, service role key, JWT secret, DB connection string.
4. Clone the repo: `git clone <url> Licenta && cd Licenta`.
5. Copy env: `cp .env.example .env` and fill values.
6. Install: `npm install` (root, installs all workspaces).
7. Apply migrations: `npm --workspace backend run prisma:migrate`.
8. Seed DB (car models): `npm --workspace backend run seed`.
9. Promote your first user to admin: register via the UI, then in Supabase SQL editor run `UPDATE profiles SET role='admin' WHERE email='you@example.com';`.
10. Run dev: `npm run dev` (concurrently starts frontend on `:5173` and backend on `:4000`).
11. Open `http://localhost:5173`.

## 18. Git Workflow

- Repository hosted on GitHub (private initially, public before defence).
- Default branch: `main`. Feature branches use `feature/<short-name>`.
- Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).
- `.gitignore` excludes `node_modules`, `dist`, `.env`, `.env.local`, `.DS_Store`, and `.superpowers/`.
- The design doc and the implementation plan are committed under `docs/`.

## 19. Risks & Open Questions

- The in-process 15s timer is lost across restarts. Mitigation: the SQL query in §10 is idempotent and self-recovering.
- Nominatim has a low rate limit (1 req/s) and requires a `User-Agent` header; we will respect both. For thesis demo this is sufficient.
- Supabase free tier pauses the project after 7 days of inactivity; demo days require unpause via dashboard.
- RLS misconfiguration could either over-expose data or break the realtime feed; policies will be tested explicitly during implementation.

## 20. Out of Scope for This Spec

The implementation plan (file-by-file build order, commit boundaries, verification steps) is produced separately by the `writing-plans` skill once this spec is approved.
