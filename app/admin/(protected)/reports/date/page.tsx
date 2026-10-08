import Link from "next/link";
import { getReports, resolveRange, groupDaily, type GroupBy } from "@/lib/reports";
import { Card, CardHead } from "@/components/admin/ui";
import DateRangePicker from "@/components/admin/dashboard/DateRangePicker";
import GroupByPicker from "@/components/admin/reports/GroupByPicker";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function DateReportPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const range = resolveRange(one(sp.range));
  const group = (["day", "week", "month"].includes(one(sp.group) ?? "")
    ? one(sp.group)
    : "day") as GroupBy;

  const { live, daily } = await getReports(range);
  const periods = groupDaily(daily, group);

  const totalCnt = periods.reduce((s, p) => s + p.cnt, 0) || 1;
  const wavg = (pick: (p: (typeof periods)[number]) => number) =>
    Math.round((periods.reduce((s, p) => s + pick(p) * p.cnt, 0) / totalCnt) * 100) / 100;

  const maxCnt = Math.max(1, ...periods.map((p) => p.cnt));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-[12px] text-muted">
          {range.label} · {range.from} → {range.to}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GroupByPicker current={group} />
          <DateRangePicker current={range.preset} />
        </div>
      </div>

      {!live && (
        <div className="rounded-field border border-divider bg-primary-tint px-4 py-2.5 text-[12.5px] font-medium text-primary">
          Showing sample data — connect Supabase to see live submissions.
        </div>
      )}

      <Card>
        <CardHead title="Feedback volume" />
        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 760 170" className="block h-[170px] w-full min-w-[520px]">
            {[...periods].reverse().map((p, i, arr) => {
              const bw = 720 / arr.length;
              const x = 34 + i * bw;
              const h = (p.cnt / maxCnt) * 130;
              return (
                <rect
                  key={p.key}
                  x={x + bw * 0.18}
                  y={150 - h}
                  width={bw * 0.64}
                  height={h}
                  rx="3"
                  fill="var(--primary)"
                />
              );
            })}
          </svg>
        </div>
      </Card>

      <Card className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="text-right text-[11px] uppercase tracking-wide text-muted">
                <th className="border-y border-divider bg-canvas px-3 py-2.5 text-left font-semibold">Period</th>
                <th className="border-y border-divider bg-canvas px-3 py-2.5 font-semibold">Count</th>
                <th className="border-y border-divider bg-canvas px-3 py-2.5 font-semibold">Avg overall</th>
                <th className="border-y border-divider bg-canvas px-3 py-2.5 font-semibold">Avg recep.</th>
                <th className="border-y border-divider bg-canvas px-3 py-2.5 font-semibold">Avg clean.</th>
                <th className="border-y border-divider bg-canvas px-3 py-2.5 font-semibold">% recommend</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.key} className="text-right tabular-nums hover:bg-primary-tint">
                  <td className="border-b border-divider px-3 py-2.5 text-left font-semibold text-ink">
                    <Link
                      href={`/admin/feedback?from=${p.from}&to=${p.to}`}
                      className="hover:text-primary"
                    >
                      {p.label}
                    </Link>
                  </td>
                  <td className="border-b border-divider px-3 py-2.5">{p.cnt}</td>
                  <td className="border-b border-divider px-3 py-2.5 font-semibold text-ink">{p.avg_overall.toFixed(1)}★</td>
                  <td className="border-b border-divider px-3 py-2.5">{p.avg_reception.toFixed(1)}</td>
                  <td className="border-b border-divider px-3 py-2.5">{p.avg_cleanliness.toFixed(1)}</td>
                  <td className="border-b border-divider px-3 py-2.5">{p.pct_recommend}%</td>
                </tr>
              ))}
              {periods.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted">
                    No data in this range.
                  </td>
                </tr>
              )}
            </tbody>
            {periods.length > 0 && (
              <tfoot>
                <tr className="text-right font-semibold tabular-nums">
                  <td className="px-3 py-2.5 text-left text-ink">Total</td>
                  <td className="px-3 py-2.5 text-ink">{totalCnt}</td>
                  <td className="px-3 py-2.5 text-ink">{wavg((p) => p.avg_overall).toFixed(1)}★</td>
                  <td className="px-3 py-2.5 text-ink">{wavg((p) => p.avg_reception).toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-ink">{wavg((p) => p.avg_cleanliness).toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-ink">{Math.round(wavg((p) => p.pct_recommend) * 10) / 10}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
