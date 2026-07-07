-- Normalise schedule_template.day to lowercase, trimmed.
-- Fixes classes that were added with wrong casing (e.g. "Monday" → "monday").
UPDATE schedule_template
SET day = LOWER(TRIM(day))
WHERE day IS NOT NULL AND day != LOWER(TRIM(day));
