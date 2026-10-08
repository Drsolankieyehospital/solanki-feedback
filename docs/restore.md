# Restore runbook

How to restore the Dr. Solanki Eye Hospital feedback database from a nightly
`pg_dump` backup. **Test this once before launch** on a spare Supabase project.

## What you need

- A backup file: `daily/<date>.sql.gz` (or `monthly/<month>.sql.gz`) from the
  `backups` storage bucket, or a `db-backup-<date>` workflow artifact, or a ZIP
  from Admin → Backups.
- The target Supabase project's connection string (Project → Settings →
  Database → Connection string → URI).
- `psql` and `gunzip` locally (Postgres client 16+).

## Restore into a fresh project

1. **Create a new Supabase project** (or use the spare one for a drill).

2. **Apply the schema first** (so enums/tables/policies exist), in the SQL
   editor, in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_reports.sql`

   > Skip this step if your dump already includes the schema (a full `pg_dump`
   > does). In that case go straight to step 3 against an empty database.

3. **Restore the dump:**

   ```bash
   gunzip -c dump-<date>.sql.gz | psql "<TARGET_DB_URL>"
   ```

   If you restored a schema-only migration set in step 2 and the dump is
   data-only, use `--data-only` when creating the dump, or restore with
   `psql` and ignore "already exists" notices.

4. **Re-point the app** at the restored project — update these in Vercel
   (Project → Settings → Environment Variables), then redeploy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

5. **Recreate the first admin** (Auth users are in the dump if you dumped the
   whole database; otherwise re-invite). See `supabase/README.md`.

6. **Verify:** sign in to `/admin`, check the dashboard totals match the backup
   README's row count, and submit one test feedback through `/`.

## Restoring just the data (from the in-app ZIP)

The ZIP from Admin → Backups contains `feedback.csv` / `feedback.json` and
`opd_staff.json`. Use it for spot recovery or audits; for a full database
restore prefer the `pg_dump` `.sql.gz` above.

## Backups inventory

- **Nightly:** `.github/workflows/nightly-backup.yml` → `backups/daily/*` (30
  kept) and `backups/monthly/*` (12 kept), plus a GitHub artifact (35 days).
- **Supabase managed backups:** depend on the plan — check current terms.
- **Manual:** Admin → Backups → "Download full backup (ZIP)".
