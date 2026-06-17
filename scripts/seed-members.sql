-- BodyForme member seed — paste into Supabase SQL Editor and click Run
-- Placeholder password for all members: BodyForme2026!
-- Members without emails get a placeholder address — update when you have the real one.

-- ── 1. Members ────────────────────────────────────────────────────────────────

INSERT INTO members (email, password_hash, first_name, last_name, phone, suburb, status, plan_override, credit_balance, admin_notes)
VALUES
  ('bonny_au@outlook.com',                         '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Bonny',     'Au',            '0481 326 838', '', 'active', 'Unlimited',    0,  ''),
  ('armitahashemi07@gmail.com',                    '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Armita',    'Azad',          '0407 843 239', '', 'active', '50-Class Pass', 37, ''),
  ('baric_i@yahoo.com',                            '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Irena',     'Baric',         '0429 117 974', '', 'active', 'casual',        3,  ''),
  ('gregburgess@fastmail.com',                     '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Greg',      'Burgess',       '0477 120 683', '', 'active', 'casual',        1,  ''),
  ('lailaniburra@gmail.com',                       '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Lailani',   'Burra',         '0418 135 181', '', 'active', 'casual',        1,  'Has an issue with her hip.'),
  ('tiffaniecyy@gmail.com',                        '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Tiffanie',  'Cheung',        '0410 969 073', '', 'active', 'casual',        2,  ''),
  ('mariachristofi__@hotmail.com',                 '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Maria',     'Christofi',     '0438 342 569', '', 'active', '10-Class Pack', 8,  'Merged from two Mind Body accounts (same phone). 8 visits remaining.'),
  ('oclarke16@ford.com',                           '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Ozlem',     'Clarke',        '0411 134 707', '', 'active', '20-Class Pack', 6,  ''),
  ('anabelcrake@icloud.com',                       '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Annabel',   'Crake',         '0487 912 707', '', 'active', 'Unlimited',     0,  ''),
  ('enzodaquino1@optusnet.com.au',                 '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Enzo',      'D''Aquino',     '0403 034 443', '', 'active', 'Unlimited',     0,  ''),
  ('michelle.edws@gmail.com',                      '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Michelle',  'Edwards',       '0402 419 340', '', 'active', 'Unlimited',     0,  ''),
  ('marissa.enderby@icloud.com',                   '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Marissa',   'Enderby',       '0433 828 259', '', 'active', 'casual',        1,  ''),
  ('georgiafrey@gmail.com',                        '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Georgia',   'Frey',          '0452 062 611', '', 'active', '3 per week',    0,  ''),
  ('jennifergip@gmail.com',                        '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Jennifer',  'Gip',           '0416 036 881', '', 'active', 'Unlimited',     0,  ''),
  ('noemail.navid.hassani@bodyforme.placeholder',  '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Navid',     'Hassani',       '0413 456 969', '', 'active', 'casual',        1,  '⚠ No email on file — placeholder assigned.'),
  ('rosalie.heckes@gmail.com',                     '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Rosie',     'Heckes',        '0491 029 353', '', 'active', '10-Class Pack', 8,  ''),
  ('tchillier@gmail.com',                          '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Tania',     'Hillier',       '0403 190 843', '', 'active', 'Unlimited',     0,  ''),
  ('noemail.jassmin.jong@bodyforme.placeholder',   '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Jassmin',   'Jong',          '',             '', 'active', 'casual',        1,  '⚠ No email or phone on file — placeholder assigned.'),
  ('rajkakarla@live.com',                          '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Raj',       'Kakarla',       '0402 971 237', '', 'active', 'Unlimited',     0,  ''),
  ('hediyeh.karimi@gmail.com',                     '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Heidi',     'Karimi',        '0492 865 234', '', 'active', 'casual',        4,  'ClassPass member — 4 visits remaining.'),
  ('kylie_keats@yahoo.com.au',                     '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Kylie',     'Keats',         '0432 534 984', '', 'active', 'Unlimited',     0,  ''),
  ('f.e.klonek@gmail.com',                         '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Florian',   'Klonek',        '0472 996 562', '', 'active', 'casual',        1,  ''),
  ('fattahi0410@gmail.com',                        '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Alena',     'Krasnopeera',   '0457 108 665', '', 'active', 'intro-offer',   3,  'Intro pass — may have expired.'),
  ('lynda-kus@bigpond.com',                        '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Lynda',     'Kus',           '0413 952 880', '', 'active', 'Unlimited',     0,  ''),
  ('monidlam@gmail.com',                           '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Monid',     'Lam',           '0411 411 031', '', 'active', 'Unlimited',     0,  ''),
  ('liangyu0210@hotmail.com',                      '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Foria',     'Liang',         '0430 420 210', '', 'active', '3 per week',    0,  ''),
  ('swmloo@hotmail.com',                           '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Siew Mei',  'Loo',           '0410 533 139', '', 'active', 'Unlimited',     0,  ''),
  ('malhotra.akshra@gmail.com',                    '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Akshra',    'Malhotra',      '0481 182 028', '', 'active', '3 per week',    0,  ''),
  ('dymatahari@gmail.com',                         '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Dina',      'Mendez',        '',             '', 'active', 'Unlimited',     0,  'Welcome Back Pass — may have expired.'),
  ('miltiadou@bigpond.com',                        '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Dubravka',  'Miltiadou',     '0423 969 473', '', 'active', '3 per week',    0,  '2 of 3 weekly visits remaining for current period.'),
  ('stephanie_monardo@hotmail.com',                '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Stephanie', 'Monardo',       '0414 947 821', '', 'active', 'Unlimited',     0,  ''),
  ('lauren.munari@gmail.com',                      '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Lauren',    'Munari',        '0401 423 466', '', 'active', 'casual',        1,  'Owes from 23/1/20. Slipped disc in lumbar spine — surgery ~Dec 2019. Modify exercises accordingly.'),
  ('rickyongsk@yahoo.com',                         '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Rickyi',    'Ong',           '0426 839 938', '', 'active', 'casual',        1,  ''),
  ('nancyopasinis@gmail.com',                      '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Nancy',     'Opasinis',      '0409 339 986', '', 'active', '3 per week',    0,  ''),
  ('nadenespaul@gmail.com',                        '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Nadene',    'Paul',          '0419 885 101', '', 'active', 'Unlimited',     0,  ''),
  ('kpkiki11@hotmail.com',                         '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Kristy',    'Pennant',       '0431 329 659', '', 'active', 'Unlimited',     0,  ''),
  ('stevenrigoni@gmail.com',                       '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Steven',    'Rigoni',        '0409 181 413', '', 'active', 'Unlimited',     0,  ''),
  ('bartsaaf@gmail.com',                           '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Bart',      'Saaf',          '0438 317 893', '', 'active', 'Unlimited',     0,  ''),
  ('sberna1@bigpond.com',                          '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Paul',      'Sberna',        '0414 315 728', '', 'active', '50-Class Pass', 43, ''),
  ('robertasilluzio@jelliscraig.com.au',           '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Roberta',   'Silluzio',      '0412 454 050', '', 'active', 'Unlimited',     0,  ''),
  ('ifnotnowwhen1968@gmail.com',                   '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Jim',       'Sovolos',       '0402 405 181', '', 'active', 'Unlimited',     0,  ''),
  ('shoumyaat@gmail.com',                          '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Shoumyaa',  'Thanaskanda',   '0488 328 733', '', 'active', 'casual',        1,  ''),
  ('julia.mai.trinh@gmail.com',                    '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Mai',       'Trinh',         '0432 229 080', '', 'active', 'Unlimited',     0,  ''),
  ('jtsang26@gmail.com',                           '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Jessica',   'Tsang',         '0401 995 974', '', 'active', '3 per week',    0,  'Had trouble signing in online — check portal access.'),
  ('tina.tsang@yahoo.com.au',                      '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Tina',      'Tsang',         '0423 762 762', '', 'active', 'Unlimited',     0,  ''),
  ('rit.tse@iclubb.com',                           '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Rit',       'Tse',           '0401 384 441', '', 'active', 'Unlimited',     0,  ''),
  ('robertupton7@hotmail.com',                     '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Robert',    'Upton',         '0422 259 411', '', 'active', 'Unlimited',     0,  ''),
  ('yclyap@hotmail.com',                           '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Choy Leng', 'Yap',           '0481 222 079', '', 'active', 'Unlimited',     0,  ''),
  ('karen_yau@hotmail.com',                        '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Karen',     'Yau',           '0412 661 226', '', 'active', 'Unlimited',     0,  ''),
  ('jack.zhuleyi@gmail.com',                       '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Ping',      'Yu',            '0432 777 079', '', 'active', '10-Class Pack', 8,  ''),
  ('noemail.yapingchan@bodyforme.placeholder',     '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Ya Ping',   'Chan',          '',             '', 'active', '3 per week',    0,  '⚠ No email on file.'),
  ('noemail.lindachiang@bodyforme.placeholder',    '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Linda',     'Chiang',        '',             '', 'active', '3 per week',    0,  '⚠ No email on file. Long-term DD since Mar 2025.'),
  ('noemail.sarahdick@bodyforme.placeholder',      '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Sarah',     'Dick',          '',             '', 'active', '3 per week',    0,  '⚠ No email on file.'),
  ('noemail.davidmacfarlane@bodyforme.placeholder','$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'David',     'Macfarlane',    '',             '', 'active', '3 per week',    0,  '⚠ No email on file.'),
  ('noemail.emmadalmaso@bodyforme.placeholder',    '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Emma Dal',  'Maso',          '',             '', 'active', '3 per week',    0,  '⚠ No email on file.'),
  ('noemail.vanessathompson@bodyforme.placeholder','$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Vanessa',   'Thompson',      '',             '', 'active', '3 per week',    0,  '⚠ No email on file.'),
  ('noemail.mengyeeyem@bodyforme.placeholder',     '$2b$08$vMCI0i5zedv3GWZBe20Mp.N0baPm4XjziPTWjz7IfTWu8Rrcvus6i', 'Meng Yee',  'Yem',           '',             '', 'active', '3 per week',    0,  '⚠ No email on file.')
ON CONFLICT (email) DO UPDATE SET
  first_name      = EXCLUDED.first_name,
  last_name       = EXCLUDED.last_name,
  phone           = EXCLUDED.phone,
  status          = EXCLUDED.status,
  plan_override   = EXCLUDED.plan_override,
  credit_balance  = EXCLUDED.credit_balance,
  admin_notes     = EXCLUDED.admin_notes;


-- ── 2. Memberships (linked to members via email lookup) ───────────────────────

INSERT INTO memberships (member_id, plan_id, plan_name, status, start_date, end_date)
SELECT m.id, '6-month-unlimited',          '6 Month Unlimited',                          'ACTIVE', '2026-05-19', '2026-11-19' FROM members m WHERE m.email = 'bonny_au@outlook.com'
UNION ALL
SELECT m.id, '50-class-pass',              '50 Class Pass',                               'ACTIVE', '2026-05-14', '2027-05-14' FROM members m WHERE m.email = 'armitahashemi07@gmail.com'
UNION ALL
SELECT m.id, 'casual',                     'Casual Class',                                'ACTIVE', '2026-05-21', '2026-06-21' FROM members m WHERE m.email = 'baric_i@yahoo.com'
UNION ALL
SELECT m.id, 'casual',                     'Casual Class',                                'ACTIVE', '2026-05-23', '2026-06-23' FROM members m WHERE m.email = 'gregburgess@fastmail.com'
UNION ALL
SELECT m.id, 'casual',                     'Casual Class',                                'ACTIVE', '2026-05-21', '2026-06-21' FROM members m WHERE m.email = 'lailaniburra@gmail.com'
UNION ALL
SELECT m.id, 'casual',                     'Casual Class',                                'ACTIVE', '2026-05-30', '2026-06-30' FROM members m WHERE m.email = 'tiffaniecyy@gmail.com'
UNION ALL
SELECT m.id, '10-class-pack',              '10 Class Pass',                               'ACTIVE', '2026-05-25', '2026-06-25' FROM members m WHERE m.email = 'mariachristofi__@hotmail.com'
UNION ALL
SELECT m.id, '20-class-pack',              '20 Class Pass',                               'ACTIVE', '2026-05-01', '2026-11-01' FROM members m WHERE m.email = 'oclarke16@ford.com'
UNION ALL
SELECT m.id, 'unlimited',                  'Monthly Unlimited',                           'ACTIVE', '2026-05-07', '2026-06-07' FROM members m WHERE m.email = 'anabelcrake@icloud.com'
UNION ALL
SELECT m.id, 'unlimited',                  '1 Year Unlimited',                            'ACTIVE', '2026-05-24', '2027-05-24' FROM members m WHERE m.email = 'enzodaquino1@optusnet.com.au'
UNION ALL
SELECT m.id, 'unlimited',                  'Direct Debit Unlimited',                      'ACTIVE', '2026-06-08', '2026-08-10' FROM members m WHERE m.email = 'michelle.edws@gmail.com'
UNION ALL
SELECT m.id, 'casual',                     'Casual Class',                                'ACTIVE', '2026-05-31', '2026-06-30' FROM members m WHERE m.email = 'marissa.enderby@icloud.com'
UNION ALL
SELECT m.id, '3-per-week',                 'Direct Debit 3 Classes/Week',                 'ACTIVE', '2026-06-09', '2026-06-23' FROM members m WHERE m.email = 'georgiafrey@gmail.com'
UNION ALL
SELECT m.id, 'unlimited',                  'Monthly Unlimited',                           'ACTIVE', '2026-05-06', '2026-06-06' FROM members m WHERE m.email = 'jennifergip@gmail.com'
UNION ALL
SELECT m.id, 'casual',                     'Casual Class',                                'ACTIVE', '2026-05-28', '2026-06-28' FROM members m WHERE m.email = 'noemail.navid.hassani@bodyforme.placeholder'
UNION ALL
SELECT m.id, '10-class-pack',              '10 Class Pass',                               'ACTIVE', '2026-05-18', '2026-06-18' FROM members m WHERE m.email = 'rosalie.heckes@gmail.com'
UNION ALL
SELECT m.id, '6-month-unlimited',          '6 Month Unlimited',                           'ACTIVE', '2026-05-07', '2026-11-07' FROM members m WHERE m.email = 'tchillier@gmail.com'
UNION ALL
SELECT m.id, 'casual',                     'Casual Class',                                'ACTIVE', '2026-05-30', '2026-06-30' FROM members m WHERE m.email = 'noemail.jassmin.jong@bodyforme.placeholder'
UNION ALL
SELECT m.id, 'unlimited',                  'Direct Debit Unlimited',                      'ACTIVE', '2026-06-08', '2026-08-03' FROM members m WHERE m.email = 'rajkakarla@live.com'
UNION ALL
SELECT m.id, 'casual',                     'ClassPass',                                   'ACTIVE', '2026-05-19', '2026-08-19' FROM members m WHERE m.email = 'hediyeh.karimi@gmail.com'
UNION ALL
SELECT m.id, '6-month-unlimited',          '6 Month Unlimited',                           'ACTIVE', '2026-05-05', '2026-11-05' FROM members m WHERE m.email = 'kylie_keats@yahoo.com.au'
UNION ALL
SELECT m.id, 'casual',                     'Casual Class',                                'ACTIVE', '2026-05-16', '2026-06-16' FROM members m WHERE m.email = 'f.e.klonek@gmail.com'
UNION ALL
SELECT m.id, 'intro-offer',                'New Student Intro Pass',                      'ACTIVE', '2026-05-25', '2026-05-31' FROM members m WHERE m.email = 'fattahi0410@gmail.com'
UNION ALL
SELECT m.id, 'unlimited',                  'Monthly Unlimited',                           'ACTIVE', '2026-05-19', '2026-06-19' FROM members m WHERE m.email = 'lynda-kus@bigpond.com'
UNION ALL
SELECT m.id, '6-month-unlimited',          '6 Month Unlimited',                           'ACTIVE', '2026-05-14', '2026-11-14' FROM members m WHERE m.email = 'monidlam@gmail.com'
UNION ALL
SELECT m.id, '3-per-week',                 'Direct Debit 3 Classes/Week',                 'ACTIVE', '2026-06-08', '2026-08-31' FROM members m WHERE m.email = 'liangyu0210@hotmail.com'
UNION ALL
SELECT m.id, 'unlimited',                  'Direct Debit Unlimited',                      'ACTIVE', '2026-06-08', '2026-07-27' FROM members m WHERE m.email = 'swmloo@hotmail.com'
UNION ALL
SELECT m.id, '3-per-week',                 'Direct Debit 3 Classes/Week',                 'ACTIVE', '2026-06-08', '2026-08-31' FROM members m WHERE m.email = 'malhotra.akshra@gmail.com'
UNION ALL
SELECT m.id, 'unlimited',                  'Welcome Back Pass',                           'ACTIVE', '2026-05-28', '2026-06-10' FROM members m WHERE m.email = 'dymatahari@gmail.com'
UNION ALL
SELECT m.id, '3-per-week',                 'Direct Debit 3 Classes/Week',                 'ACTIVE', '2026-06-10', '2026-06-17' FROM members m WHERE m.email = 'miltiadou@bigpond.com'
UNION ALL
SELECT m.id, 'unlimited',                  'Monthly Studio Membership',                   'ACTIVE', '2026-06-02', '2026-10-02' FROM members m WHERE m.email = 'stephanie_monardo@hotmail.com'
UNION ALL
SELECT m.id, 'casual',                     'Casual Class',                                'ACTIVE', '2026-05-28', '2026-06-28' FROM members m WHERE m.email = 'lauren.munari@gmail.com'
UNION ALL
SELECT m.id, 'casual',                     'Casual Class',                                'ACTIVE', '2026-05-30', '2026-06-30' FROM members m WHERE m.email = 'rickyongsk@yahoo.com'
UNION ALL
SELECT m.id, '3-per-week',                 'Direct Debit 3 Classes/Week',                 'ACTIVE', '2026-06-05', '2026-07-31' FROM members m WHERE m.email = 'nancyopasinis@gmail.com'
UNION ALL
SELECT m.id, '6-month-unlimited',          '6 Month Unlimited',                           'ACTIVE', '2026-05-14', '2026-11-14' FROM members m WHERE m.email = 'nadenespaul@gmail.com'
UNION ALL
SELECT m.id, 'unlimited',                  'Monthly Unlimited',                           'ACTIVE', '2026-05-12', '2026-06-12' FROM members m WHERE m.email = 'kpkiki11@hotmail.com'
UNION ALL
SELECT m.id, 'unlimited',                  'Monthly Unlimited',                           'ACTIVE', '2026-05-19', '2026-06-19' FROM members m WHERE m.email = 'stevenrigoni@gmail.com'
UNION ALL
SELECT m.id, '6-month-unlimited',          '6 Month Unlimited',                           'ACTIVE', '2026-05-08', '2026-11-08' FROM members m WHERE m.email = 'bartsaaf@gmail.com'
UNION ALL
SELECT m.id, '50-class-pass',              '50 Class Pass',                               'ACTIVE', '2026-05-09', '2027-05-09' FROM members m WHERE m.email = 'sberna1@bigpond.com'
UNION ALL
SELECT m.id, 'unlimited',                  'Monthly Unlimited',                           'ACTIVE', '2026-05-19', '2026-06-19' FROM members m WHERE m.email = 'robertasilluzio@jelliscraig.com.au'
UNION ALL
SELECT m.id, 'unlimited',                  'Monthly Studio Membership',                   'ACTIVE', '2026-05-17', '2026-11-17' FROM members m WHERE m.email = 'ifnotnowwhen1968@gmail.com'
UNION ALL
SELECT m.id, 'casual',                     'Casual Class',                                'ACTIVE', '2026-05-31', '2026-06-30' FROM members m WHERE m.email = 'shoumyaat@gmail.com'
UNION ALL
SELECT m.id, 'unlimited',                  'Monthly Unlimited',                           'ACTIVE', '2026-05-12', '2026-06-12' FROM members m WHERE m.email = 'julia.mai.trinh@gmail.com'
UNION ALL
SELECT m.id, '3-per-week',                 'Direct Debit 3 Classes/Week',                 'ACTIVE', '2026-06-08', '2026-08-24' FROM members m WHERE m.email = 'jtsang26@gmail.com'
UNION ALL
SELECT m.id, 'unlimited',                  'Monthly Unlimited',                           'ACTIVE', '2026-05-01', '2026-06-01' FROM members m WHERE m.email = 'tina.tsang@yahoo.com.au'
UNION ALL
SELECT m.id, 'unlimited',                  'Monthly Unlimited',                           'ACTIVE', '2026-05-01', '2026-06-01' FROM members m WHERE m.email = 'rit.tse@iclubb.com'
UNION ALL
SELECT m.id, 'unlimited',                  'Monthly Studio Membership',                   'ACTIVE', '2026-05-29', '2027-04-27' FROM members m WHERE m.email = 'robertupton7@hotmail.com'
UNION ALL
SELECT m.id, 'unlimited',                  'Direct Debit Unlimited',                      'ACTIVE', '2026-05-31', '2026-06-06' FROM members m WHERE m.email = 'yclyap@hotmail.com'
UNION ALL
SELECT m.id, 'unlimited',                  'Monthly Studio Membership',                   'ACTIVE', '2026-06-04', '2026-11-04' FROM members m WHERE m.email = 'karen_yau@hotmail.com'
UNION ALL
SELECT m.id, '10-class-pack',              '10 Class Pass',                               'ACTIVE', '2026-05-21', '2026-08-21' FROM members m WHERE m.email = 'jack.zhuleyi@gmail.com'
UNION ALL
SELECT m.id, '3-per-week',                 'Direct Debit 3 Classes/Week',                 'ACTIVE', '2026-06-06', '2026-06-27' FROM members m WHERE m.email = 'noemail.yapingchan@bodyforme.placeholder'
UNION ALL
SELECT m.id, '3-per-week',                 'Direct Debit 3 Classes/Week',                 'ACTIVE', '2026-03-18', '2028-06-29' FROM members m WHERE m.email = 'noemail.lindachiang@bodyforme.placeholder'
UNION ALL
SELECT m.id, '3-per-week',                 'Direct Debit 3 Classes/Week',                 'ACTIVE', '2026-06-08', '2026-08-03' FROM members m WHERE m.email = 'noemail.sarahdick@bodyforme.placeholder'
UNION ALL
SELECT m.id, '3-per-week',                 'Direct Debit 3 Classes/Week',                 'ACTIVE', '2026-06-10', '2026-07-07' FROM members m WHERE m.email = 'noemail.davidmacfarlane@bodyforme.placeholder'
UNION ALL
SELECT m.id, '3-per-week',                 'Direct Debit 3 Classes/Week',                 'ACTIVE', '2026-06-09', '2026-08-25' FROM members m WHERE m.email = 'noemail.emmadalmaso@bodyforme.placeholder'
UNION ALL
SELECT m.id, '3-per-week',                 'Direct Debit 3 Classes/Week',                 'ACTIVE', '2026-06-09', '2026-09-01' FROM members m WHERE m.email = 'noemail.vanessathompson@bodyforme.placeholder'
UNION ALL
SELECT m.id, '3-per-week',                 'Direct Debit 3 Classes/Week',                 'ACTIVE', '2026-06-09', '2026-08-25' FROM members m WHERE m.email = 'noemail.mengyeeyem@bodyforme.placeholder';
