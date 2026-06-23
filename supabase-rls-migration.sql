-- BodyForme RLS Migration
-- Run this in Supabase Dashboard → SQL Editor
-- Enables Row Level Security on all tables and blocks all anonymous access.
-- The server-side API routes use the service role key (SUPABASE_SECRET_KEY)
-- which bypasses RLS, so all existing functionality is preserved.
-- The browser Supabase client (anon key) is only used for Broadcast channels
-- which do not require database table access.

-- ── Enable RLS on all tables ─────────────────────────────────────────────────

ALTER TABLE members                ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships            ENABLE ROW LEVEL SECURITY;
ALTER TABLE services               ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist               ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_password_resets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_password_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events          ENABLE ROW LEVEL SECURITY;

-- ── Block all anonymous and authenticated access ──────────────────────────────
-- The service_role key (used by all server-side API routes) always bypasses RLS,
-- so no policies are needed for the server. These policies block any client
-- that uses the anon key from reading or writing any table.

-- No policies = default deny for anon and authenticated roles.
-- If you need to add authenticated member access in the future (e.g. Supabase Auth),
-- add SELECT policies scoped to auth.uid() here.
