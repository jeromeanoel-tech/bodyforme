-- Enable Row Level Security on all tables.
-- Safe to re-run: CREATE TABLE uses IF NOT EXISTS, and enabling RLS on an
-- already-secured table is a no-op. Missing tables are skipped gracefully.
--
-- The service role key (SUPABASE_SECRET_KEY) used by all server-side API routes
-- always bypasses RLS, so all existing functionality is preserved.
-- The browser anon key is only used for Realtime Broadcast channels (not table queries).

-- ── Create any tables that may be missing ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id   TEXT        PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id  UUID        REFERENCES members(id) ON DELETE CASCADE,
  token      TEXT        UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Enable RLS on every table (skips any that still don't exist) ──────────────

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'members',
    'sessions',
    'bookings',
    'memberships',
    'services',
    'waitlist',
    'password_reset_tokens',
    'admin_password_resets',
    'admin_password_overrides',
    'stripe_events'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      RAISE NOTICE 'RLS enabled on %', t;
    ELSE
      RAISE NOTICE 'Table % not found — skipping', t;
    END IF;
  END LOOP;
END $$;
