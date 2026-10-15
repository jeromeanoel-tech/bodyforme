-- Dedicated staff table so instructors can be managed through the admin UI
-- without needing to edit ADMIN_CREDENTIALS environment variable
CREATE TABLE IF NOT EXISTS staff (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  email      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
