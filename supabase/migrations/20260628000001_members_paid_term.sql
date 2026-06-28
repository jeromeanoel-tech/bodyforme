-- Add paid_term to members table (tracks payment term for manual membership entry).
-- Also creates exec_sql helper so /api/migrate can apply future schema changes.
ALTER TABLE members ADD COLUMN IF NOT EXISTS paid_term TEXT NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
