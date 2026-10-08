import { createClient } from "@/lib/supabase/server";
import { authConfigured } from "@/lib/auth";
import { todayIST, daysAgoIST } from "@/lib/dates";
import type {
  DashboardSummary,
  StaffSummaryRow,
  DailySummaryRow,
  FeedbackStatus,
  YesNo,
  Language,
} from "@/types/database";

export type RangePreset = "today" | "7" | "30" | "month" | "custom";

export interface DateRange {
  from: string;
  to: string;
  preset: RangePreset;
  label: string;
}

/** Resolve a preset (and optional custom from/to) into an IST date range. */
export function resolveRange(
  preset: string | undefined,
  from?: string,
  to?: string,
): DateRange {
  const today = todayIST();
  const p = (["today", "7", "30", "month", "custom"].includes(preset ?? "")
    ? preset
    : "30") as RangePreset;

  switch (p) {
    case "today":
      return { from: today, to: today, preset: p, label: "Today" };
    case "7":
      return { from: daysAgoIST(6), to: today, preset: p, label: "Last 7 days" };
    case "month": {
      const first = today.slice(0, 8) + "01";
      return { from: first, to: today, preset: p, label: "This month" };
    }
    case "custom":
      if (from && to) return { from, to, preset: p, label: "Custom range" };
      return { from: daysAgoIST(29), to: today, preset: "30", label: "Last 30 days" };
    case "30":
    default:
      return { from: daysAgoIST(29), to: today, preset: "30", label: "Last 30 days" };
  }
}

export interface LatestFeedbackRow {
  id: string;
  created_at: string;
  patient_name: string;
  mrd_number: string;
  staff_name: string;
  reception_rating: number;
  cleanliness_rating: number;
  overall_rating: number;
  would_recommend: YesNo;
  status: FeedbackStatus;
  language: Language;
  has_suggestion: boolean;
}

export interface AttentionRow {
  id: string;
  created_at: string;
  patient_name: string;
  mrd_number: string;
  mobile: string;
  staff_name: string;
  overall_rating: number;
  would_recommend: YesNo;
  suggestions: string | null;
}

export interface DashboardData {
  live: boolean;
  summary: DashboardSummary;
  staff: StaffSummaryRow[];
  daily: DailySummaryRow[];
  latest: LatestFeedbackRow[];
  attention: AttentionRow[];
}

// ---------------------------------------------------------------------------
// Reports (staff + date) — reuses the report RPCs with a sample fallback.
// ---------------------------------------------------------------------------
export interface ReportsData {
  live: boolean;
  staff: StaffSummaryRow[];
  daily: DailySummaryRow[];
}

export async function getReports(range: DateRange): Promise<ReportsData> {
  if (!authConfigured()) {
    const s = sampleDashboard();
    return { live: false, staff: s.staff, daily: s.daily };
  }
  try {
    const supabase = await createClient();
    const [staffRes, dailyRes] = await Promise.all([
      supabase.rpc("staff_summary", { from_date: range.from, to_date: range.to }),
      supabase.rpc("daily_summary", { from_date: range.from, to_date: range.to }),
    ]);
    return {
      live: true,
      staff: (staffRes.data as StaffSummaryRow[]) ?? [],
      daily: (dailyRes.data as DailySummaryRow[]) ?? [],
    };
  } catch {
    const s = sampleDashboard();
    return { live: false, staff: s.staff, daily: s.daily };
  }
}

export type GroupBy = "day" | "week" | "month";

export interface GroupedPeriod {
  key: string;
  label: string;
  from: string;
  to: string;
  cnt: number;
  avg_overall: number;
  avg_reception: number;
  avg_cleanliness: number;
  pct_recommend: number;
}

/** Aggregate per-day rows into day / week / month buckets (weighted averages). */
export function groupDaily(
  daily: DailySummaryRow[],
  group: GroupBy,
): GroupedPeriod[] {
  const buckets = new Map<string, { label: string; from: string; to: string; rows: DailySummaryRow[] }>();

  for (const d of daily) {
    const date = new Date(d.day + "T00:00:00Z");
    let key: string, label: string;
    if (group === "day") {
      key = d.day;
      label = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } else if (group === "month") {
      key = d.day.slice(0, 7);
      label = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    } else {
      // ISO week starting Monday
      const monday = new Date(date);
      const dow = (date.getUTCDay() + 6) % 7;
      monday.setUTCDate(date.getUTCDate() - dow);
      key = monday.toISOString().slice(0, 10);
      label = `Week of ${monday.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
    }
    const b = buckets.get(key) ?? { label, from: d.day, to: d.day, rows: [] };
    b.rows.push(d);
    if (d.day < b.from) b.from = d.day;
    if (d.day > b.to) b.to = d.day;
    buckets.set(key, b);
  }

  const wavg = (rows: DailySummaryRow[], pick: (r: DailySummaryRow) => number) => {
    const total = rows.reduce((s, r) => s + r.cnt, 0) || 1;
    return Math.round((rows.reduce((s, r) => s + pick(r) * r.cnt, 0) / total) * 100) / 100;
  };

  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, b]) => ({
      key,
      label: b.label,
      from: b.from,
      to: b.to,
      cnt: b.rows.reduce((s, r) => s + r.cnt, 0),
      avg_overall: wavg(b.rows, (r) => r.avg_overall),
      avg_reception: wavg(b.rows, (r) => r.avg_reception),
      avg_cleanliness: wavg(b.rows, (r) => r.avg_cleanliness),
      pct_recommend: Math.round(wavg(b.rows, (r) => r.pct_recommend) * 10) / 10,
    }));
}

// ---------------------------------------------------------------------------
// Live data (Supabase) with a sample fallback for local dev.
// ---------------------------------------------------------------------------
export async function getDashboardData(range: DateRange): Promise<DashboardData> {
  if (!authConfigured()) return sampleDashboard();

  try {
    const supabase = await createClient();
    const [summaryRes, staffRes, dailyRes, latestRes, attnRes] =
      await Promise.all([
        supabase.rpc("dashboard_summary", {
          from_date: range.from,
          to_date: range.to,
        }),
        supabase.rpc("staff_summary", {
          from_date: range.from,
          to_date: range.to,
        }),
        supabase.rpc("daily_summary", {
          from_date: range.from,
          to_date: range.to,
        }),
        supabase
          .from("feedback")
          .select(
            "id, created_at, patient_name, mrd_number, reception_rating, cleanliness_rating, overall_rating, would_recommend, status, language, suggestions, opd_staff:opd_staff_id(name_en)",
          )
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("feedback")
          .select(
            "id, created_at, patient_name, mrd_number, mobile, overall_rating, would_recommend, consultant_info, suggestions, status, opd_staff:opd_staff_id(name_en)",
          )
          .or("overall_rating.lte.2,consultant_info.eq.no")
          .eq("status", "new")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

    const summary = summaryRes.data as DashboardSummary | null;
    if (!summary) return sampleDashboard();

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const latest: LatestFeedbackRow[] = (latestRes.data ?? []).map(
      (r: any) => ({
        id: r.id,
        created_at: r.created_at,
        patient_name: r.patient_name,
        mrd_number: r.mrd_number,
        staff_name: r.opd_staff?.name_en ?? "—",
        reception_rating: r.reception_rating,
        cleanliness_rating: r.cleanliness_rating,
        overall_rating: r.overall_rating,
        would_recommend: r.would_recommend,
        status: r.status,
        language: r.language,
        has_suggestion: Boolean(r.suggestions && r.suggestions.trim()),
      }),
    );

    const attention: AttentionRow[] = (attnRes.data ?? []).map((r: any) => ({
      id: r.id,
      created_at: r.created_at,
      patient_name: r.patient_name,
      mrd_number: r.mrd_number,
      mobile: r.mobile,
      staff_name: r.opd_staff?.name_en ?? "—",
      overall_rating: r.overall_rating,
      would_recommend: r.would_recommend,
      suggestions: r.suggestions,
    }));
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return {
      live: true,
      summary,
      staff: (staffRes.data as StaffSummaryRow[]) ?? [],
      daily: (dailyRes.data as DailySummaryRow[]) ?? [],
      latest,
      attention,
    };
  } catch {
    return sampleDashboard();
  }
}

// ---------------------------------------------------------------------------
// Sample data (dev preview before Supabase). Mirrors the design mockup.
// ---------------------------------------------------------------------------
function sampleDashboard(): DashboardData {
  const summary: DashboardSummary = {
    total: 1284,
    today: 47,
    avg_reception: 4.5,
    avg_billing: 4.3,
    avg_waiting: 4.1,
    avg_doctor: 4.7,
    avg_exam: 4.6,
    avg_cleanliness: 4.7,
    avg_pharmacy: 4.4,
    avg_overall: 4.6,
    pct_recommend: 93,
    pct_staff_helpful: 96,
    consultant_yes: 1001,
    consultant_no: 90,
    consultant_incomplete: 193,
    overall_dist: { "1": 26, "2": 51, "3": 116, "4": 334, "5": 757 },
    reception_dist: { "1": 39, "2": 64, "3": 128, "4": 347, "5": 706 },
    cleanliness_dist: { "1": 13, "2": 39, "3": 103, "4": 283, "5": 846 },
  };

  const staff: StaffSummaryRow[] = [
    ["Mrs. Sheela", 198, 4.8], ["Mr. Manju R", 187, 4.7], ["Ms. Kavana", 164, 4.7],
    ["Mrs. Lavanya", 151, 4.6], ["Mr. Chandru", 139, 4.4], ["Mrs. Shanthi", 132, 4.5],
    ["Mr. Manoj", 121, 4.6], ["Ms. Ashwini", 110, 4.5], ["Mrs. Shalini", 92, 4.3],
  ].map(([name, cnt, avg], i) => ({
    staff_id: `seed-${i + 1}`,
    name_en: name as string,
    name_kn: "",
    cnt: cnt as number,
    avg_overall: avg as number,
    avg_reception: Math.round(((avg as number) - 0.1) * 100) / 100,
    avg_cleanliness: Math.round(((avg as number) + 0.1) * 100) / 100,
    pct_recommend: 90 + ((i * 3) % 9),
    pct_staff_helpful: 94 + ((i * 2) % 6),
    low_count: Math.max(0, 6 - i),
    recognitions: Math.max(0, 14 - i * 2),
  }));

  const today = todayIST();
  const daily: DailySummaryRow[] = Array.from({ length: 20 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (19 - i));
    const counts = [31, 28, 35, 40, 33, 29, 44, 38, 36, 41, 47, 52, 39, 43, 46, 37, 42, 48, 45, 47];
    const avgs = [4.4, 4.5, 4.3, 4.6, 4.5, 4.4, 4.7, 4.6, 4.5, 4.6, 4.7, 4.8, 4.5, 4.6, 4.7, 4.4, 4.6, 4.7, 4.6, 4.6];
    return {
      day: d.toISOString().slice(0, 10),
      cnt: counts[i],
      avg_overall: avgs[i],
      avg_reception: avgs[i] - 0.1,
      avg_cleanliness: avgs[i] + 0.1,
      pct_recommend: 90 + (i % 8),
    };
  });

  const latest: LatestFeedbackRow[] = [
    ["Anitha Rao", "EH-24823", "Mrs. Sheela", 5, 5, 5, "yes", "resolved", "en", false],
    ["Suresh Kumar", "EH-24821", "Mr. Manoj", 4, 5, 4, "yes", "reviewed", "kn", true],
    ["Ramesh Gowda", "EH-24817", "—", 2, 3, 1, "no", "new", "en", false],
    ["Fatima Begum", "EH-24814", "Ms. Kavana", 5, 4, 5, "yes", "new", "kn", true],
    ["Vijay Hegde", "EH-24809", "Mrs. Lavanya", 4, 4, 4, "yes", "reviewed", "en", false],
    ["Lakshmi Bai", "EH-24790", "Mr. Chandru", 3, 2, 2, "no", "new", "en", false],
    ["Nagaraj S", "EH-24781", "Mr. Manju R", 5, 5, 5, "yes", "resolved", "en", false],
  ].map(([nm, mrd, st, re, cl, ov, rec, status, lang, sugg], i) => ({
    id: `sample-${i}`,
    created_at: new Date(Date.now() - i * 18 * 60000).toISOString(),
    patient_name: nm as string,
    mrd_number: mrd as string,
    staff_name: st as string,
    reception_rating: re as number,
    cleanliness_rating: cl as number,
    overall_rating: ov as number,
    would_recommend: rec as YesNo,
    status: status as FeedbackStatus,
    language: lang as Language,
    has_suggestion: sugg as boolean,
  }));

  const attention: AttentionRow[] = [
    ["Ramesh Gowda", "EH-24817", "9845011111", "Dr. Viola Dunn OPD", 1, "no", "Waited 2 hours, no one told me the doctor was delayed."],
    ["Lakshmi Bai", "EH-24790", "9845022222", "Mr. Chandru", 2, "no", "Consultant did not explain the cataract procedure clearly."],
    ["Imran Pasha", "EH-24763", "9845033333", "Mrs. Shanthi", 2, "yes", "Billing counter was slow and crowded."],
  ].map(([nm, mrd, mob, st, ov, rec, sugg], i) => ({
    id: `attn-${i}`,
    created_at: new Date(Date.now() - i * 3 * 3600000).toISOString(),
    patient_name: nm as string,
    mrd_number: mrd as string,
    mobile: mob as string,
    staff_name: st as string,
    overall_rating: ov as number,
    would_recommend: rec as YesNo,
    suggestions: sugg as string,
  }));

  return { live: false, summary, staff, daily, latest, attention };
}
