"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { GroupBy } from "@/lib/reports";

const OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export default function GroupByPicker({ current }: { current: GroupBy }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function select(value: GroupBy) {
    const p = new URLSearchParams(params.toString());
    p.set("group", value);
    router.push(`${pathname}?${p.toString()}`);
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
            className={`rounded-[9px] px-3 py-[7px] text-[12.5px] font-semibold transition ${
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
