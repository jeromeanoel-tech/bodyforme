-- Update recurring sessions to match the corrected timetable.
-- All comparisons use Melbourne local time via AT TIME ZONE 'Australia/Melbourne'.
-- Only future (not yet started) sessions are updated.

-- Monday 5:45 pm — instructor Suzanne → Sammy
UPDATE sessions
SET    instructor_name = 'Sammy'
WHERE  title           = 'Hot Pilates'
AND    EXTRACT(DOW FROM start_time AT TIME ZONE 'Australia/Melbourne') = 1
AND    EXTRACT(HOUR  FROM start_time AT TIME ZONE 'Australia/Melbourne') = 17
AND    EXTRACT(MINUTE FROM start_time AT TIME ZONE 'Australia/Melbourne') = 45
AND    start_time > NOW();

-- Tuesday 9:30 am & 5:45 pm — rename AAA to Arms, Abs & Glutes
UPDATE sessions
SET    title = 'Arms, Abs & Glutes'
WHERE  title IN ('AAA (Arms Abs Ass)', 'AAA')
AND    EXTRACT(DOW FROM start_time AT TIME ZONE 'Australia/Melbourne') = 2
AND    start_time > NOW();

-- Wednesday 6:30 am — rename AAA to Arms, Abs & Glutes (instructor Mish already correct)
UPDATE sessions
SET    title = 'Arms, Abs & Glutes'
WHERE  title IN ('AAA (Arms Abs Ass)', 'AAA')
AND    EXTRACT(DOW FROM start_time AT TIME ZONE 'Australia/Melbourne') = 3
AND    start_time > NOW();

-- Thursday 5:45 pm — Boxing HIIT / Alex → Tabata / Suzanne
UPDATE sessions
SET    title           = 'Tabata',
       instructor_name = 'Suzanne'
WHERE  title           = 'Boxing HIIT'
AND    EXTRACT(DOW  FROM start_time AT TIME ZONE 'Australia/Melbourne') = 4
AND    EXTRACT(HOUR FROM start_time AT TIME ZONE 'Australia/Melbourne') = 17
AND    start_time > NOW();

-- Thursday 6:45 pm — rename AAA to Arms, Abs & Glutes (instructor Mish already correct)
UPDATE sessions
SET    title = 'Arms, Abs & Glutes'
WHERE  title IN ('AAA (Arms Abs Ass)', 'AAA')
AND    EXTRACT(DOW FROM start_time AT TIME ZONE 'Australia/Melbourne') = 4
AND    start_time > NOW();

-- Friday 9:30 am — instructor Suzanne → Sammy
UPDATE sessions
SET    instructor_name = 'Sammy'
WHERE  title           LIKE '%Hot Mat Pilates%'
AND    EXTRACT(DOW  FROM start_time AT TIME ZONE 'Australia/Melbourne') = 5
AND    EXTRACT(HOUR FROM start_time AT TIME ZONE 'Australia/Melbourne') = 9
AND    start_time > NOW();

-- Saturday 9:15 am — insert Hot Mat Pilates / Sammy for all future Saturdays
-- that don't already have this class at that time.
-- Generates sessions for the next 12 weeks.
DO $$
DECLARE
  service_uuid UUID;
  wk           INT;
  sat          DATE;
  s_start      TIMESTAMPTZ;
  s_end        TIMESTAMPTZ;
BEGIN
  -- Get or create the service
  SELECT id INTO service_uuid FROM services WHERE name = 'Hot Mat Pilates' LIMIT 1;
  IF service_uuid IS NULL THEN
    INSERT INTO services (name, description, duration, capacity)
    VALUES ('Hot Mat Pilates', '', 60, 20)
    RETURNING id INTO service_uuid;
  END IF;

  FOR wk IN 0..11 LOOP
    -- Next Saturday from today
    sat := DATE_TRUNC('week', CURRENT_DATE)::DATE + 5 + (wk * 7);

    -- 9:15 am Melbourne = 9:15 AEST (UTC+10) = 23:15 previous day UTC
    s_start := (sat::TEXT || ' 09:15:00')::TIMESTAMPTZ AT TIME ZONE 'Australia/Melbourne';
    s_end   := (sat::TEXT || ' 10:15:00')::TIMESTAMPTZ AT TIME ZONE 'Australia/Melbourne';

    -- Skip if already exists
    IF NOT EXISTS (
      SELECT 1 FROM sessions
      WHERE start_time = s_start AND title = 'Hot Mat Pilates'
    ) THEN
      INSERT INTO sessions (service_id, title, instructor_name, start_time, end_time, capacity, status)
      VALUES (service_uuid, 'Hot Mat Pilates', 'Sammy', s_start, s_end, 20, 'CONFIRMED');
    END IF;
  END LOOP;
END $$;
