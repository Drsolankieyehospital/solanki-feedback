# Dr. Solanki Eye Hospital — Patient Feedback System

Bilingual (English default, Kannada toggle) QR feedback form for out-patients,
plus a secure admin panel. Full spec: [`docs/PLAN.md`](docs/PLAN.md).

When starting a session, read `docs/PLAN.md` and work **one phase at a time**
(see "Build phases"). Commit and typecheck after each phase.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS 3** — tokens driven by CSS variables in `app/globals.css`
- **Supabase** — Postgres + Auth (email/password; public sign-up disabled)
- **Zod** (shared client+server schema) + **React Hook Form**
- Later phases: Recharts (dashboard), SheetJS/ExcelJS (export), `qrcode` (posters),
  Cloudflare Turnstile (bot protection)

## The one rule that must never break

**The browser never writes patient data to Supabase directly.**

- Public form → `POST /api/feedback` → validate + Turnstile + rate-limit →
  insert with the **service-role** client (`lib/supabase/service.ts`).
- Admin pages read through the logged-in user's session
  (`lib/supabase/server.ts` / `client.ts`); **RLS** only lets admins see rows.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — **never** `NEXT_PUBLIC_*`.

## Supabase client helpers

| File | Key | Use |
| --- | --- | --- |
| `lib/supabase/client.ts` | anon | Browser (admin, in-session reads) |
| `lib/supabase/server.ts` | anon | Server Components / Route Handlers / middleware |
| `lib/supabase/service.ts` | **service role** | Server only — insert/export/backup, bypasses RLS |

## Design DNA (blue, mobile-first)

Soft-clinical card UI on cool canvas; single blue accent; 1–5 **stars** for
quality questions, pills for Yes/No. Tokens live in `app/globals.css` + mapped in
`tailwind.config.ts`. `--primary` (#1E5BB8) is a **stand-in** — swap for the real
brand hex when available. Patient form is hand-styled and mobile-first; admin is
desktop-first but responsive (burger drawer on phones). Fonts: Poppins (display),
Inter (body), **Noto Sans Kannada** (Kannada).

## Conventions

- Dates/"today" use `Asia/Kolkata` (IST) everywhere — see `lib/dates.ts`.
- Stored answers are language-neutral codes (`5`, `yes`, `incomplete`); the
  admin panel is English only. Each submission stores which `language` was used.
- Import alias: `@/*` → repo root.
- All pages `noindex` (patient data is health-adjacent).

## Folder structure

See `docs/PLAN.md` → "Routes and folder structure".

## Build phases — all code complete ✅

1. ✅ Setup — scaffold, Supabase helpers, fonts, tokens, CLAUDE.md
2. ✅ Database — migrations (init / RLS / reports) + seed + TS types
3. ✅ i18n + patient form UI
4. ✅ Submission endpoint + thank-you
5. ✅ Admin auth + sidebar
6. ✅ Dashboard
7. ✅ Feedback list, search, detail
8. ✅ Reports (staff / date)
9. ✅ Export (CSV / XLSX)
10. ✅ Backups + QR + staff/users admin + manual entry
11. ✅ Hardening (error/404/loading, robots, CSP) + deploy docs

**Go-live:** connect Supabase + Turnstile + Vercel per `docs/DEPLOY.md`.
Everything flips from sample data to live automatically when env vars are set.
