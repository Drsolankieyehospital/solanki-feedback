import { NextResponse, type NextRequest } from "next/server";
import { getAdmin, authConfigured } from "@/lib/auth";
import { getExportRows, parseFeedbackFilters } from "@/lib/feedback-list";
import { buildCsv, buildXlsx } from "@/lib/export";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/export?<filters>&format=csv|xlsx — admin only; exports the current
// filtered view and writes an audit_log row.
export async function GET(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin || admin.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const format = sp.format === "xlsx" ? "xlsx" : "csv";
  const filters = parseFeedbackFilters(sp);
  const { rows } = await getExportRows(filters);

  const from = filters.from ?? "all";
  const to = filters.to ?? "all";
  const base = `solanki-feedback_${from}_to_${to}`;

  if (authConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.from("audit_log").insert({
        action: format === "xlsx" ? "export_xlsx" : "export_csv",
        user_id: admin.userId,
        details: { ...filters, count: rows.length },
      });
    } catch {
      /* audit is best-effort */
    }
  }

  if (format === "xlsx") {
    const buf = await buildXlsx(rows, `${from} to ${to}`);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${base}.xlsx"`,
      },
    });
  }

  return new NextResponse(buildCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${base}.csv"`,
    },
  });
}
