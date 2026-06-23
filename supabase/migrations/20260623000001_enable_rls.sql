-- Enable Row Level Security on all tables.
-- The service role key (SUPABASE_SECRET_KEY) used by all server-side API routes
-- always bypasses RLS, so all existing admin and member app functionality is preserved.
-- The browser anon key is only used for Realtime Broadcast channels, which do not
-- require table-level access, so no SELECT policies are needed.

ALTER TABLE members                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships              ENABLE ROW LEVEL SECURITY;
ALTER TABLE services                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_password_resets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_password_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events            ENABLE ROW LEVEL SECURITY;
