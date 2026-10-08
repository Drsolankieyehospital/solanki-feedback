import ExcelJS from "exceljs";
import { formatIST } from "@/lib/dates";
import type { ExportRow } from "@/lib/feedback-list";

interface Column {
  header: string;
  get: (r: ExportRow) => string | number;
}

export const EXPORT_COLUMNS: Column[] = [
  { header: "Submitted at (IST)", get: (r) => formatIST(r.created_at) },
  { header: "Visit date", get: (r) => r.visit_date },
  { header: "Patient name", get: (r) => r.patient_name },
  { header: "MRD", get: (r) => r.mrd_number },
  { header: "Mobile", get: (r) => r.mobile },
  { header: "OPD staff", get: (r) => r.staff_name },
  { header: "Reception (1-5)", get: (r) => r.reception_rating },
  { header: "Registration/billing (1-5)", get: (r) => r.billing_rating },
  { header: "Waiting time (1-5)", get: (r) => r.waiting_rating },
  { header: "Consultant info", get: (r) => r.consultant_info },
  { header: "Doctor (1-5)", get: (r) => r.doctor_rating },
  { header: "Eye exam (1-5)", get: (r) => r.exam_rating },
  { header: "Cleanliness (1-5)", get: (r) => r.cleanliness_rating },
  { header: "Pharmacy/optical (1-5)", get: (r) => r.pharmacy_rating },
  { header: "Staff helpful", get: (r) => r.staff_helpful },
  { header: "Employee recognition", get: (r) => r.employee_recognition ?? "" },
  { header: "Would recommend", get: (r) => r.would_recommend },
  { header: "Overall (1-5)", get: (r) => r.overall_rating },
  { header: "Suggestions", get: (r) => r.suggestions ?? "" },
  { header: "Language", get: (r) => r.language },
  { header: "Source", get: (r) => r.source },
  { header: "Status", get: (r) => r.status },
  { header: "Admin notes", get: (r) => r.admin_notes ?? "" },
];

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** UTF-8 CSV with BOM so Kannada opens correctly in Excel. */
export function buildCsv(rows: ExportRow[]): string {
  const header = EXPORT_COLUMNS.map((c) => csvCell(c.header)).join(",");
  const body = rows
    .map((r) => EXPORT_COLUMNS.map((c) => csvCell(c.get(r))).join(","))
    .join("\n");
  return "﻿" + header + "\n" + body;
}

interface Summary {
  total: number;
  avgOverall: number;
  avgReception: number;
  avgCleanliness: number;
  pctRecommend: number;
  pctHelpful: number;
  consultantYes: number;
  consultantNo: number;
  consultantIncomplete: number;
  staff: { name: string; count: number; avgOverall: number }[];
}

function summarise(rows: ExportRow[]): Summary {
  const n = rows.length || 1;
  const avg = (pick: (r: ExportRow) => number) =>
    Math.round((rows.reduce((s, r) => s + pick(r), 0) / n) * 100) / 100;
  const pct = (pred: (r: ExportRow) => boolean) =>
    Math.round((rows.filter(pred).length / n) * 1000) / 10;

  const byStaff = new Map<string, { count: number; sum: number }>();
  for (const r of rows) {
    const b = byStaff.get(r.staff_name) ?? { count: 0, sum: 0 };
    b.count++;
    b.sum += r.overall_rating;
    byStaff.set(r.staff_name, b);
  }

  return {
    total: rows.length,
    avgOverall: avg((r) => r.overall_rating),
    avgReception: avg((r) => r.reception_rating),
    avgCleanliness: avg((r) => r.cleanliness_rating),
    pctRecommend: pct((r) => r.would_recommend === "yes"),
    pctHelpful: pct((r) => r.staff_helpful === "yes"),
    consultantYes: rows.filter((r) => r.consultant_info === "yes").length,
    consultantNo: rows.filter((r) => r.consultant_info === "no").length,
    consultantIncomplete: rows.filter((r) => r.consultant_info === "incomplete").length,
    staff: [...byStaff.entries()]
      .map(([name, b]) => ({
        name,
        count: b.count,
        avgOverall: Math.round((b.sum / b.count) * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count),
  };
}

/** Two-sheet workbook: "Feedback" (rows) + "Summary" (metrics + staff). */
export async function buildXlsx(
  rows: ExportRow[],
  rangeLabel: string,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Dr. Solanki Eye Hospital Feedback";
  wb.created = new Date();

  const ws = wb.addWorksheet("Feedback");
  ws.columns = EXPORT_COLUMNS.map((c) => ({
    header: c.header,
    key: c.header,
    width: Math.min(40, Math.max(12, c.header.length + 2)),
  }));
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const r of rows) {
    const obj: Record<string, string | number> = {};
    for (const c of EXPORT_COLUMNS) obj[c.header] = c.get(r);
    ws.addRow(obj);
  }

  const s = summarise(rows);
  const sum = wb.addWorksheet("Summary");
  sum.columns = [{ width: 28 }, { width: 18 }, { width: 14 }];
  const add = (a: string, b?: string | number, c?: string | number) =>
    sum.addRow([a, b ?? "", c ?? ""]);
  add(`Feedback summary — ${rangeLabel}`).font = { bold: true, size: 13 };
  add("");
  add("Total responses", s.total);
  add("Average overall", s.avgOverall);
  add("Average reception", s.avgReception);
  add("Average cleanliness", s.avgCleanliness);
  add("% would recommend", s.pctRecommend);
  add("% staff helpful", s.pctHelpful);
  add("Consultant — Yes", s.consultantYes);
  add("Consultant — Incomplete", s.consultantIncomplete);
  add("Consultant — No", s.consultantNo);
  add("");
  const staffHead = add("OPD staff", "Count", "Avg overall");
  staffHead.font = { bold: true };
  for (const st of s.staff) add(st.name, st.count, st.avgOverall);

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
