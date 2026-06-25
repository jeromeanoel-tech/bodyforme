-- Prevent duplicate sessions at the same service_id + start_time.
-- The application-level duplicate check in seedSessions relies on this constraint.
CREATE UNIQUE INDEX IF NOT EXISTS sessions_service_start_unique
  ON sessions (service_id, start_time);
