import { formatIST } from "@/lib/dates";
import type { DashboardData, DateRange } from "@/lib/reports";
import { Card, CardHead, Stars, StatusPill } from "@/components/admin/ui";
import DateRangePicker from "./DateRangePicker";

const DIST_COLORS = ["#C62828", "#E8803A", "#F2B03A", "#6FA8DC", "#1E5BB8"];

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card>
      <div className="text-[12px] font-semibold text-muted">{label}</div>
      <div className="mt-2 font-display text-[30px] font-semibold tracking-tight text-ink tabular-nums">
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11.5px] text-muted">{sub}</div>}
    </Card>
  );
}

function DistBar({
  dist,
}: {
  dist: Record<"1" | "2" | "3" | "4" | "5", number>;
}) {
  const total =
    dist["1"] + dist["2"] + dist["3"] + dist["4"] + dist["5"] || 1;
  return (
    <div className="flex h-[9px] overflow-hidden rounded-md bg-[var(--track)]">
      {(["1", "2", "3", "4", "5"] as const).map((k, i) => (
        <span
          key={k}
          style={{
            width: `${(dist[k] / total) * 100}%`,
            background: DIST_COLORS[i],
          }}
        />
      ))}
    </div>
  );
}

function RatingRow({
  name,
  avg,
  dist,
}: {
  name: string;
  avg: number;
  dist: Record<"1" | "2" | "3" | "4" | "5", number>;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-divider py-[11px] first:border-t-0">
      <div className="w-[104px] text-[13px] font-semibold text-ink">{name}</div>
      <div className="min-w-0 flex-1">
        <DistBar dist={dist} />
      </div>
      <div className="w-[64px] text-right font-display text-[17px] font-semibold text-ink tabular-nums">
        {avg.toFixed(1)}
        <span className="text-[12px] text-rating"> ★</span>
      </div>
    </div>
  );
}

function Ring({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="flex items-center gap-3.5 border-t border-divider py-3 first:border-t-0">
      <div
        className="relative grid h-[58px] w-[58px] flex-none place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--primary) ${pct}%, var(--track) 0)`,
        }}
      >
        <span className="absolute h-[42px] w-[42px] rounded-full bg-surface" />
        <b className="relative z-10 font-display text-[14px] font-semibold text-ink">
          {Math.round(pct)}%
        </b>
      </div>
      <div className="text-[13.5px] font-semibold text-ink">{label}</div>
    </div>
  );
}

function TrendChart({ daily }: { daily: DashboardData["daily"] }) {
  const W = 760,
    H = 230,
    PADL = 34,
    PADR = 34,
    PADT = 16,
    PADB = 28;
  const maxC = Math.max(10, ...daily.map((d) => d.cnt)) * 1.15;
  const iw = W - PADL - PADR,
    ih = H - PADT - PADB;
  const n = daily.length || 1;
  const step = iw / n;
  const bw = step * 0.56;
  const x = (i: number) => PADL + step * i + step / 2;
  const yC = (v: number) => PADT + ih - (v / maxC) * ih;
  const yA = (v: number) => PADT + ih - ((v - 3.5) / 1.5) * ih;

  const maxCnt = Math.max(...daily.map((d) => d.cnt));
  const line = daily
    .map((d, i) => `${i ? "L" : "M"}${x(i)} ${yA(d.avg_overall)}`)
    .join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-[230px] w-full min-w-[520px]"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const v = Math.round((maxC * f) / 5) * 5;
          return (
            <text
              key={f}
              x={PADL - 8}
              y={yC(v) + 3}
              textAnchor="end"
              className="fill-[var(--muted)]"
              fontSize="10"
            >
              {v}
            </text>
          );
        })}
        {daily.map((d, i) => {
          const h = (d.cnt / maxC) * ih;
          return (
            <rect
              key={i}
              x={x(i) - bw / 2}
              y={PADT + ih - h}
              width={bw}
              height={h}
              rx={3}
              fill={d.cnt >= maxCnt ? "var(--primary)" : "var(--primary-tint)"}
            />
          );
        })}
        <path
          d={line}
          fill="none"
          stroke="var(--rating)"
          strokeWidth={2.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {daily.map((d, i) => (
          <circle key={i} cx={x(i)} cy={yA(d.avg_overall)} r={2.6} fill="var(--rating)" />
        ))}
        {daily.map((d, i) =>
          i % 4 === 0 || i === daily.length - 1 ? (
            <text
              key={`t${i}`}
              x={x(i)}
              y={H - 9}
              textAnchor="middle"
              className="fill-[var(--muted)]"
              fontSize="10"
            >
              {new Date(d.day).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}

export default function Dashboard({
  data,
  range,
}: {
  data: DashboardData;
  range: DateRange;
}) {
  const s = data.summary;
  const consultTotal =
    s.consultant_yes + s.consultant_no + s.consultant_incomplete || 1;
  const maxStaff = Math.max(1, ...data.staff.map((x) => x.cnt));
  const otherAvgs: [string, number][] = [
    ["Billing", s.avg_billing],
    ["Waiting", s.avg_waiting],
    ["Doctor", s.avg_doctor],
    ["Eye exam", s.avg_exam],
    ["Pharmacy", s.avg_pharmacy],
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <div className="text-[12px] text-muted">
            {range.label} · {range.from} → {range.to}
          </div>
        </div>
        <div className="ml-auto">
          <DateRangePicker current={range.preset} />
        </div>
      </div>

      {!data.live && (
        <div className="rounded-field border border-divider bg-primary-tint px-4 py-2.5 text-[12.5px] font-medium text-primary">
          Showing sample data — connect Supabase to see live submissions.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total feedback" value={s.total.toLocaleString("en-IN")} sub={range.label} />
        <Kpi label="Today's feedback" value={s.today} sub="IST" />
        <Kpi
          label="Avg overall rating"
          value={
            <>
              {s.avg_overall.toFixed(1)}
              <span className="text-[15px] text-muted"> / 5 ★</span>
            </>
          }
        />
        <Kpi label="Would recommend" value={<>{s.pct_recommend}%</>} sub="said yes" />
      </div>

      {/* rating + yes/no */}
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHead title="Rating breakdown" />
          <RatingRow name="Reception" avg={s.avg_reception} dist={s.reception_dist} />
          <RatingRow name="Cleanliness" avg={s.avg_cleanliness} dist={s.cleanliness_dist} />
          <RatingRow name="Overall" avg={s.avg_overall} dist={s.overall_dist} />
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-divider pt-3">
            {otherAvgs.map(([name, v]) => (
              <div key={name} className="text-[12.5px] text-muted">
                {name}{" "}
                <b className="font-display text-ink tabular-nums">{v.toFixed(1)}★</b>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHead title="Yes / No answers" />
          <Ring pct={s.pct_staff_helpful} label="Security & staff helpful" />
          <Ring pct={s.pct_recommend} label="Would recommend us" />
          <div className="border-t border-divider py-3">
            <div className="text-[13.5px] font-semibold text-ink">
              Consultant gave detailed info
            </div>
            <div className="mt-2 flex gap-1">
              <span
                className="h-[7px] rounded"
                style={{ width: `${(s.consultant_yes / consultTotal) * 100}%`, background: "var(--success)" }}
              />
              <span
                className="h-[7px] rounded"
                style={{ width: `${(s.consultant_incomplete / consultTotal) * 100}%`, background: "#C77700" }}
              />
              <span
                className="h-[7px] rounded"
                style={{ width: `${(s.consultant_no / consultTotal) * 100}%`, background: "var(--crit)" }}
              />
            </div>
            <div className="mt-2 text-[11.5px] text-muted">
              Yes {Math.round((s.consultant_yes / consultTotal) * 100)}% · Incomplete{" "}
              {Math.round((s.consultant_incomplete / consultTotal) * 100)}% · No{" "}
              {Math.round((s.consultant_no / consultTotal) * 100)}%
            </div>
          </div>
        </Card>
      </div>

      {/* trend */}
      <Card>
        <CardHead
          title="Daily volume & average rating"
          right={
            <span className="flex items-center gap-3 text-[11.5px] text-muted">
              <span className="flex items-center gap-1.5">
                <i className="h-[9px] w-[9px] rounded-sm bg-primary" /> responses
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-[9px] w-[9px] rounded-sm bg-rating" /> avg ★
              </span>
            </span>
          }
        />
        <TrendChart daily={data.daily} />
      </Card>

      {/* needs attention + staff snapshot */}
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHead title="Needs attention" />
          {data.attention.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">
              Nothing needs attention in this range. 🎉
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {data.attention.map((a) => (
                <div
                  key={a.id}
                  className="flex gap-3 rounded-field border border-divider bg-canvas p-3"
                >
                  <span
                    className="w-1 flex-none rounded"
                    style={{ background: a.overall_rating <= 1 || a.would_recommend === "no" ? "var(--crit)" : "#C77700" }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink">
                        {a.patient_name}
                      </span>
                      <Stars value={a.overall_rating} />
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-muted">
                      {a.mrd_number} · {a.staff_name} · {formatIST(a.created_at)}
                    </div>
                    {a.suggestions && (
                      <p className="mt-1.5 text-[12px] italic text-ink">
                        “{a.suggestions}”
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a
                        href={`tel:${a.mobile}`}
                        className="rounded-lg border border-divider bg-surface px-2.5 py-1.5 text-[11.5px] font-semibold text-ink"
                      >
                        Call
                      </a>
                      <a
                        href={`https://wa.me/91${a.mobile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-divider bg-surface px-2.5 py-1.5 text-[11.5px] font-semibold text-ok"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHead title="Staff snapshot" />
          <div className="flex flex-col">
            {data.staff.slice(0, 9).map((st, i) => (
              <div
                key={st.staff_id}
                className="flex items-center gap-3 border-t border-divider py-[9px] first:border-t-0"
              >
                <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-md bg-primary-tint text-[11px] font-bold text-primary">
                  {i + 1}
                </span>
                <span className="w-[112px] flex-none truncate text-[12.5px] font-semibold text-ink">
                  {st.name_en}
                </span>
                <span className="h-[10px] min-w-0 flex-1 overflow-hidden rounded-md bg-[var(--track)]">
                  <span
                    className="block h-full rounded-md bg-primary"
                    style={{ width: `${Math.round((st.cnt / maxStaff) * 100)}%` }}
                  />
                </span>
                <span className="w-[66px] flex-none text-right text-[12px] text-muted tabular-nums">
                  <b className="text-ink">{st.avg_overall.toFixed(1)}★</b> · {st.cnt}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* latest feedback */}
      <Card>
        <CardHead title="Latest feedback" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                <th className="border-b border-divider px-3 pb-2.5">Time</th>
                <th className="border-b border-divider px-3 pb-2.5">Patient</th>
                <th className="border-b border-divider px-3 pb-2.5">MRD</th>
                <th className="border-b border-divider px-3 pb-2.5">OPD staff</th>
                <th className="border-b border-divider px-3 pb-2.5">Recep.</th>
                <th className="border-b border-divider px-3 pb-2.5">Clean.</th>
                <th className="border-b border-divider px-3 pb-2.5">Overall</th>
                <th className="border-b border-divider px-3 pb-2.5">Rec.</th>
                <th className="border-b border-divider px-3 pb-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.latest.map((r) => (
                <tr key={r.id} className="text-[13px]">
                  <td className="border-b border-divider px-3 py-3 text-[11px] text-muted tabular-nums">
                    {formatIST(r.created_at).split(", ")[1] ?? formatIST(r.created_at)}
                  </td>
                  <td className="border-b border-divider px-3 py-3">
                    <span className="font-semibold text-ink">{r.patient_name}</span>
                    {r.language === "kn" && (
                      <span className="ml-1.5 rounded bg-primary-tint px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        ಕನ್ನಡ
                      </span>
                    )}
                    {r.has_suggestion && (
                      <span className="ml-1 text-primary" title="Has a suggestion">
                        •
                      </span>
                    )}
                  </td>
                  <td className="border-b border-divider px-3 py-3 text-[11px] text-muted tabular-nums">
                    {r.mrd_number}
                  </td>
                  <td className="border-b border-divider px-3 py-3 text-ink">
                    {r.staff_name}
                  </td>
                  <td className="border-b border-divider px-3 py-3">
                    <Stars value={r.reception_rating} />
                  </td>
                  <td className="border-b border-divider px-3 py-3">
                    <Stars value={r.cleanliness_rating} />
                  </td>
                  <td className="border-b border-divider px-3 py-3">
                    <Stars value={r.overall_rating} />
                  </td>
                  <td className="border-b border-divider px-3 py-3">
                    <span
                      className={`font-semibold ${r.would_recommend === "yes" ? "text-ok" : "text-crit"}`}
                    >
                      {r.would_recommend === "yes" ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="border-b border-divider px-3 py-3">
                    <StatusPill status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
