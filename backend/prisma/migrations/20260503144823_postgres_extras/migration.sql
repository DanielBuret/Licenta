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
