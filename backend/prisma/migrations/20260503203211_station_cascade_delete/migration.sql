-- Drop the existing FK and re-create it with ON DELETE CASCADE so admins can
-- delete stations even when historical (completed/cancelled) reservations exist.
-- Active reservations are still blocked by the application-level pre-check in
-- the admin DELETE handler.
ALTER TABLE reservations DROP CONSTRAINT reservations_station_id_fkey;
ALTER TABLE reservations
  ADD CONSTRAINT reservations_station_id_fkey
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE;
