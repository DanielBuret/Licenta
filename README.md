# Licenta — EV Charging Station Manager

A web application for managing electric vehicle charging stations in **Oradea, Romania**. Built as a bachelor's thesis project demonstrating full-stack TypeScript, real-time data sync, and clean architectural separation.

## What it does

End users register, view charging stations on an interactive map, and reserve free or queued stations. Administrators manage stations through a privileged map-based interface. The app simulates the full charging lifecycle (reserve → 15s grace → charging → finish) with real-time UI updates — no polling.

## Highlights

- **Map-driven UX** — three station states (free / reserved / charging) rendered as color-coded markers on Leaflet + OpenStreetMap.
- **Reservation queue** — capacity 2 per station (one active charging + one waiting). Atomic queue promotion on cancel/finish.
- **Realistic charging time** — derived from car battery capacity, station power, and current charge level. Configurable time-scale factor for demo vs. real-time.
- **Real-time sync** — Supabase Realtime channels push station and reservation updates to all connected clients.
- **Admin panel** — click-to-place stations on the map, with Nominatim address geocoding.
- **Type-safe end-to-end** — shared TypeScript types between frontend, backend, and database.

## Tech stack

| Layer            | Choice                                                        |
| ---------------- | ------------------------------------------------------------- |
| Frontend         | React 18, Vite, styled-components, react-leaflet, react-query |
| Backend          | Node.js 20, Express 4, Prisma 5, zod                          |
| DB / Auth / RT   | Supabase (Postgres + Auth + Realtime)                         |
| Maps / Geocoding | OpenStreetMap (Leaflet) + Nominatim                           |
| Tests            | Vitest                                                        |

Workspace layout: `shared/` (types + charging math), `frontend/`, `backend/`. Managed with npm workspaces.

## Architecture sketch

```
React (Vite)  ──┬──▶  Express API  ──▶  Supabase Postgres
                │           │
                │           └──▶  1Hz timer: promotes reserved → charging
                │
                └──▶  Supabase Realtime channels (stations, reservations)
```

- Frontend reads via Supabase anon key + Realtime; writes go through the Express backend (service-role key, bypasses RLS).
- All business rules (queue, grace timer, validation) live server-side.
- The 15s grace period is enforced by an idempotent 1Hz job, so restarts are safe.

## Local development

1. Install Node.js ≥ 20, npm ≥ 10.
2. Create a free-tier Supabase project; copy URL, anon key, service role key, JWT secret, and DB connection string.
3. Clone the repo and copy `.env.example` to `.env`, then fill in values.
4. Install dependencies: `npm install`.
5. Apply migrations: `npm --workspace backend run prisma:migrate`.
6. Seed car models: `npm --workspace backend run seed`.
7. Start dev servers: `npm run dev` (frontend on `:5173`, backend on `:4000`).
8. Promote yourself to admin via Supabase SQL: `UPDATE profiles SET role='admin' WHERE email='you@example.com';`.

## Status

Thesis project — not intended for production use. Out of scope: real payments, native mobile, multi-city, multi-language, real EV hardware integration.

## Author

Danila Buret
