import { createClient } from "@/lib/supabase/server";
import { authConfigured } from "@/lib/auth";
import type {
  Feedback,
  FeedbackStatus,
  YesNo,
  ConsultantInfo,
  Language,
} from "@/types/database";

export const PAGE_SIZE = 25;

export interface FeedbackFilters {
  q?: string;
  from?: string;
  to?: string;
  staff?: string[];
  rating?: number[]; // overall rating values
  low?: boolean; // overall <= 2
  rec?: YesNo;
  consult?: ConsultantInfo;
  lang?: Language;
  source?: string;
  status?: FeedbackStatus;
  hasSuggestion?: boolean;
  hasRecognition?: boolean;
  sort?: "date" | "overall" | "staff";
  dir?: "asc" | "desc";
  page?: number;
}

export interface FeedbackListRow {
  id: string;
  created_at: string;
  visit_date: string;
  patient_name: string;
  mrd_number: string;
  mobile: string;
  staff_name: string;
  reception_rating: number;
  cleanliness_rating: number;
  overall_rating: number;
  would_recommend: YesNo;
  status: FeedbackStatus;
  language: Language;
  has_suggestion: boolean;
}

export interface FeedbackListResult {
  live: boolean;
  rows: FeedbackListRow[];
  total: number;
  page: number;
  pages: number;
}

/** Parse URL search params into feedback filters (shared by list + export). */
export function parseFeedbackFilters(
  sp: Record<string, string | string[] | undefined>,
): FeedbackFilters {
  const one = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const ratingStr = one(sp.rating);
  return {
    q: one(sp.q),
    from: one(sp.from),
    to: one(sp.to),
    staff: one(sp.staff)?.split(",").filter(Boolean),
    rating: ratingStr ? [Number(ratingStr)] : undefined,
    low: one(sp.low) === "1",
    rec: one(sp.rec) as FeedbackFilters["rec"],
    consult: one(sp.consult) as FeedbackFilters["consult"],
    lang: one(sp.lang) as FeedbackFilters["lang"],
    source: one(sp.source),
    status: one(sp.status) as FeedbackFilters["status"],
    hasSuggestion: one(sp.sugg) === "1",
    hasRecognition: one(sp.recog) === "1",
    sort: (one(sp.sort) as FeedbackFilters["sort"]) ?? "date",
    dir: (one(sp.dir) as "asc" | "desc") ?? "desc",
    page: Number(one(sp.page) ?? "1") || 1,
  };
}

/** Mask a mobile number for the viewer role: 98xxxxxx29. */
export function maskMobile(m: string): string {
  if (m.length < 4) return "••••";
  return `${m.slice(0, 2)}xxxxxx${m.slice(-2)}`;
}

// ---------------------------------------------------------------------------
export async function getFeedbackList(
  f: FeedbackFilters,
): Promise<FeedbackListResult> {
  const page = Math.max(1, f.page ?? 1);
  if (!authConfigured()) return sampleList(f, page);

  try {
    const supabase = await createClient();
    let query = supabase
      .from("feedback")
      .select(
        "id, created_at, visit_date, patient_name, mrd_number, mobile, reception_rating, cleanliness_rating, overall_rating, would_recommend, status, language, suggestions, opd_staff:opd_staff_id(name_en)",
        { count: "exact" },
      );

    if (f.q) {
      const q = f.q.replace(/[%,]/g, " ").trim();
      query = query.or(
        `patient_name.ilike.%${q}%,mrd_number.ilike.%${q}%,mobile.ilike.%${q}%`,
      );
    }
    if (f.from) query = query.gte("visit_date", f.from);
    if (f.to) query = query.lte("visit_date", f.to);
    if (f.staff?.length) query = query.in("opd_staff_id", f.staff);
    if (f.low) query = query.lte("overall_rating", 2);
    else if (f.rating?.length) query = query.in("overall_rating", f.rating);
    if (f.rec) query = query.eq("would_recommend", f.rec);
    if (f.consult) query = query.eq("consultant_info", f.consult);
    if (f.lang) query = query.eq("language", f.lang);
    if (f.source) query = query.eq("source", f.source);
    if (f.status) query = query.eq("status", f.status);
    if (f.hasSuggestion) query = query.not("suggestions", "is", null);
    if (f.hasRecognition) query = query.not("employee_recognition", "is", null);

    const col =
      f.sort === "overall"
        ? "overall_rating"
        : f.sort === "staff"
          ? "opd_staff_id"
          : "created_at";
    query = query.order(col, { ascending: f.dir === "asc" });

    query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    const { data, count, error } = await query;
    if (error) return sampleList(f, page);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const rows: FeedbackListRow[] = (data ?? []).map((r: any) => ({
      id: r.id,
      created_at: r.created_at,
      visit_date: r.visit_date,
      patient_name: r.patient_name,
      mrd_number: r.mrd_number,
      mobile: r.mobile,
      staff_name: r.opd_staff?.name_en ?? "—",
      reception_rating: r.reception_rating,
      cleanliness_rating: r.cleanliness_rating,
      overall_rating: r.overall_rating,
      would_recommend: r.would_recommend,
      status: r.status,
      language: r.language,
      has_suggestion: Boolean(r.suggestions && r.suggestions.trim()),
    }));
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const total = count ?? rows.length;
    return { live: true, rows, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
  } catch {
    return sampleList(f, page);
  }
}

export interface ExportRow extends Feedback {
  staff_name: string;
}

/** All rows matching the filters (no pagination) for CSV/XLSX export. */
export async function getExportRows(f: FeedbackFilters): Promise<{
  live: boolean;
  rows: ExportRow[];
}> {
  if (!authConfigured()) return { live: false, rows: sampleExportRows(f) };
  try {
    const supabase = await createClient();
    let query = supabase
      .from("feedback")
      .select("*, opd_staff:opd_staff_id(name_en)");

    if (f.q) {
      const q = f.q.replace(/[%,]/g, " ").trim();
      query = query.or(
        `patient_name.ilike.%${q}%,mrd_number.ilike.%${q}%,mobile.ilike.%${q}%`,
      );
    }
    if (f.from) query = query.gte("visit_date", f.from);
    if (f.to) query = query.lte("visit_date", f.to);
    if (f.staff?.length) query = query.in("opd_staff_id", f.staff);
    if (f.low) query = query.lte("overall_rating", 2);
    else if (f.rating?.length) query = query.in("overall_rating", f.rating);
    if (f.rec) query = query.eq("would_recommend", f.rec);
    if (f.consult) query = query.eq("consultant_info", f.consult);
    if (f.lang) query = query.eq("language", f.lang);
    if (f.source) query = query.eq("source", f.source);
    if (f.status) query = query.eq("status", f.status);
    if (f.hasSuggestion) query = query.not("suggestions", "is", null);
    if (f.hasRecognition) query = query.not("employee_recognition", "is", null);
    query = query.order("created_at", { ascending: false }).limit(10000);

    const { data, error } = await query;
    if (error) return { live: false, rows: sampleExportRows(f) };
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const rows: ExportRow[] = (data ?? []).map((r: any) => ({
      ...(r as Feedback),
      staff_name: r.opd_staff?.name_en ?? "—",
    }));
    /* eslint-enable @typescript-eslint/no-explicit-any */
    return { live: true, rows };
  } catch {
    return { live: false, rows: sampleExportRows(f) };
  }
}

function sampleExportRows(f: FeedbackFilters): ExportRow[] {
  return sampleList({ ...f, page: 1 }, 1).rows.concat(
    sampleList({ ...f, page: 2 }, 2).rows,
  ).map((r) => ({
    id: r.id,
    created_at: r.created_at,
    visit_date: r.visit_date,
    patient_name: r.patient_name,
    mrd_number: r.mrd_number,
    mobile: r.mobile,
    opd_staff_id: "seed-1",
    reception_rating: r.reception_rating,
    billing_rating: 4,
    waiting_rating: 3,
    consultant_info: r.overall_rating <= 2 ? "no" : "yes",
    doctor_rating: r.overall_rating,
    exam_rating: 4,
    cleanliness_rating: r.cleanliness_rating,
    pharmacy_rating: 4,
    staff_helpful: "yes",
    overall_rating: r.overall_rating,
    employee_recognition: null,
    would_recommend: r.would_recommend,
    suggestions: r.has_suggestion ? "Please add more seating." : null,
    language: r.language,
    source: "reception",
    ip_hash: null,
    device_hash: null,
    client_hash: null,
    status: r.status,
    admin_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    staff_name: r.staff_name,
  }));
}

export interface FeedbackDetail extends Feedback {
  staff_name: string;
  history: {
    id: string;
    visit_date: string;
    overall_rating: number;
    status: FeedbackStatus;
  }[];
}

export async function getFeedbackDetail(
  id: string,
): Promise<FeedbackDetail | null> {
  if (!authConfigured()) return sampleDetail(id);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("feedback")
      .select("*, opd_staff:opd_staff_id(name_en)")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const row = data as any;
    const { data: hist } = await supabase
      .from("feedback")
      .select("id, visit_date, overall_rating, status")
      .eq("mrd_number", row.mrd_number)
      .neq("id", id)
      .order("visit_date", { ascending: false })
      .limit(10);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return {
      ...(row as Feedback),
      staff_name: row.opd_staff?.name_en ?? "—",
      history: hist ?? [],
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sample data for dev preview.
// ---------------------------------------------------------------------------
const SAMPLE_STAFF = [
  "Mrs. Sheela", "Mr. Manju R", "Ms. Kavana", "Mrs. Lavanya",
  "Mr. Chandru", "Mrs. Shanthi", "Mr. Manoj", "Ms. Ashwini", "Mrs. Shalini",
];
const SAMPLE_NAMES = [
  "Anitha Rao", "Suresh Kumar", "Ramesh Gowda", "Fatima Begum", "Vijay Hegde",
  "Lakshmi Bai", "Nagaraj S", "Imran Pasha", "Deepa Nair", "Harish Rai",
  "Sunita Devi", "Mohan Das", "Kavya Shetty", "Arjun Prabhu", "Rekha Jain",
];

function makeSampleRows(): FeedbackListRow[] {
  const statuses: FeedbackStatus[] = ["new", "reviewed", "follow_up", "resolved"];
  return Array.from({ length: 42 }).map((_, i) => {
    const overall = ((i * 7) % 5) + 1;
    return {
      id: `sample-${i}`,
      created_at: new Date(Date.now() - i * 95 * 60000).toISOString(),
      visit_date: new Date(Date.now() - i * 95 * 60000).toISOString().slice(0, 10),
      patient_name: SAMPLE_NAMES[i % SAMPLE_NAMES.length],
      mrd_number: `EH-${24823 - i}`,
      mobile: `98${String(45000000 + i * 137).slice(0, 8)}`,
      staff_name: SAMPLE_STAFF[i % SAMPLE_STAFF.length],
      reception_rating: ((i * 3) % 5) + 1,
      cleanliness_rating: ((i * 2) % 5) + 1,
      overall_rating: overall,
      would_recommend: overall >= 3 ? "yes" : "no",
      status: statuses[i % statuses.length],
      language: i % 3 === 0 ? "kn" : "en",
      has_suggestion: i % 4 === 0,
    };
  });
}

function sampleList(f: FeedbackFilters, page: number): FeedbackListResult {
  let rows = makeSampleRows();
  if (f.q) {
    const q = f.q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.patient_name.toLowerCase().includes(q) ||
        r.mrd_number.toLowerCase().includes(q) ||
        r.mobile.includes(q),
    );
  }
  if (f.staff?.length) rows = rows.filter((r) => f.staff!.includes(r.staff_name));
  if (f.low) rows = rows.filter((r) => r.overall_rating <= 2);
  else if (f.rating?.length) rows = rows.filter((r) => f.rating!.includes(r.overall_rating));
  if (f.rec) rows = rows.filter((r) => r.would_recommend === f.rec);
  if (f.lang) rows = rows.filter((r) => r.language === f.lang);
  if (f.status) rows = rows.filter((r) => r.status === f.status);
  if (f.hasSuggestion) rows = rows.filter((r) => r.has_suggestion);

  rows.sort((a, b) => {
    const dir = f.dir === "asc" ? 1 : -1;
    if (f.sort === "overall") return (a.overall_rating - b.overall_rating) * dir;
    if (f.sort === "staff") return a.staff_name.localeCompare(b.staff_name) * dir;
    const cmp = a.created_at < b.created_at ? -1 : 1;
    return cmp * dir;
  });

  const total = rows.length;
  const start = (page - 1) * PAGE_SIZE;
  return {
    live: false,
    rows: rows.slice(start, start + PAGE_SIZE),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

function sampleDetail(id: string): FeedbackDetail {
  const base = makeSampleRows().find((r) => r.id === id) ?? makeSampleRows()[0];
  return {
    id: base.id,
    created_at: base.created_at,
    visit_date: base.visit_date,
    patient_name: base.patient_name,
    mrd_number: base.mrd_number,
    mobile: base.mobile,
    opd_staff_id: "seed-1",
    reception_rating: base.reception_rating,
    billing_rating: 4,
    waiting_rating: 3,
    consultant_info: base.overall_rating <= 2 ? "no" : "yes",
    doctor_rating: base.overall_rating,
    exam_rating: 4,
    cleanliness_rating: base.cleanliness_rating,
    pharmacy_rating: 4,
    staff_helpful: "yes",
    overall_rating: base.overall_rating,
    employee_recognition:
      base.overall_rating === 5 ? "Mrs. Sheela was very patient and kind." : null,
    would_recommend: base.would_recommend,
    suggestions: base.has_suggestion
      ? "Please add more seating in the waiting area."
      : null,
    language: base.language,
    source: "reception",
    ip_hash: null,
    device_hash: null,
    client_hash: null,
    status: base.status,
    admin_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    staff_name: base.staff_name,
    history: [
      { id: "h1", visit_date: "2026-08-14", overall_rating: 4, status: "resolved" },
      { id: "h2", visit_date: "2026-05-02", overall_rating: 5, status: "resolved" },
    ],
  };
}
