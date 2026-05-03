# Charging Station

Bachelor thesis project: web app for managing electric vehicle charging stations in Oradea, Romania.

- **Frontend:** React + TypeScript + Vite + Leaflet (added in Phase 2)
- **Backend:** Node.js + TypeScript + Express + Prisma
- **DB / Auth / Realtime:** Supabase (Postgres)

## Local development (Phase 1: backend only)

### Prerequisites

- Node.js >= 20, npm >= 10
- A Supabase project (free tier) — https://supabase.com
- A second Supabase project labelled `charging-station-test` for the test database (recommended)

### Setup

1. `cp .env.example .env` and fill in values from the Supabase dashboard:
   - Project Settings → API: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (publishable), `SUPABASE_SERVICE_ROLE_KEY` (secret)
   - JWKS endpoint: `SUPABASE_JWKS_URL` is `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`
   - Connect → ORMs → Prisma: copy both `DATABASE_URL` (port 6543, with `?pgbouncer=true`) and `DIRECT_URL` (port 5432); replace the password placeholders.
2. Create a second Supabase project labelled "charging-station-test" and repeat step 1 into a `.env.test` file at the repo root.
3. `npm install`
4. `npm --workspace backend run prisma:migrate` (or `npx prisma migrate deploy --schema=backend/prisma/schema.prisma` if `dev` hangs on the pgbouncer pooler)
5. `npm --workspace backend run seed`
6. Apply migrations to the test DB:
   ```bash
   DOTENV_CONFIG_PATH=.env.test npx prisma migrate deploy --schema=backend/prisma/schema.prisma
   DOTENV_CONFIG_PATH=.env.test cat <<'SQL' | npx prisma db execute --stdin --schema=backend/prisma/schema.prisma
   ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fk_auth_users;
   SQL
   ```
   The FK drop is a test-only adjustment so tests can insert profiles directly without going through Supabase Auth.
7. Promote yourself to admin (after registering through the eventual frontend, or via Supabase Auth REST):
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'you@example.com';
   ```

### Authentication

The backend verifies Supabase-issued JWTs server-side using the project's published JWKS (asymmetric keys), so no shared secret is configured locally. `SUPABASE_JWKS_URL` points the verifier at the Supabase project's well-known JWKS endpoint.

### Run

```bash
npm --workspace backend run dev   # http://localhost:4000
```

### Run (full stack)

```bash
# Terminal 1
npm --workspace backend run dev   # http://localhost:4000

# Terminal 2
npm --workspace frontend run dev  # http://localhost:5173
```

Open http://localhost:5173. Register a user, then in Supabase SQL editor seed at least one station so the map has something to show:

```sql
INSERT INTO stations (name, address, latitude, longitude, power_kw)
VALUES ('Lotus Center', 'Strada Nufărului', 47.058, 21.939, 50);
```

Refresh the home page; the green pin appears.

### Admin panel

Promote a user to admin via SQL:

```sql
UPDATE profiles SET role='admin' WHERE email='you@example.com';
```

After re-login, an "Admin" link appears in the header. Visit `/admin/stations` to add/edit/delete stations on the map. Click an empty area to add a station; the address is auto-filled from Nominatim. Click an existing pin for Edit/Delete. `/admin/users` and `/admin/reservations` list all users and reservations (with a status filter on reservations).

### Realtime publication

Phase 2 relies on Supabase Realtime. In Supabase Dashboard → Database → Replication, ensure both `reservations` and `stations` are part of the `supabase_realtime` publication. If not:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE reservations, stations;
```

### Disable email confirmations (for thesis demo)

Supabase Dashboard → Authentication → Providers → Email → toggle "Confirm email" off so registered users can sign in immediately without an email round-trip.

### Tests

```bash
npm test
```

The backend Vitest config pins the suite to a single forked worker (`pool: 'forks'`, `singleFork: true`) because the integration tests share one Postgres test database; running them in parallel would cause cross-test interference.

## Documentation

- Spec: `docs/superpowers/specs/2026-05-03-charging-station-design.md`
- Phase 1 plan: `docs/superpowers/plans/2026-05-03-charging-station-phase-1-foundation-backend.md`

Note: the `docs/` directory is gitignored, so these files live in the working tree only and are not part of a fresh clone.
