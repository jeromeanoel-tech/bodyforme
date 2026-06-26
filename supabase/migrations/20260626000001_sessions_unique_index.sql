-- Prevent duplicate active sessions at the same service_id + start_time.
-- Partial index excludes CANCELLED rows so historical cancellations don't block re-seeding.
CREATE UNIQUE INDEX IF NOT EXISTS sessions_service_start_unique
  ON sessions (service_id, start_time)
  WHERE status != 'CANCELLED';
