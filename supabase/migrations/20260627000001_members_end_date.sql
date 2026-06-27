-- Add end_date to members table for prepaid plan expiry tracking.
-- Safe to re-run: IF NOT EXISTS is a no-op if the column already exists.
ALTER TABLE members ADD COLUMN IF NOT EXISTS end_date TEXT NOT NULL DEFAULT '';
