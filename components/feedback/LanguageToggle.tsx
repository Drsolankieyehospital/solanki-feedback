"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Language } from "@/types/database";

const SEGMENTS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "kn", label: "ಕನ್ನಡ" },
];

/** Compact two-segment EN | ಕನ್ನಡ control for the header. */
export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div
      className="inline-flex w-full gap-0.5 rounded-xl p-[3px]"
      style={{ background: "rgba(255,255,255,0.16)" }}
      role="radiogroup"
      aria-label="Language"
    >
      {SEGMENTS.map((s) => {
        const on = lang === s.value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setLang(s.value)}
            className={`flex-1 rounded-[9px] px-2.5 py-[9px] text-[13.5px] font-semibold transition ${
              on ? "bg-white text-primary" : "text-white/85"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
