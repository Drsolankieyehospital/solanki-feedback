-- =============================================================================
-- seed_demo_feedback.sql — realistic DEMO feedback so the admin panel looks
-- populated for a walkthrough/presentation.
--
-- Inserts 80 rows spread over ~20 days, referencing your real OPD staff.
-- Ratings skew positive with a few low ones (so "Needs attention" has content).
--
-- ⚠️  DELETE this demo data before real patients use the system:
--        delete from feedback where mrd_number like 'EH-DEMO-%';
--     (that only removes these demo rows, never real submissions.)
-- =============================================================================

insert into feedback (
  created_at, visit_date, patient_name, mrd_number, mobile, opd_staff_id,
  reception_rating, billing_rating, waiting_rating, consultant_info,
  doctor_rating, exam_rating, cleanliness_rating, pharmacy_rating,
  staff_helpful, overall_rating, employee_recognition, would_recommend,
  suggestions, language, source, status
)
select
  now() - (g * interval '6 hours')                                           as created_at,
  ((now() - (g * interval '6 hours')) at time zone 'Asia/Kolkata')::date      as visit_date,
  (array['Anitha Rao','Suresh Kumar','Ramesh Gowda','Fatima Begum','Vijay Hegde',
         'Lakshmi Bai','Nagaraj S','Imran Pasha','Deepa Nair','Harish Rai',
         'Sunita Devi','Mohan Das','Kavya Shetty','Arjun Prabhu','Rekha Jain'])[1 + (g % 15)] as patient_name,
  'EH-DEMO-' || lpad(g::text, 3, '0')                                         as mrd_number,
  '98' || lpad(((45000000 + g * 137) % 100000000)::text, 8, '0')             as mobile,
  (select id from opd_staff order by sort_order limit 1 offset (g % 9))       as opd_staff_id,
  4 + (g % 2)                                                                 as reception_rating,
  3 + (g % 3)                                                                 as billing_rating,
  3 + ((g + 1) % 3)                                                           as waiting_rating,
  (array['yes','yes','yes','incomplete','no']::consultant_info[])[1 + (g % 5)] as consultant_info,
  4 + ((g + 2) % 2)                                                           as doctor_rating,
  4 + (g % 2)                                                                 as exam_rating,
  4 + ((g + 1) % 2)                                                           as cleanliness_rating,
  3 + (g % 3)                                                                 as pharmacy_rating,
  (array['yes','yes','yes','yes','no']::yes_no[])[1 + (g % 5)]                as staff_helpful,
  (case when g % 11 = 0 then 2
        when g % 7  = 0 then 3
        else 4 + (g % 2) end)                                                 as overall_rating,
  (case when g % 6 = 0 then 'Staff was very patient and kind during my visit.'
        else null end)                                                        as employee_recognition,
  (case when g % 11 = 0 then 'no' else 'yes' end)::yes_no                      as would_recommend,
  (case when g % 5 = 0 then 'Please add more seating in the waiting area.'
        when g % 8 = 0 then 'Billing counter was a little slow.'
        else null end)                                                        as suggestions,
  (case when g % 3 = 0 then 'kn' else 'en' end)                               as language,
  (array['reception','opd-waiting','pharmacy','billing'])[1 + (g % 4)]        as source,
  (array['new','new','reviewed','resolved']::text[])[1 + (g % 4)]             as status
from generate_series(0, 79) as g;
