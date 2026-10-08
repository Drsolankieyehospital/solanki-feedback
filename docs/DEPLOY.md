# Deploy & go-live checklist

The app runs fully on sample data until Supabase is connected. These are the
steps to take it live.

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (region close to
   Bengaluru, e.g. Mumbai / `ap-south-1`).
2. SQL Editor → run, in order (see `supabase/README.md`):
   `0001_init.sql`, `0002_rls.sql`, `0003_reports.sql`,
   `0004_device_limit.sql`, then `seed.sql`.
3. **Disable public sign-ups:** Authentication → Providers → Email → turn off
   "Allow new users to sign up".
4. Create the first admin: Authentication → Users → Add user (10+ char
   password), then promote them in SQL (see `supabase/README.md`).
5. Create a **private** Storage bucket named `backups` (for the nightly dump).
6. Copy from Project Settings → API:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (secret!)

## 2. Cloudflare Turnstile

Create a widget at Cloudflare → Turnstile. Copy:
- Site key → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- Secret key → `TURNSTILE_SECRET_KEY`

## 3. Vercel

1. Push this repo to GitHub, import it into Vercel.
2. Add Environment Variables (all environments):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
   `TURNSTILE_SECRET_KEY`, `IP_HASH_SALT` (any long random string),
   `NEXT_PUBLIC_GOOGLE_REVIEW_URL`, and `NEXT_PUBLIC_SITE_URL`
   (e.g. `https://feedback.drsolankieyehospital.com`).
3. Deploy. Add the custom domain `feedback.drsolankieyehospital.com`
   (Project → Settings → Domains) and point the DNS CNAME as Vercel instructs.

## 4. Nightly backups (GitHub Actions)

In the GitHub repo → Settings → Secrets and variables → Actions, add:
- `SUPABASE_DB_URL` (Project Settings → Database → Connection string → URI)
- `SUPABASE_URL` (same as `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`

The workflow `.github/workflows/nightly-backup.yml` runs at 02:00 IST. Trigger
it once manually (Actions → Nightly database backup → Run workflow) to verify.

## 5. Pre-launch checks (from PLAN.md)

- [ ] Fill the form on a real Android + iPhone, both languages, < 90s
- [ ] Kannada strings + staff names proofread by a Kannada-speaking staff member
- [ ] Every required field blocks submit with the right error in both languages
- [ ] Logged-out user cannot reach `/admin/*`; `anon` cannot `select` from
      `feedback` (test in SQL editor as `anon`)
- [ ] Viewer role sees masked mobiles and no Export button
- [ ] 6th quick submission is rate-limited; Turnstile active
- [ ] Dashboard numbers match a manual count for one test day
- [ ] CSV with Kannada opens correctly in Excel; XLSX Summary matches dashboard
- [ ] Nightly backup ran twice; restore tested into a spare project (docs/restore.md)
- [ ] Test data deleted; QR posters printed and scanned from 1 metre
- [ ] Privacy notice wording approved by the hospital
- [ ] Confirm the real MRD format and tighten `lib/validation/feedback.ts`

## Confirm it's live (not sample)

Once env vars are set, the "Showing sample data" banners disappear and the
dashboard/list show real submissions. If a banner persists, the server can't
reach Supabase — re-check the URL and keys.
