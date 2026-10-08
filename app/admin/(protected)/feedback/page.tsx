import Link from "next/link";
import { getAdmin } from "@/lib/auth";
import {
  getFeedbackList,
  maskMobile,
  PAGE_SIZE,
  type FeedbackFilters,
} from "@/lib/feedback-list";
import { formatIST } from "@/lib/dates";
import { Card, Stars, StatusPill } from "@/components/admin/ui";
import FilterBar from "@/components/admin/feedback/FilterBar";
import type { YesNo, ConsultantInfo, Language, FeedbackStatus } from "@/types/database";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function parseFilters(sp: SP): FeedbackFilters {
  const ratingStr = one(sp.rating);
  return {
    q: one(sp.q),
    from: one(sp.from),
    to: one(sp.to),
    staff: one(sp.staff)?.split(",").filter(Boolean),
    rating: ratingStr ? [Number(ratingStr)] : undefined,
    low: one(sp.low) === "1",
    rec: one(sp.rec) as YesNo | undefined,
    consult: one(sp.consult) as ConsultantInfo | undefined,
    lang: one(sp.lang) as Language | undefined,
    source: one(sp.source),
    status: one(sp.status) as FeedbackStatus | undefined,
    hasSuggestion: one(sp.sugg) === "1",
    hasRecognition: one(sp.recog) === "1",
    sort: (one(sp.sort) as FeedbackFilters["sort"]) ?? "date",
    dir: (one(sp.dir) as "asc" | "desc") ?? "desc",
    page: Number(one(sp.page) ?? "1") || 1,
  };
}

function qs(base: SP, patch: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    const val = one(v);
    if (val) p.set(k, val);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v) p.set(k, v);
    else p.delete(k);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export default async function FeedbackListPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const [admin, result] = await Promise.all([getAdmin(), getFeedbackList(filters)]);
  const isViewer = admin?.role !== "admin";

  const sortLink = (col: "date" | "overall" | "staff", label: string) => {
    const active = filters.sort === col;
    const nextDir = active && filters.dir === "desc" ? "asc" : "desc";
    return (
      <Link
        href={`/admin/feedback${qs(sp, { sort: col, dir: nextDir, page: undefined })}`}
        className={`inline-flex items-center gap-1 ${active ? "text-primary" : ""}`}
      >
        {label}
        {active && <span>{filters.dir === "desc" ? "↓" : "↑"}</span>}
      </Link>
    );
  };

  const from = (result.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(result.total, result.page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      {!result.live && (
        <div className="rounded-field border border-divider bg-primary-tint px-4 py-2.5 text-[12.5px] font-medium text-primary">
          Showing sample data — connect Supabase to see live submissions.
        </div>
      )}

      <Card>
        <FilterBar />
      </Card>

      <Card className="!p-0">
        <div className="flex items-center justify-between px-[18px] py-3 text-[12.5px] text-muted">
          <span>
            {result.total === 0
              ? "No results"
              : `Showing ${from}–${to} of ${result.total.toLocaleString("en-IN")}`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                <th className="border-y border-divider bg-canvas px-3 py-2.5">{sortLink("date", "Date")}</th>
                <th className="border-y border-divider bg-canvas px-3 py-2.5">Patient</th>
                <th className="border-y border-divider bg-canvas px-3 py-2.5">MRD</th>
                <th className="border-y border-divider bg-canvas px-3 py-2.5">Mobile</th>
                <th className="border-y border-divider bg-canvas px-3 py-2.5">{sortLink("staff", "OPD staff")}</th>
                <th className="border-y border-divider bg-canvas px-3 py-2.5">Recep.</th>
                <th className="border-y border-divider bg-canvas px-3 py-2.5">Clean.</th>
                <th className="border-y border-divider bg-canvas px-3 py-2.5">{sortLink("overall", "Overall")}</th>
                <th className="border-y border-divider bg-canvas px-3 py-2.5">Rec.</th>
                <th className="border-y border-divider bg-canvas px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr key={r.id} className="group text-[13px] hover:bg-primary-tint">
                  <td className="border-b border-divider px-3 py-2.5 text-[11px] text-muted tabular-nums">
                    <Link href={`/admin/feedback/${r.id}`} className="block">
                      {formatIST(r.created_at)}
                    </Link>
                  </td>
                  <td className="border-b border-divider px-3 py-2.5">
                    <Link href={`/admin/feedback/${r.id}`} className="block font-semibold text-ink">
                      {r.patient_name}
                      {r.language === "kn" && (
                        <span className="ml-1.5 rounded bg-primary-tint px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          ಕನ್ನಡ
                        </span>
                      )}
                      {r.has_suggestion && (
                        <span className="ml-1 text-primary" title="Has a suggestion">•</span>
                      )}
                    </Link>
                  </td>
                  <td className="border-b border-divider px-3 py-2.5 text-[11px] text-muted tabular-nums">{r.mrd_number}</td>
                  <td className="border-b border-divider px-3 py-2.5 text-[12px] text-muted tabular-nums">
                    {isViewer ? maskMobile(r.mobile) : r.mobile}
                  </td>
                  <td className="border-b border-divider px-3 py-2.5 text-ink">{r.staff_name}</td>
                  <td className="border-b border-divider px-3 py-2.5"><Stars value={r.reception_rating} /></td>
                  <td className="border-b border-divider px-3 py-2.5"><Stars value={r.cleanliness_rating} /></td>
                  <td className="border-b border-divider px-3 py-2.5"><Stars value={r.overall_rating} /></td>
                  <td className="border-b border-divider px-3 py-2.5">
                    <span className={`font-semibold ${r.would_recommend === "yes" ? "text-ok" : "text-crit"}`}>
                      {r.would_recommend === "yes" ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="border-b border-divider px-3 py-2.5"><StatusPill status={r.status} /></td>
                </tr>
              ))}
              {result.rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-sm text-muted">
                    No feedback matches these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {result.pages > 1 && (
          <div className="flex items-center justify-between px-[18px] py-3">
            <PageLink sp={sp} page={result.page - 1} disabled={result.page <= 1}>
              ← Previous
            </PageLink>
            <span className="text-[12.5px] text-muted">
              Page {result.page} of {result.pages}
            </span>
            <PageLink sp={sp} page={result.page + 1} disabled={result.page >= result.pages}>
              Next →
            </PageLink>
          </div>
        )}
      </Card>
    </div>
  );
}

function PageLink({
  sp,
  page,
  disabled,
  children,
}: {
  sp: SP;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="rounded-field border border-divider px-3.5 py-2 text-[13px] font-semibold text-muted opacity-50">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={`/admin/feedback${qs(sp, { page: String(page) })}`}
      className="rounded-field border border-divider bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-primary-tint"
    >
      {children}
    </Link>
  );
}
