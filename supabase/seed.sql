-- =============================================================================
-- seed.sql — initial OPD staff (from docs/PLAN.md, Bilingual section).
-- Idempotent: safe to run more than once.
-- =============================================================================

insert into opd_staff (name_en, name_kn, sort_order)
values
  ('Mr. Manju R',   'ಶ್ರೀ ಮಂಜು ಆರ್',   1),
  ('Mrs. Shanthi',  'ಶ್ರೀಮತಿ ಶಾಂತಿ',    2),
  ('Mrs. Sheela',   'ಶ್ರೀಮತಿ ಶೀಲಾ',     3),
  ('Mr. Chandru',   'ಶ್ರೀ ಚಂದ್ರು',      4),
  ('Mrs. Lavanya',  'ಶ್ರೀಮತಿ ಲಾವಣ್ಯ',   5),
  ('Ms. Kavana',    'ಕು. ಕವನ',          6),
  ('Mr. Manoj',     'ಶ್ರೀ ಮನೋಜ್',       7),
  ('Ms. Ashwini',   'ಕು. ಅಶ್ವಿನಿ',      8),
  ('Mrs. Shalini',  'ಶ್ರೀಮತಿ ಶಾಲಿನಿ',   9)
on conflict do nothing;
