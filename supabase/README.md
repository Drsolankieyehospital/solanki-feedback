# Supabase — database setup

Run these against the project's Postgres **in order**:

1. `migrations/0001_init.sql` — tables, enums, indexes, `is_admin()`
2. `migrations/0002_rls.sql` — Row Level Security policies
3. `migrations/0003_reports.sql` — report RPC functions
4. `seed.sql` — the 9 OPD staff

## Easiest: Supabase SQL Editor

Open the project → **SQL Editor** → paste each file's contents and run, in the
order above.

## Or the Supabase CLI

```bash
# link once
npx supabase link --project-ref <your-project-ref>

# apply everything (migrations run in filename order, then seed)
npx supabase db push
```

## First admin user

Public sign-up is disabled, so create the first admin by hand:

1. Supabase → **Authentication → Users → Add user** (email + a 10+ char password).
2. Then in the SQL Editor, promote them:

   ```sql
   insert into admin_users (user_id, full_name, role)
   values ('<the-new-auth-user-uuid>', 'Dr. R. Solanki', 'admin');
   ```

Further admins/viewers are invited from **Admin → Users** once the app is built
(Phase 10).

## Verifying RLS

In the SQL Editor, run as the `anon` role to confirm zero public access:

```sql
set role anon;
select * from feedback;   -- must return no rows (RLS blocks it)
reset role;
```
