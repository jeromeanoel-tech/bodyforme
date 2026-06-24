-- Fix session times: all sessions were stored with Melbourne local time
-- treated as UTC (no -10h conversion applied during seeding).
-- Correct UTC = stored_value - 10 hours (AEST = UTC+10).
-- Only fix current-week and future sessions; leave historical data as-is.

UPDATE sessions
SET
  start_time = start_time - INTERVAL '10 hours',
  end_time   = end_time   - INTERVAL '10 hours'
WHERE
  start_time >= CURRENT_DATE - INTERVAL '1 day'
  AND status != 'CANCELLED';
