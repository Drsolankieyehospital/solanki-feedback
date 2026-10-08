-- =============================================================================
-- 0003_reports.sql — Report functions (called from the dashboard via RPC)
--
-- Heavy aggregation runs in Postgres, not the browser. All "today" logic uses
-- Asia/Kolkata (IST). Functions run as the caller (security invoker), so RLS on
-- `feedback` still applies — only logged-in admins get rows. Execute is granted
-- to `authenticated` only (every authed user of this app is an admin).
-- =============================================================================

-- ---- Dashboard summary -----------------------------------------------------
create or replace function dashboard_summary(from_date date, to_date date)
returns jsonb
language sql
stable
set search_path = public
as $$
  with f as (
    select * from feedback
    where visit_date between from_date and to_date
  )
  select jsonb_build_object(
    'total',             (select count(*) from f),
    'today',             (select count(*) from feedback
                           where visit_date = (now() at time zone 'Asia/Kolkata')::date),
    'avg_reception',     (select coalesce(round(avg(reception_rating)::numeric, 2), 0) from f),
    'avg_billing',       (select coalesce(round(avg(billing_rating)::numeric, 2), 0) from f),
    'avg_waiting',       (select coalesce(round(avg(waiting_rating)::numeric, 2), 0) from f),
    'avg_doctor',        (select coalesce(round(avg(doctor_rating)::numeric, 2), 0) from f),
    'avg_exam',          (select coalesce(round(avg(exam_rating)::numeric, 2), 0) from f),
    'avg_cleanliness',   (select coalesce(round(avg(cleanliness_rating)::numeric, 2), 0) from f),
    'avg_pharmacy',      (select coalesce(round(avg(pharmacy_rating)::numeric, 2), 0) from f),
    'avg_overall',       (select coalesce(round(avg(overall_rating)::numeric, 2), 0) from f),
    'pct_recommend',     (select coalesce(round(100.0 * avg((would_recommend = 'yes')::int), 1), 0) from f),
    'pct_staff_helpful', (select coalesce(round(100.0 * avg((staff_helpful = 'yes')::int), 1), 0) from f),
    'consultant_yes',        (select count(*) from f where consultant_info = 'yes'),
    'consultant_no',         (select count(*) from f where consultant_info = 'no'),
    'consultant_incomplete', (select count(*) from f where consultant_info = 'incomplete'),
    'overall_dist', (select jsonb_build_object(
        '1', count(*) filter (where overall_rating = 1),
        '2', count(*) filter (where overall_rating = 2),
        '3', count(*) filter (where overall_rating = 3),
        '4', count(*) filter (where overall_rating = 4),
        '5', count(*) filter (where overall_rating = 5)
      ) from f),
    'reception_dist', (select jsonb_build_object(
        '1', count(*) filter (where reception_rating = 1),
        '2', count(*) filter (where reception_rating = 2),
        '3', count(*) filter (where reception_rating = 3),
        '4', count(*) filter (where reception_rating = 4),
        '5', count(*) filter (where reception_rating = 5)
      ) from f),
    'cleanliness_dist', (select jsonb_build_object(
        '1', count(*) filter (where cleanliness_rating = 1),
        '2', count(*) filter (where cleanliness_rating = 2),
        '3', count(*) filter (where cleanliness_rating = 3),
        '4', count(*) filter (where cleanliness_rating = 4),
        '5', count(*) filter (where cleanliness_rating = 5)
      ) from f)
  );
$$;

-- ---- Per-staff summary -----------------------------------------------------
create or replace function staff_summary(from_date date, to_date date)
returns table (
  staff_id          uuid,
  name_en           text,
  name_kn           text,
  cnt               bigint,
  avg_overall       numeric,
  avg_reception     numeric,
  avg_cleanliness   numeric,
  pct_recommend     numeric,
  pct_staff_helpful numeric,
  low_count         bigint,
  recognitions      bigint
)
language sql
stable
set search_path = public
as $$
  select
    s.id,
    s.name_en,
    s.name_kn,
    count(f.id),
    coalesce(round(avg(f.overall_rating)::numeric, 2), 0),
    coalesce(round(avg(f.reception_rating)::numeric, 2), 0),
    coalesce(round(avg(f.cleanliness_rating)::numeric, 2), 0),
    coalesce(round(100.0 * avg((f.would_recommend = 'yes')::int), 1), 0),
    coalesce(round(100.0 * avg((f.staff_helpful = 'yes')::int), 1), 0),
    count(f.id) filter (where f.overall_rating <= 2),
    count(f.id) filter (where coalesce(btrim(f.employee_recognition), '') <> '')
  from opd_staff s
  left join feedback f
    on f.opd_staff_id = s.id
   and f.visit_date between from_date and to_date
  group by s.id, s.name_en, s.name_kn, s.sort_order
  order by s.sort_order;
$$;

-- ---- Daily summary ---------------------------------------------------------
create or replace function daily_summary(from_date date, to_date date)
returns table (
  day             date,
  cnt             bigint,
  avg_overall     numeric,
  avg_reception   numeric,
  avg_cleanliness numeric,
  pct_recommend   numeric
)
language sql
stable
set search_path = public
as $$
  select
    visit_date,
    count(*),
    coalesce(round(avg(overall_rating)::numeric, 2), 0),
    coalesce(round(avg(reception_rating)::numeric, 2), 0),
    coalesce(round(avg(cleanliness_rating)::numeric, 2), 0),
    coalesce(round(100.0 * avg((would_recommend = 'yes')::int), 1), 0)
  from feedback
  where visit_date between from_date and to_date
  group by visit_date
  order by visit_date;
$$;

-- ---- Lock down execution ---------------------------------------------------
revoke execute on function dashboard_summary(date, date) from public, anon;
revoke execute on function staff_summary(date, date)     from public, anon;
revoke execute on function daily_summary(date, date)     from public, anon;

grant execute on function dashboard_summary(date, date) to authenticated;
grant execute on function staff_summary(date, date)     to authenticated;
grant execute on function daily_summary(date, date)     to authenticated;
