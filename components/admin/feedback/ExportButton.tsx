"use client";

import { useSearchParams } from "next/navigation";

/** Exports exactly the current filtered view as CSV or XLSX (admin only). */
export default function ExportButton() {
  const params = useSearchParams();

  const href = (format: "csv" | "xlsx") => {
    const p = new URLSearchParams(params.toString());
    p.delete("page");
    p.set("format", format);
    return `/api/export?${p.toString()}`;
  };

  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline">Export:</span>
      <a
        href={href("csv")}
        className="rounded-lg border border-divider bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-primary-tint"
      >
        CSV
      </a>
      <a
        href={href("xlsx")}
        className="rounded-lg border border-divider bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-primary-tint"
      >
        Excel
      </a>
    </div>
  );
}
