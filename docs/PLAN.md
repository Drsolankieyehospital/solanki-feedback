# Patient Feedback System — Build Plan

Dr. Solanki Eye Hospital · Oct 8, 2026 · @keerthu

## Overview

Replace the paper Out-Patient Feedback Form with a bilingual (English default, Kannada toggle) web form opened by QR code, plus a secure admin panel that turns every submission into searchable, exportable, staff-wise data.

**What changes from the paper form**

- The three quality questions (Reception, Cleanliness, Overall) move from 4-word scales to **1–5 stars**.
- Two new required fields: **OPD Assistance Name** (dropdown) and a structured **Date** (auto-filled).
- Patient Name, MRD No and Mobile become **required** and validated. Signature is dropped (the digital submission itself is the record).
- Yes/No questions stay as tap choices — stars do not fit a yes/no answer (see Open questions).

**In scope (v1)**

- Public patient form, thank-you page, printable QR poster
- Admin login, dashboard, staff-wise and date-wise reports, search and filters, detail view, CSV/Excel export, backups
- OPD staff list editable by admin (no code change when staff join or leave)

**Out of scope (v1, easy later)**

- WhatsApp/email alerts on low ratings (fits the existing n8n setup)
- Linking feedback to the Leads CRM by MRD number
- Multi-branch support

**Success criteria**

- A patient finishes the form on a phone in under 90 seconds
- Admin sees a new submission on the dashboard within seconds
- Zero public read access to patient data; every export is logged

## Tech stack and architecture

Same stack as the Leads CRM and counseling system, so Claude Code can follow patterns you already have: Next.js on Vercel, Supabase for database and auth.

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript | Server actions/route handlers for submit, export, backup |
| Styling | Tailwind CSS + shadcn/ui (admin only) | Admin tables, dialogs, date pickers ready-made; patient form hand-styled |
| Database | Supabase Postgres | Row Level Security, SQL views for reports |
| Auth | Supabase Auth (email + password) | Public sign-up disabled; admins invited |
| Validation | Zod (shared client + server schema) | One source of truth for required fields |
| Forms | React Hook Form | Fast on low-end phones |
| Charts | Recharts | Dashboard trend and distribution |
| Export | SheetJS or ExcelJS + CSV | Excel opens cleanly for the hospital office |
| Bot protection | Cloudflare Turnstile + honeypot + rate limit | Public QR form will get spam |
| QR | `qrcode` npm package | Printable poster generated in admin |
| Backup | GitHub Actions nightly `pg_dump` + in-app export | Independent of Supabase plan |
| Hosting | Vercel | Subdomain e.g. feedback.drsolankieyehospital.com |

**Key rule:** the browser never writes to Supabase directly. The form posts to a Next.js route, which validates, checks Turnstile and rate limits, then inserts with the service-role key. Admin pages read through the logged-in user's session, and RLS only lets admins see rows.

## Bilingual system (English / Kannada)

One URL, one form, a two-position switch in the top-right corner: **EN | ಕನ್ನಡ**. English is the default; the choice is remembered on that phone.

**How it works**

1. Strings live in `lib/i18n/en.ts` and `lib/i18n/kn.ts` with identical keys (TypeScript enforces that no key is missing).
2. A `LanguageProvider` (React context) holds the current language, reads/writes `localStorage` (wrapped in try/catch), and sets `<html lang="en|kn">`.
3. The switch flips instantly, with no page reload and no lost answers (form state sits outside the language context).
4. The submission stores `language` (`en` or `kn`) so the admin can see which language each patient used.
5. Stored answers are language-neutral codes (`5`, `yes`, `incomplete`), so reports never mix languages. The admin panel stays English only.

**Fonts:** Poppins and Inter have no Kannada glyphs. Load **Noto Sans Kannada** (Google Fonts) and put it in the font stack after Poppins/Inter, so Kannada text renders properly instead of a fallback system font.

**Staff dropdown:** each staff row stores `name_en` and `name_kn`; the dropdown shows the one for the active language.

**String table (v1 — get a Kannada-speaking staff member to proofread before launch)**

| Key | English | Kannada |
| --- | --- | --- |
| title | Out-Patient Feedback Form | ಹೊರರೋಗಿ ಪ್ರತಿಕ್ರಿಯೆ ನಮೂನೆ |
| intro | Tell us how we are caring. Please share your feedback so we can serve you better. | ನಾವು ನಿಮ್ಮನ್ನು ಹೇಗೆ ಆರೈಕೆ ಮಾಡಿದ್ದೇವೆ ಎಂದು ತಿಳಿಸಿ. ನಿಮಗೆ ಇನ್ನೂ ಉತ್ತಮ ಸೇವೆ ನೀಡಲು ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ಹಂಚಿಕೊಳ್ಳಿ. |
| patientName | Patient's Name | ರೋಗಿಯ ಹೆಸರು |
| mrd | MRD Number | ಎಂ.ಆರ್.ಡಿ ಸಂಖ್ಯೆ |
| mobile | Mobile Number | ಮೊಬೈಲ್ ಸಂಖ್ಯೆ |
| date | Date | ದಿನಾಂಕ |
| opdStaff | Who assisted you at the OPD? | ಒಪಿಡಿಯಲ್ಲಿ ನಿಮಗೆ ಯಾರು ಸಹಾಯ ಮಾಡಿದರು? |
| select | Select | ಆಯ್ಕೆ ಮಾಡಿ |
| q1 | How was your experience at Reception? | ಸ್ವಾಗತ ಕೌಂಟರ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಅನುಭವ ಹೇಗಿತ್ತು? |
| q2 | Did our consultant give you detailed information about the ailment / procedure? | ನಮ್ಮ ವೈದ್ಯರು ನಿಮ್ಮ ಕಾಯಿಲೆ / ಚಿಕಿತ್ಸೆಯ ಬಗ್ಗೆ ವಿವರವಾದ ಮಾಹಿತಿ ನೀಡಿದರೆ? |
| q3 | How do you rate the cleanliness in our hospital? | ನಮ್ಮ ಆಸ್ಪತ್ರೆಯ ಸ್ವಚ್ಛತೆಯನ್ನು ನೀವು ಹೇಗೆ ರೇಟ್ ಮಾಡುತ್ತೀರಿ? |
| q4 | Were the security and other staff helpful? | ಭದ್ರತಾ ಸಿಬ್ಬಂದಿ ಮತ್ತು ಇತರ ಸಿಬ್ಬಂದಿ ಸಹಾಯಕವಾಗಿದ್ದರೆ? |
| q5 | Would you like to recognise any of our employees for delighting you during your visit? | ನಿಮ್ಮ ಭೇಟಿಯ ಸಮಯದಲ್ಲಿ ನಿಮಗೆ ಸಂತಸ ತಂದ ನಮ್ಮ ಯಾವುದೇ ಸಿಬ್ಬಂದಿಯನ್ನು ಗುರುತಿಸಲು ಬಯಸುವಿರಾ? |
| q6 | Would you recommend our service to your friends / family? | ನಮ್ಮ ಸೇವೆಯನ್ನು ನಿಮ್ಮ ಸ್ನೇಹಿತರು / ಕುಟುಂಬದವರಿಗೆ ಶಿಫಾರಸು ಮಾಡುವಿರಾ? |
| q7 | How would you rate your overall experience at our hospital? | ನಮ್ಮ ಆಸ್ಪತ್ರೆಯಲ್ಲಿನ ನಿಮ್ಮ ಒಟ್ಟಾರೆ ಅನುಭವವನ್ನು ಹೇಗೆ ರೇಟ್ ಮಾಡುತ್ತೀರಿ? |
| suggestions | What would you like to tell us to improve our service? | ನಮ್ಮ ಸೇವೆಯನ್ನು ಸುಧಾರಿಸಲು ನೀವು ಏನು ಹೇಳಲು ಬಯಸುತ್ತೀರಿ? |
| yes / no / incomplete | Yes / No / Incomplete | ಹೌದು / ಇಲ್ಲ / ಅಪೂರ್ಣ |
| star1–star5 | Poor / Fair / Good / Very good / Excellent | ಕಳಪೆ / ಸಾಧಾರಣ / ಉತ್ತಮ / ಬಹಳ ಉತ್ತಮ / ಅತ್ಯುತ್ತಮ |
| optional | (optional) | (ಐಚ್ಛಿಕ) |
| submit | Submit Feedback | ಪ್ರತಿಕ್ರಿಯೆ ಸಲ್ಲಿಸಿ |
| errRequired | This field is required | ಈ ಮಾಹಿತಿ ಕಡ್ಡಾಯ |
| errMobile | Enter a valid 10-digit mobile number | ಸರಿಯಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ |
| errRating | Please choose a star rating | ದಯವಿಟ್ಟು ಸ್ಟಾರ್ ರೇಟಿಂಗ್ ಆಯ್ಕೆ ಮಾಡಿ |
| consent | Your details are used only to improve our service and to contact you about this feedback. | ನಿಮ್ಮ ವಿವರಗಳನ್ನು ನಮ್ಮ ಸೇವೆ ಸುಧಾರಿಸಲು ಮತ್ತು ಈ ಪ್ರತಿಕ್ರಿಯೆಯ ಬಗ್ಗೆ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಲು ಮಾತ್ರ ಬಳಸಲಾಗುತ್ತದೆ. |
| thanksTitle | Thank you for your feedback! | ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಗೆ ಧನ್ಯವಾದಗಳು! |
| thanksBody | Your response helps us care for you better. | ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ನಿಮಗೆ ಇನ್ನೂ ಉತ್ತಮ ಆರೈಕೆ ನೀಡಲು ನಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ. |

**OPD staff names**

| # | English | Kannada |
| --- | --- | --- |
| 1 | Mr. Manju R | ಶ್ರೀ ಮಂಜು ಆರ್ |
| 2 | Mrs. Shanthi | ಶ್ರೀಮತಿ ಶಾಂತಿ |
| 3 | Mrs. Sheela | ಶ್ರೀಮತಿ ಶೀಲಾ |
| 4 | Mr. Chandru | ಶ್ರೀ ಚಂದ್ರು |
| 5 | Mrs. Lavanya | ಶ್ರೀಮತಿ ಲಾವಣ್ಯ |
| 6 | Ms. Kavana | ಕು. ಕವನ |
| 7 | Mr. Manoj | ಶ್ರೀ ಮನೋಜ್ |
| 8 | Ms. Ashwini | ಕು. ಅಶ್ವಿನಿ |
| 9 | Mrs. Shalini | ಶ್ರೀಮತಿ ಶಾಲಿನಿ |

## Patient form

The digital form keeps the paper form's order and numbering (1–7, then the suggestions box) so staff and returning patients recognise it, but moves patient details to the top so required fields are filled first.

**Field spec (top to bottom)**

| # | Field | Input | Required | Validation / notes |
| --- | --- | --- | --- | --- |
| A | Patient Name | Text | Yes | 2–100 characters; trim spaces |
| B | MRD Number | Text | Yes | 1–30 characters, letters/digits/`-` `/`; uppercase on save (confirm real format) |
| C | Mobile Number | Tel, numeric keypad | Yes | 10 digits starting 6–9; strip `+91`, spaces, leading 0 |
| D | Date | Date | Yes | Pre-filled with today (IST); cannot be in the future or more than 7 days back |
| E | OPD Assistance Name | Dropdown (9 staff) | Yes | Loaded from `opd_staff` where active |
| 1 | Reception experience | 1–5 stars | Yes |  |
| 2 | Consultant gave detailed information | Yes / No / Incomplete | Yes |  |
| 3 | Hospital cleanliness | 1–5 stars | Yes |  |
| 4 | Security and staff helpful | Yes / No | Yes |  |
| 5 | Employee recognition | Text, 1–2 lines | No | Max 300 characters |
| 6 | Would recommend | Yes / No | Yes |  |
| 7 | Overall experience | 1–5 stars | Yes |  |
| — | Suggestions to improve | Large text area (5 rows) | No | Max 2,000 characters, live counter |
| — | Consent note | Small text above Submit | — | Not a checkbox; a notice (see Security) |
| — | Submit Feedback | Button, full width | — | Disabled + spinner while sending |

**Star rating component** (`StarRating.tsx`)

- 5 outline stars in a row; tapping star N fills stars 1…N. Tapping the same star again does not clear it (avoids accidental zero).
- Each star has at least a 44×44 px tap area, with stars about 32 px visually — elderly patients use this.
- The word for the chosen level shows under the row in the active language: 1 Poor, 2 Fair, 3 Good, 4 Very good, 5 Excellent.
- Accessible: built as a radio group (`role="radiogroup"`, arrow keys move, each star labelled "3 of 5, Good").
- Stored as an integer 1–5.

**Mapping to the paper scales** (for comparing with old paper data if ever entered)

| Paper answer | Stars |
| --- | --- |
| Excellent | 5 |
| Good | 4 |
| Fair / Average | 3 |
| Bad / Poor | 1 |

**Choice buttons** (`ChoiceGroup.tsx`) for Yes/No/Incomplete: square-ish buttons (6 px radius) in a row that echo the paper checkboxes, the selected one filled in brand ink. Radio-group semantics, same as stars.

**Behaviour**

- Validate on blur and on submit; on submit errors, scroll to the first invalid field and focus it.
- Errors show under the field in the active language.
- If the language is switched mid-form, answers stay and error messages re-render in the new language.
- Draft autosave to `sessionStorage` so an accidental back-swipe doesn't lose answers; cleared after a successful submit.
- Hidden honeypot field and Turnstile widget (invisible mode) just above Submit.

## Thank-you page and QR flow

**Patient journey:** scan QR → form opens in English → (optional) switch to ಕನ್ನಡ → fill → Submit → thank-you page.

**QR codes**

- One base URL, e.g. `https://feedback.drsolankieyehospital.com/?src=reception`. The `src` value is saved on each row, so you learn which QR placement works (reception, OPD waiting, pharmacy, billing).
- Admin › QR Codes page: enter a location name → generates a QR + printable A5 poster (logo, "Share your feedback / ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ತಿಳಿಸಿ", the QR, address strip) as PNG and PDF.
- QR points to your own domain, never a shortener, so it never breaks.

**Thank-you page** (`/thank-you`)

- Reached by redirect after a successful insert (`router.replace`, so Back doesn't resubmit). Shows in the language the patient used.
- Content: a simple check mark, the thanks title and line from the string table, hospital phone numbers and address, and a "Back to home" link to the hospital website.
- Optional "Rate us on Google" button linking to the Google review page. **Show it to everyone, not only to happy patients:** asking only high scorers for reviews ("review gating") breaks Google's review policy and can get reviews removed.
- Opening `/thank-you` directly without a submission redirects to the form.

## Database schema (Supabase)

Four tables: `opd_staff`, `feedback`, `admin_users`, `audit_log`, plus three report functions. Put this in `supabase/migrations/0001_init.sql`.

```sql
-- Enums
create type yes_no as enum ('yes','no');
create type consultant_info as enum ('yes','no','incomplete');
create type admin_role as enum ('admin','viewer');

-- OPD staff (editable from admin)
create table opd_staff (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_kn text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Feedback submissions
create table feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  visit_date date not null,
  patient_name text not null check (char_length(patient_name) between 2 and 100),
  mrd_number text not null check (char_length(mrd_number) between 1 and 30),
  mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  opd_staff_id uuid not null references opd_staff(id),
  reception_rating smallint not null check (reception_rating between 1 and 5),
  consultant_info consultant_info not null,
  cleanliness_rating smallint not null check (cleanliness_rating between 1 and 5),
  staff_helpful yes_no not null,
  employee_recognition text check (char_length(employee_recognition) <= 300),
  would_recommend yes_no not null,
  overall_rating smallint not null check (overall_rating between 1 and 5),
  suggestions text check (char_length(suggestions) <= 2000),
  language text not null default 'en' check (language in ('en','kn')),
  source text not null default 'qr',          -- qr location or 'paper' for manual entry
  ip_hash text,                                -- sha256(ip + salt), for rate limiting only
  -- admin workflow
  status text not null default 'new' check (status in ('new','reviewed','follow_up','resolved')),
  admin_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz
);

create index on feedback (created_at desc);
create index on feedback (visit_date);
create index on feedback (opd_staff_id, visit_date);
create index on feedback (overall_rating);
create index on feedback (mrd_number);
create index on feedback (mobile);

-- Admin users (linked to Supabase Auth)
create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role admin_role not null default 'viewer',
  created_at timestamptz not null default now()
);

-- Audit log (exports, deletes, staff edits, logins)
create table audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid references auth.users(id),
  action text not null,        -- 'export_csv','export_xlsx','backup_download','staff_update', ...
  details jsonb
);

-- Helper used by RLS
create function is_admin(min_role admin_role default 'viewer') returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_users
    where user_id = auth.uid()
      and (min_role = 'viewer' or role = 'admin')
  );
$$;
```

**Seed:** insert the 9 OPD staff from the Bilingual section with `sort_order` 1–9.

**Report functions** (Postgres RPC, called from the dashboard so heavy maths runs in the database):

- `dashboard_summary(from_date, to_date)` returns: total count, today's count (IST), average of each star question, % recommend yes, % staff helpful yes, consultant yes/no/incomplete counts, overall-rating distribution 1–5.
- `staff_summary(from_date, to_date)` returns per staff: count, average overall, average reception, % recommend yes, count of overall ≤ 2, count of recognitions mentioning anyone.
- `daily_summary(from_date, to_date)` returns per date: count, average overall, % recommend.

All dates use `Asia/Kolkata`; "today" = `(now() at time zone 'Asia/Kolkata')::date`.

## Security, privacy and spam protection

The form holds patient names, MRD numbers and mobile numbers, so treat it as health-adjacent personal data: nothing public can read it, and every bulk export is logged.

**Row Level Security**

| Table | Public (anon) | Viewer | Admin |
| --- | --- | --- | --- |
| feedback | none (inserts go through server with service role) | select, update status/notes | select, update, delete |
| opd\_staff | none (form loads list via server) | select | select, insert, update |
| admin\_users | none | select own row | select, insert, update |
| audit\_log | none | none | select |

All policies use `is_admin()` / `is_admin('admin')`. The service-role key lives only in Vercel server env vars, never `NEXT_PUBLIC_`.

**Submission endpoint** (`POST /api/feedback`)

1. Reject if the honeypot field is filled.
2. Verify the Cloudflare Turnstile token server-side.
3. Rate limit: max 5 submissions per IP hash per 10 minutes (count rows by `ip_hash` + `created_at`, no extra service needed).
4. Validate with the shared Zod schema; normalise mobile and MRD.
5. Check `opd_staff_id` exists and is active.
6. Insert; return `{ ok: true }` only (no row data back to the browser).

**Duplicates:** same MRD + same visit date submitted twice → accept but flag `possible_duplicate` in the admin list (a patient may genuinely resubmit; don't block them).

**Admin auth**

- Supabase email + password; disable public sign-ups in the Supabase dashboard. First admin is created by hand; others are invited from Admin › Users.
- `middleware.ts` protects every `/admin/*` route except `/admin/login`; a logged-in user who is not in `admin_users` is signed out.
- Password reset by email; minimum 10-character passwords; sessions expire after 8 hours idle.
- Roles: **admin** (everything incl. export, backup, staff and user management) and **viewer** (dashboard, list, detail; mobile numbers masked as 98xxxxxx29; no export).

**Privacy (India's DPDP Act 2023)** — confirm the wording with the hospital before launch:

- Short notice above Submit stating the purpose (string `consent`), plus a link to the hospital privacy policy.
- Collect only what the form needs; IP stored only as a salted hash.
- Retention: decide how long to keep identifiable feedback (e.g. 3 years), then anonymise name/mobile with a scheduled job.
- Security headers via `next.config` (CSP, `X-Frame-Options: DENY`, HSTS); `noindex` on all pages.

## Admin: login, dashboard and reports

The admin panel is desktop-first (also usable on a phone), English only, with a left sidebar: Dashboard · Feedback · Staff report · Date report · QR codes · OPD staff · Backups · Users.

**Login** (`/admin/login`): hospital logo, email, password, "Forgot password". Wrong credentials show one generic error. After 5 failed tries, a 60-second wait.

**Dashboard** (`/admin`) — a date-range picker at the top (Today, Last 7 days, Last 30 days, This month, Custom; default Last 30 days) drives everything below except "Today".

| Block | What it shows |
| --- | --- |
| KPI cards (row of 4) | Total feedback (range, with all-time underneath) · Today's feedback · Average overall rating (e.g. 4.6 ★) · % would recommend |
| Rating summary | Average stars for Reception, Cleanliness, Overall, each with a 1–5 distribution bar |
| Yes/No summary | Staff helpful % yes · Recommend % yes · Consultant info split Yes / No / Incomplete |
| Trend chart | Daily feedback count (bars) and average overall rating (line), for the range |
| Needs attention | Latest submissions with overall ≤ 2, or consultant = No, with status `new` — one click to open, call or WhatsApp the patient |
| Latest feedback | Last 10 submissions: time, patient, staff, overall stars |
| Staff snapshot | Top 9 staff by count with average overall (links to Staff report) |

Dashboard data refreshes on load and every 60 seconds (or via Supabase Realtime on `feedback` inserts).

**Staff report** (`/admin/reports/staff`)

- Table, one row per OPD assistant: feedback count · avg overall · avg reception · avg cleanliness · % recommend · % staff helpful · low ratings (≤ 2) · recognitions.
- Sortable; click a name to open the Feedback list pre-filtered to that staff member and range.
- Small bar chart of average overall per staff member above the table.
- Recognition text from question 5 listed under each staff member's drill-down — useful for monthly staff appreciation.

**Date report** (`/admin/reports/date`)

- Group by Day / Week / Month.
- Table: period · count · avg overall · avg reception · avg cleanliness · % recommend, with a total row.
- Same chart style as the dashboard trend; click a row to open that period in the Feedback list.

## Admin: search, filters, detail, export and backup

**Feedback list** (`/admin/feedback`)

- Search box: patient name, MRD number or mobile (partial match, case-insensitive).
- Filters: date range presets + custom · OPD staff (multi-select) · overall rating (1–5, multi) · "any rating ≤ 2" · recommend Yes/No · consultant info · language · QR source · status (new / reviewed / follow-up / resolved) · has suggestion · has recognition.
- All filters live in the URL query string, so a filtered view can be bookmarked or sent to a colleague.
- Server-side pagination, 25 rows per page; sort by date (default newest), overall rating, staff.
- Columns: date & time · patient · MRD · mobile (masked for viewers) · OPD staff · reception ★ · cleanliness ★ · overall ★ · recommend · status. A dot marks rows with a suggestion; a tag marks possible duplicates.
- Bulk action (admin): mark selected as reviewed.

**Detail view** (`/admin/feedback/[id]`, opens as a side panel from the list)

- Every answer laid out in the paper form's order with stars and choices rendered, full suggestion and recognition text, language used, source, submitted time (IST).
- Patient block with tap-to-call and a WhatsApp link (`wa.me/91…`).
- Status dropdown + admin notes (saved with who/when) for follow-up on complaints.
- "Print / PDF" renders the submission in the look of the paper form, for the hospital's physical records or NABH audits.
- Other feedback from the same MRD number listed below (repeat-visit history).

**Export** (admin only)

- "Export" button on the list exports **exactly the current filtered result**, as CSV or Excel (.xlsx).
- Columns: Submitted at (IST), Visit date, Patient name, MRD, Mobile, OPD staff, Reception (1–5), Consultant info, Cleanliness (1–5), Staff helpful, Employee recognition, Would recommend, Overall (1–5), Suggestions, Language, Source, Status, Admin notes.
- Excel file has two sheets: "Feedback" (rows) and "Summary" (the dashboard numbers for that range, plus the staff table).
- File name: `solanki-feedback_2026-10-01_to_2026-10-31.xlsx`. CSV is UTF-8 with BOM so Kannada text opens correctly in Excel.
- Generated in a server route (streamed for large ranges); each export writes an `audit_log` row with the filters and row count.

**Database backup**

- **Automatic:** a GitHub Actions workflow runs nightly at 02:00 IST: `pg_dump` of the database → gzip → upload to a private Supabase Storage bucket (or Google Drive) → keep the last 30 dailies and 12 monthlies. Connection string stored as a GitHub secret.
- **Supabase's own backups:** what's included depends on the Supabase plan — check the current plan's backup and point-in-time-recovery terms before relying on it.
- **Manual (Admin › Backups):** "Download full backup now" builds a ZIP with `feedback.csv`, `feedback.json`, `opd_staff.json` and a `README.txt` stating the date and row counts. Logged in `audit_log`.
- The Backups page lists recent automatic backups with date, size and status, and warns in red if the last nightly run is more than 36 hours old.
- **Restore runbook** (in the repo's `docs/restore.md`): create a fresh Supabase project → run migrations → `psql` restore the dump → point Vercel env vars at it. Test it once before launch.

## Design system and visual direction

The form should look like the hospital's own paper form brought online — a white "sheet" with indigo ink, numbered questions and rule lines — not a generic app template.

**Taken from the paper form**

- Header: Dr. Solanki Eye Hospital logo left, NABH emblem right, title "OUT PATIENT FEEDBACK FORM" in uppercase indigo, intro line underneath.
- Numbered questions 1–7 in bold indigo, answers indented under each question.
- Suggestions as a bordered box, like the paper's rectangle.
- Footer strip with the address and phone: 191/1, Link Road, 2nd Cross, Malleshwaram, Bengaluru 560003 · 080-23562211, 2356 2299.

**Tokens** (sample the exact indigo from the logo file before building)

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | approx. #2E2A8C (brand indigo from the form) | Title, question text, selected choices |
| `--ink-soft` | #5A5799 | Helper text |
| `--paper` | #FFFFFF | Form sheet |
| `--desk` | #F3F3F6 | Page background behind the sheet |
| `--rule` | #DCDCE6 | Dividers between questions |
| `--star` | #F2A900 | Filled stars |
| `--star-empty` | #C9C9D6 | Star outlines |
| `--error` | #C62828 | Validation |
| Radius | 6 px inputs/buttons, 10 px the sheet | Restrained, not pill-shaped |
| Fonts | Poppins (headings) · Inter (body) · Noto Sans Kannada (Kannada) |  |

**Layout rules**

- Mobile-first: single column, sheet full-width with 16 px gutters; on desktop the sheet is centred at max 640 px, like a paper page on a desk.
- Questions left-aligned (not centred), each separated by a hairline rule.
- Inputs 48 px tall, 16 px text minimum (stops iOS zooming in).
- Language switch: a compact two-segment control in the header, not a floating button.
- No gradients, no emoji, no illustrations; the only colour accents are indigo and the star gold.
- Admin: same tokens, white cards on `--desk`, dense tables, indigo for primary buttons and active nav.

## Routes and folder structure

```text
app/
  page.tsx                         # Patient form (QR lands here)
  thank-you/page.tsx
  api/
    feedback/route.ts              # POST submit
    export/route.ts                # GET csv|xlsx (admin)
    backup/route.ts                # GET zip (admin)
  admin/
    login/page.tsx
    forgot-password/page.tsx
    (protected)/
      layout.tsx                   # sidebar + role check
      page.tsx                     # Dashboard
      feedback/page.tsx            # List, search, filters
      feedback/[id]/page.tsx       # Detail + print
      feedback/new/page.tsx        # Manual entry of paper forms (source='paper')
      reports/staff/page.tsx
      reports/date/page.tsx
      qr/page.tsx
      staff/page.tsx               # OPD staff CRUD
      backups/page.tsx
      users/page.tsx               # Invite admins/viewers
components/
  feedback/  StarRating.tsx  ChoiceGroup.tsx  LanguageToggle.tsx  FormHeader.tsx  FormFooter.tsx
  admin/     KpiCard.tsx  FilterBar.tsx  FeedbackTable.tsx  FeedbackDetail.tsx  TrendChart.tsx  ExportButton.tsx
lib/
  i18n/      en.ts  kn.ts  LanguageProvider.tsx
  supabase/  client.ts  server.ts  service.ts   # service.ts = service-role, server only
  validation/feedback.ts                     # shared Zod schema
  turnstile.ts  rate-limit.ts  export.ts  dates.ts (IST helpers)
middleware.ts
supabase/migrations/  0001_init.sql  0002_rls.sql  0003_reports.sql  seed.sql
.github/workflows/nightly-backup.yml
docs/  PLAN.md  restore.md
CLAUDE.md
```

**Environment variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `IP_HASH_SALT`, `NEXT_PUBLIC_GOOGLE_REVIEW_URL`; GitHub secrets `SUPABASE_DB_URL`, storage credentials.

## Build phases with Claude Code prompts

Export this doc as Markdown, save it as `docs/PLAN.md` in a new repo, and start each Claude Code session with: *"Read docs/PLAN.md. We are doing Phase N only."* Commit and test after every phase.

1. **Setup** — "Create a Next.js App Router + TypeScript + Tailwind project. Add shadcn/ui, Supabase SSR client helpers (`lib/supabase/client.ts`, `server.ts`, `service.ts`), React Hook Form, Zod. Load Poppins, Inter and Noto Sans Kannada via next/font. Write CLAUDE.md summarising stack, folder structure and the rule that the browser never writes to Supabase directly."
2. **Database** — "Write migrations 0001\_init.sql, 0002\_rls.sql, 0003\_reports.sql and seed.sql exactly per the Database schema and Security sections of PLAN.md, including the three report functions with Asia/Kolkata dates. Generate TypeScript types."
3. **i18n + patient form UI** — "Build en.ts/kn.ts from the string table, LanguageProvider and LanguageToggle (EN default, remembered in localStorage). Build StarRating and ChoiceGroup as accessible radio groups, then the full form on `/` following the Field spec and Design system sections. Mobile-first, no submission yet."
4. **Submission** — "Create `POST /api/feedback`: honeypot, Turnstile verification, IP-hash rate limit, shared Zod schema, active-staff check, insert with service role. Wire the form to it, add sessionStorage draft autosave, scroll-to-first-error, and the `/thank-you` page with the Google review button shown to everyone."
5. **Admin auth** — "Build `/admin/login`, forgot-password, `middleware.ts` protection, `admin_users` role check (admin/viewer), sidebar layout and sign-out."
6. **Dashboard** — "Build `/admin` with the date-range picker, KPI cards, rating summary, yes/no summary, Recharts trend, Needs-attention list and Latest feedback, all from the RPC functions. Refresh every 60 s."
7. **List, search, detail** — "Build `/admin/feedback` with URL-synced search and all filters, server pagination, sorting, mobile masking for viewers, duplicate tag, bulk mark-reviewed. Build the detail side panel with status, notes, call/WhatsApp links, same-MRD history and a print view styled like the paper form."
8. **Reports** — "Build Staff report and Date report pages per PLAN.md, with drill-down links into the filtered list."
9. **Export** — "Create `/api/export` for CSV (UTF-8 BOM) and XLSX (Feedback + Summary sheets) honouring current filters, admin only, writing audit\_log."
10. **Backups + QR + staff admin** — "Add the nightly-backup GitHub Action with 30/12 retention, the Backups page with manual ZIP download and staleness warning, docs/restore.md, the QR poster generator with `src` parameter, the OPD staff CRUD page, Users invite page, and manual paper-form entry."
11. **Hardening + deploy** — "Add security headers, noindex, error and empty states, loading skeletons; run a Lighthouse mobile pass on the form; deploy to Vercel on the feedback subdomain."

## Testing, launch checklist and open questions

**Before launch**

- [ ] Fill the form on a low-end Android phone and an iPhone, in both languages, start to finish in under 90 seconds
- [ ] Kannada strings and staff names proofread by a Kannada-speaking staff member
- [ ] Every required field blocks submit with the right error in both languages
- [ ] Logged-out user cannot reach any `/admin` page; anon key cannot `select` from `feedback` (test in Supabase SQL editor as `anon`)
- [ ] Viewer role sees masked mobiles and no Export button
- [ ] Rate limit and Turnstile tested (6th quick submission is refused)
- [ ] Dashboard numbers match a manual count for one test day
- [ ] CSV with Kannada text opens correctly in Excel; XLSX Summary sheet matches dashboard
- [ ] Nightly backup ran at least twice; a restore tested into a spare Supabase project
- [ ] Test data deleted; QR posters printed and scanned from 1 metre away
- [ ] Privacy notice wording approved by the hospital

**Open questions for the hospital**

- [ ] Stars for Yes/No questions? Plan keeps Q2, Q4, Q6 as choices. Alternative: turn Q2 into "How clearly did the consultant explain?" (stars) and Q6 into a 0–10 recommend score.
- [ ] What does a real MRD number look like (length, letters, prefix)? Tightens validation.
- [ ] Domain: `feedback.drsolankieyehospital.com` or a path on the main site?
- [ ] Who gets admin vs viewer access, and how many people?
- [ ] Should a 1–2 star overall rating alert someone instantly (WhatsApp/email via n8n)?
- [ ] Is past paper feedback to be entered manually, and from what date?
- [ ] Should OPD staff also be able to fill the form on a reception tablet for patients who can't use a phone (kiosk mode that resets after submit)?
- [ ] Retention period for identifiable feedback data.
