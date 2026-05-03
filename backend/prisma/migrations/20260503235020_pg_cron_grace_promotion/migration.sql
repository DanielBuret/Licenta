-- Enable pg_cron and schedule the grace-period promotion job inside Postgres.
-- This replaces the in-process 1Hz setInterval that ran in src/index.ts on
-- always-on hosts (Render, local dev) and that cannot run on serverless
-- platforms like Vercel. The same SQL still works as a fallback for the
-- in-process timer; we just have a database-side guarantee that 'reserved'
-- rows transition to 'charging' even when no Node process is running.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Idempotent: drop any prior job with the same name so re-running this
-- migration (or a manual ALTER) doesn't duplicate the schedule.
DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'charging-station-grace-promotion';
EXCEPTION WHEN undefined_table THEN
  NULL;
END$$;

-- Schedule every 5 seconds. pg_cron 1.5+ supports sub-minute schedules via
-- the "N seconds" string syntax. If your Supabase project is on an older
-- pg_cron, change to '* * * * *' (1-minute granularity); the grace window
-- becomes 15-75s instead of 15-20s but the demo still works.
SELECT cron.schedule(
  'charging-station-grace-promotion',
  '5 seconds',
  $cron$
  UPDATE reservations
     SET status = 'charging',
         charging_started_at = now()
   WHERE status = 'reserved'
     AND queue_position = 1
     AND reserved_at + interval '15 seconds' <= now()
  $cron$
);
