"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { RangePreset } from "@/lib/reports";

const OPTIONS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "month", label: "This month" },
];

export default function DateRangePicker({ current }: { current: RangePreset }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function select(value: RangePreset) {
    const next = new URLSearchParams(params.toString());
    next.set("range", value);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="inline-flex rounded-xl bg-primary-tint p-[3px]">
      {OPTIONS.map((o) => {
        const on = current === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => select(o.value)}
            className={`whitespace-nowrap rounded-[9px] px-3 py-[7px] text-[12.5px] font-semibold transition ${
              on ? "bg-surface text-primary shadow-soft" : "text-muted"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
