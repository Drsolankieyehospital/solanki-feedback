-- =============================================================================
-- 0002_rls.sql — Row Level Security
--
-- Public (anon) has ZERO access to any table. The public form inserts through
-- the server with the service-role key (which bypasses RLS). Admin pages read
-- through the logged-in user's session, gated by is_admin().
--
--   feedback    anon: none | viewer: select + update(status/notes) | admin: all
--   opd_staff   anon: none | viewer: select            | admin: select/insert/update
--   admin_users anon: none | viewer: select own row    | admin: all
--   audit_log   anon: none | viewer: none              | admin: select
-- =============================================================================

alter table opd_staff   enable row level security;
alter table feedback    enable row level security;
alter table admin_users enable row level security;
alter table audit_log   enable row level security;

-- ---- opd_staff -------------------------------------------------------------
create policy opd_staff_select on opd_staff
  for select using (is_admin());

create policy opd_staff_write on opd_staff
  for all using (is_admin('admin')) with check (is_admin('admin'));

-- ---- feedback --------------------------------------------------------------
create policy feedback_select on feedback
  for select using (is_admin());

-- viewers and admins may update (status / admin_notes workflow fields)
create policy feedback_update on feedback
  for update using (is_admin()) with check (is_admin());

-- only admins may delete
create policy feedback_delete on feedback
  for delete using (is_admin('admin'));

-- ---- admin_users -----------------------------------------------------------
-- a viewer can read only their own row; admins can read/manage all
create policy admin_users_select_own on admin_users
  for select using (user_id = auth.uid() or is_admin('admin'));

create policy admin_users_manage on admin_users
  for all using (is_admin('admin')) with check (is_admin('admin'));

-- ---- audit_log -------------------------------------------------------------
create policy audit_log_select on audit_log
  for select using (is_admin('admin'));
