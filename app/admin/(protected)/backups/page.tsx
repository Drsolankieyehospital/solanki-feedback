import { getAdmin } from "@/lib/auth";
import { Card, CardHead } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function BackupsPage() {
  const admin = await getAdmin();
  if (admin?.role !== "admin") {
    return (
      <Card>
        <p className="text-sm text-muted">Backups are available to admins only.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHead title="Download a backup now" />
        <p className="mb-4 text-[13px] text-muted">
          Builds a ZIP containing <code>feedback.csv</code>,{" "}
          <code>feedback.json</code>, <code>opd_staff.json</code> and a README
          with the date and row counts. Each download is recorded in the audit
          log.
        </p>
        {/* A plain link so the browser downloads the streamed ZIP. */}
        <a
          href="/api/backup"
          className="inline-flex rounded-field bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft"
        >
          Download full backup (ZIP)
        </a>
      </Card>

      <Card>
        <CardHead title="Automatic nightly backups" />
        <p className="text-[13px] leading-relaxed text-muted">
          A GitHub Actions workflow runs nightly at 02:00 IST:{" "}
          <code>pg_dump</code> → gzip → upload to private storage, keeping the
          last 30 dailies and 12 monthlies. See{" "}
          <code>.github/workflows/nightly-backup.yml</code>. Supabase&apos;s own
          backups depend on your plan — check its backup / point-in-time-recovery
          terms. The restore runbook is in <code>docs/restore.md</code>; test it
          once before launch.
        </p>
        <div className="mt-3 rounded-field border border-divider bg-canvas px-4 py-2.5 text-[12.5px] text-muted">
          Live backup history (date, size, status) and a red staleness warning
          when the last nightly run is over 36 hours old will appear here once
          Supabase Storage is connected.
        </div>
      </Card>
    </div>
  );
}
