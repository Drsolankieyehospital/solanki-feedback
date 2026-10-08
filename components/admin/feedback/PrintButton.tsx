"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-field border border-divider bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink print:hidden"
    >
      Print / PDF
    </button>
  );
}
