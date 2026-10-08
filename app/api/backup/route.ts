import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getAdmin, authConfigured } from "@/lib/auth";
import { getExportRows } from "@/lib/feedback-list";
import { getAllStaff } from "@/lib/staff";
import { buildCsv } from "@/lib/export";
import { createClient } from "@/lib/supabase/server";
import { todayIST, formatIST } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/backup — admin-only in-app backup: a ZIP of feedback.csv/json,
// opd_staff.json and a README. Logged to audit_log.
export async function GET() {
  const admin = await getAdmin();
  if (!admin || admin.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const [{ rows }, { rows: staff }] = await Promise.all([
    getExportRows({}),
    getAllStaff(),
  ]);

  const zip = new JSZip();
  zip.file("feedback.csv", buildCsv(rows));
  zip.file("feedback.json", JSON.stringify(rows, null, 2));
  zip.file("opd_staff.json", JSON.stringify(staff, null, 2));
  zip.file(
    "README.txt",
    [
      "Dr. Solanki Eye Hospital — Feedback backup",
      `Generated: ${formatIST(new Date())} IST`,
      `Feedback rows: ${rows.length}`,
      `OPD staff: ${staff.length}`,
      "",
      "Files:",
      "  feedback.csv   — all feedback (UTF-8 with BOM; opens in Excel)",
      "  feedback.json  — all feedback as JSON",
      "  opd_staff.json — OPD staff list",
      "",
      "Restore runbook: docs/restore.md in the project repository.",
    ].join("\n"),
  );

  const buf = await zip.generateAsync({ type: "nodebuffer" });

  if (authConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.from("audit_log").insert({
        action: "backup_download",
        user_id: admin.userId,
        details: { feedback_rows: rows.length, staff: staff.length },
      });
    } catch {
      /* best-effort */
    }
  }

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="solanki-feedback-backup_${todayIST()}.zip"`,
    },
  });
}
