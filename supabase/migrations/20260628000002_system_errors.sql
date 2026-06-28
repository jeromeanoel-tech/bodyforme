-- Error log table for surfacing production errors in the admin.
CREATE TABLE IF NOT EXISTS system_errors (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  route      TEXT        NOT NULL DEFAULT '',
  message    TEXT        NOT NULL DEFAULT '',
  context    JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep only the last 500 rows — auto-prune on insert via trigger
CREATE OR REPLACE FUNCTION prune_system_errors()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM system_errors
  WHERE id IN (
    SELECT id FROM system_errors
    ORDER BY created_at DESC
    OFFSET 500
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prune_system_errors ON system_errors;
CREATE TRIGGER trg_prune_system_errors
  AFTER INSERT ON system_errors
  EXECUTE FUNCTION prune_system_errors();
