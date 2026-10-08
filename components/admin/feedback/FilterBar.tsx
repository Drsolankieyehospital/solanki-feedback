"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

const SELECTS: { key: string; label: string; options: [string, string][] }[] = [
  {
    key: "status",
    label: "Status",
    options: [
      ["", "Any status"],
      ["new", "New"],
      ["reviewed", "Reviewed"],
      ["follow_up", "Follow-up"],
      ["resolved", "Resolved"],
    ],
  },
  {
    key: "rating",
    label: "Overall",
    options: [
      ["", "Any rating"],
      ["5", "5 ★"],
      ["4", "4 ★"],
      ["3", "3 ★"],
      ["2", "2 ★"],
      ["1", "1 ★"],
    ],
  },
  {
    key: "rec",
    label: "Recommend",
    options: [
      ["", "Recommend: any"],
      ["yes", "Would recommend"],
      ["no", "Would not"],
    ],
  },
  {
    key: "lang",
    label: "Language",
    options: [
      ["", "Any language"],
      ["en", "English"],
      ["kn", "ಕನ್ನಡ"],
    ],
  },
];

export default function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function push(mutate: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(params.toString());
    mutate(p);
    p.delete("page"); // reset to first page on any filter change
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function setParam(key: string, value: string) {
    push((p) => (value ? p.set(key, value) : p.delete(key)));
  }

  function toggle(key: string, on: boolean) {
    push((p) => (on ? p.set(key, "1") : p.delete(key)));
  }

  const hasFilters = ["status", "rating", "rec", "lang", "low", "sugg", "q"].some(
    (k) => params.get(k),
  );

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParam("q", q.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, MRD or mobile…"
          className="fb-input !min-h-0 flex-1 !py-2.5 !text-sm"
        />
        <button
          type="submit"
          className="rounded-field bg-primary px-4 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {SELECTS.map((s) => (
          <select
            key={s.key}
            value={params.get(s.key) ?? ""}
            onChange={(e) => setParam(s.key, e.target.value)}
            className="fb-input fb-select !min-h-0 w-auto !py-2 !text-[13px]"
            aria-label={s.label}
          >
            {s.options.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        ))}

        <label className="flex items-center gap-1.5 rounded-field border border-divider bg-surface px-3 py-2 text-[13px] font-medium text-ink">
          <input
            type="checkbox"
            checked={params.get("low") === "1"}
            onChange={(e) => toggle("low", e.target.checked)}
          />
          ≤ 2 ★ only
        </label>
        <label className="flex items-center gap-1.5 rounded-field border border-divider bg-surface px-3 py-2 text-[13px] font-medium text-ink">
          <input
            type="checkbox"
            checked={params.get("sugg") === "1"}
            onChange={(e) => toggle("sugg", e.target.checked)}
          />
          Has suggestion
        </label>

        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="text-[13px] font-semibold text-primary"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
