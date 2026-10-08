-- =============================================================================
-- 0001_init.sql — Dr. Solanki Eye Hospital feedback system
-- Tables: opd_staff, feedback, admin_users, audit_log + is_admin() helper.
-- RLS policies live in 0002_rls.sql; report functions in 0003_reports.sql.
-- =============================================================================

-- ---- Enums -----------------------------------------------------------------
create type yes_no as enum ('yes', 'no');
create type consultant_info as enum ('yes', 'no', 'incomplete');
create type admin_role as enum ('admin', 'viewer');

-- ---- OPD staff (editable from the admin panel) -----------------------------
create table opd_staff (
  id          uuid primary key default gen_random_uuid(),
  name_en     text not null,
  name_kn     text not null,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---- Feedback submissions --------------------------------------------------
-- Star ratings are 1..5 integers. Yes/No and consultant-info are enums so
-- values stay language-neutral (the admin panel is English only).
create table feedback (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  visit_date    date not null,

  -- patient details
  patient_name  text not null check (char_length(patient_name) between 2 and 100),
  mrd_number    text not null check (char_length(mrd_number) between 1 and 30),
  mobile        text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  opd_staff_id  uuid not null references opd_staff(id),

  -- star ratings (1-5), in the patient-journey order used by the form
  reception_rating    smallint not null check (reception_rating between 1 and 5),
  billing_rating      smallint not null check (billing_rating between 1 and 5),
  waiting_rating      smallint not null check (waiting_rating between 1 and 5),
  consultant_info     consultant_info not null,
  doctor_rating       smallint not null check (doctor_rating between 1 and 5),
  exam_rating         smallint not null check (exam_rating between 1 and 5),
  cleanliness_rating  smallint not null check (cleanliness_rating between 1 and 5),
  pharmacy_rating     smallint not null check (pharmacy_rating between 1 and 5),
  staff_helpful       yes_no not null,
  overall_rating      smallint not null check (overall_rating between 1 and 5),

  -- free text
  employee_recognition text check (char_length(employee_recognition) <= 300),
  would_recommend      yes_no not null,
  suggestions          text check (char_length(suggestions) <= 2000),

  -- meta
  language  text not null default 'en' check (language in ('en', 'kn')),
  source    text not null default 'qr',   -- QR location tag, or 'paper' for manual entry
  ip_hash   text,                          -- sha256(ip + salt); rate limiting only

  -- admin workflow
  status       text not null default 'new'
                 check (status in ('new', 'reviewed', 'follow_up', 'resolved')),
  admin_notes  text,
  reviewed_by  uuid references auth.users(id),
  reviewed_at  timestamptz
);

create index on feedback (created_at desc);
create index on feedback (visit_date);
create index on feedback (opd_staff_id, visit_date);
create index on feedback (overall_rating);
create index on feedback (mrd_number);
create index on feedback (mobile);
create index on feedback (status);

-- ---- Admin users (linked to Supabase Auth) ---------------------------------
create table admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        admin_role not null default 'viewer',
  created_at  timestamptz not null default now()
);

-- ---- Audit log (exports, deletes, staff edits, logins) ---------------------
create table audit_log (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  user_id  uuid references auth.users(id),
  action   text not null,   -- 'export_csv','export_xlsx','backup_download','staff_update',...
  details  jsonb
);

create index on audit_log (at desc);

-- ---- Helper used by RLS policies -------------------------------------------
-- is_admin()         -> true for any admin_users row (viewer or admin)
-- is_admin('admin')  -> true only for role = 'admin'
create function is_admin(min_role admin_role default 'viewer')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_users
    where user_id = auth.uid()
      and (min_role = 'viewer' or role = 'admin')
  );
$$;
