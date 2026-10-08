import Link from "next/link";
import { getReports, resolveRange } from "@/lib/reports";
import { Card, CardHead } from "@/components/admin/ui";
import DateRangePicker from "@/components/admin/dashboard/DateRangePicker";
import type { StaffSummaryRow } from "@/types/database";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

type SortKey =
  | "cnt" | "avg_overall" | "avg_reception" | "avg_cleanliness"
  | "pct_recommend" | "pct_staff_helpful" | "low_count" | "recognitions";

export default async function StaffReportPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const range = resolveRange(one(sp.range));
  const { live, staff } = await getReports(range);

  const sort = (one(sp.sort) as SortKey) ?? "cnt";
  const dir = one(sp.dir) === "asc" ? 1 : -1;
  const rows = [...staff].sort((a, b) => ((a[sort] as number) - (b[sort] as number)) * dir);

  const maxAvg = 5;

  const th = (key: SortKey, label: string) => {
    const active = sort === key;
    const nextDir = active && dir === -1 ? "asc" : "desc";
    const q = new URLSearchParams();
    if (one(sp.range)) q.set("range", one(sp.range)!);
    q.set("sort", key);
    q.set("dir", nextDir);
    return (
      <th className="border-y border-divider bg-canvas px-3 py-2.5 text-right font-semibold">
        <Link href={`?${q.toString()}`} className={active ? "text-primary" : ""}>
          {label} {active ? (dir === -1 ? "↓" : "↑") : ""}
        </Link>
      </th>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-[12px] text-muted">
          {range.label} · {range.from} → {range.to}
        </div>
        <div className="ml-auto">
          <DateRangePicker current={range.preset} />
        </div>
      </div>

      {!live && (
        <div className="rounded-field border border-divider bg-primary-tint px-4 py-2.5 text-[12.5px] font-medium text-primary">
          Showing sample data — connect Supabase to see live submissions.
        </div>
      )}

      <Card>
        <CardHead title="Average overall rating per staff" />
        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 760 180" className="block h-[180px] w-full min-w-[520px]">
            {[0, 1, 2, 3, 4, 5].map((v) => {
              const y = 150 - (v / maxAvg) * 130;
              return (
                <g key={v}>
                  <line x1="30" y1={y} x2="760" y2={y} stroke="var(--divider)" strokeWidth="1" />
                  <text x="24" y={y + 3} textAnchor="end" fontSize="9" className="fill-[var(--muted)]">
                    {v}
                  </text>
                </g>
              );
            })}
            {rows.map((s, i) => {
              const bw = 700 / rows.length;
              const x = 34 + i * bw;
              const h = (s.avg_overall / maxAvg) * 130;
              return (
                <g key={s.staff_id}>
                  <rect x={x + bw * 0.2} y={150 - h} width={bw * 0.6} height={h} rx="3" fill="var(--primary)" />
                  <text x={x + bw * 0.5} y={168} textAnchor="middle" fontSize="8.5" className="fill-[var(--muted)]">
                    {s.name_en.replace(/^(Mr|Mrs|Ms)\.\s*/, "")}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </Card>

      <Card className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[13px]">
            <thead>
              <tr className="text-right text-[11px] uppercase tracking-wide text-muted">
                <th className="border-y border-divider bg-canvas px-3 py-2.5 text-left font-semibold">
                  OPD staff
                </th>
                {th("cnt", "Count")}
                {th("avg_overall", "Avg overall")}
                {th("avg_reception", "Avg recep.")}
                {th("avg_cleanliness", "Avg clean.")}
                {th("pct_recommend", "% recommend")}
                {th("pct_staff_helpful", "% helpful")}
                {th("low_count", "Low ≤2")}
                {th("recognitions", "Recognitions")}
              </tr>
            </thead>
            <tbody>
              {rows.map((s: StaffSummaryRow) => (
                <tr key={s.staff_id} className="text-right tabular-nums hover:bg-primary-tint">
                  <td className="border-b border-divider px-3 py-2.5 text-left font-semibold text-ink">
                    <Link
                      href={`/admin/feedback?staff=${s.staff_id}&from=${range.from}&to=${range.to}`}
                      className="hover:text-primary"
                    >
                      {s.name_en}
                    </Link>
                  </td>
                  <td className="border-b border-divider px-3 py-2.5">{s.cnt}</td>
                  <td className="border-b border-divider px-3 py-2.5 font-semibold text-ink">
                    {s.avg_overall.toFixed(1)}★
                  </td>
                  <td className="border-b border-divider px-3 py-2.5">{s.avg_reception.toFixed(1)}</td>
                  <td className="border-b border-divider px-3 py-2.5">{s.avg_cleanliness.toFixed(1)}</td>
                  <td className="border-b border-divider px-3 py-2.5">{s.pct_recommend}%</td>
                  <td className="border-b border-divider px-3 py-2.5">{s.pct_staff_helpful}%</td>
                  <td className={`border-b border-divider px-3 py-2.5 ${s.low_count > 0 ? "font-semibold text-crit" : ""}`}>
                    {s.low_count}
                  </td>
                  <td className="border-b border-divider px-3 py-2.5">{s.recognitions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
