-- Weekly recurring schedule template.
-- Each row is one slot in the repeating weekly timetable.
-- start_time / end_time are Melbourne wall-clock times (HH:MM).
-- Changes here are propagated to the sessions table via the admin API.

CREATE TABLE IF NOT EXISTS schedule_template (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  day        TEXT    NOT NULL CHECK (day IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  start_time TEXT    NOT NULL,  -- Melbourne HH:MM, e.g. '09:30'
  end_time   TEXT    NOT NULL,  -- Melbourne HH:MM, e.g. '10:30'
  class_name TEXT    NOT NULL,
  instructor TEXT    NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed with current timetable (from class_schedule.csv)
INSERT INTO schedule_template (day, start_time, end_time, class_name, instructor) VALUES
  ('monday',    '09:30', '10:30', 'Arms Abs Glutes',                        'Suzanne'),
  ('monday',    '17:45', '18:45', 'Hot Mat Pilates',                        'Sammy'),
  ('monday',    '19:00', '20:30', '90min Bikram (Hot Yoga)',                 'Gabriel'),
  ('tuesday',   '09:30', '10:30', 'Arms Abs Glutes',                        'Suzanne'),
  ('tuesday',   '17:45', '18:45', 'Arms Abs Glutes',                        'Suzanne'),
  ('tuesday',   '19:00', '19:45', 'Hot Mat Pilates (Core)',                  'Suzanne'),
  ('wednesday', '06:30', '07:15', 'Arms Abs Glutes',                        'Mish'),
  ('wednesday', '09:30', '10:30', 'Hot Mat Pilates',                        'Suzanne'),
  ('wednesday', '17:45', '18:45', 'Hot Mat',                                'Hiliory'),
  ('wednesday', '19:00', '19:45', 'Power HIIT',                             'Hiliory'),
  ('thursday',  '09:30', '10:30', 'Tabata',                                 'Suzanne'),
  ('thursday',  '17:45', '18:30', 'Tabata',                                 'Suzanne'),
  ('thursday',  '18:45', '19:45', 'Arms Abs Glutes',                        'Mish'),
  ('friday',    '06:30', '07:15', 'Power HIIT',                             'Mish'),
  ('friday',    '09:30', '10:30', 'Hot Mat Pilates (Strength)',              'Sammy'),
  ('friday',    '18:45', '19:45', '60min Bikram Express (Hot Yoga)',         'Mish'),
  ('saturday',  '08:00', '09:00', 'Sculpt Yoga',                            'Stephanie'),
  ('saturday',  '09:15', '10:15', 'Hot Mat Pilates',                        'Sammy'),
  ('saturday',  '15:30', '16:30', 'Silent Bikram',                          'Mish'),
  ('sunday',    '08:00', '09:00', 'Hot Mat Pilates (Sculpt/Strength/Core)', 'Suzanne'),
  ('sunday',    '09:15', '10:45', '90min Bikram (Hot Yoga)',                 'Mish'),
  ('sunday',    '17:00', '18:00', 'Yin Yoga',                               'Sammy');
