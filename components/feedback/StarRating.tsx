"use client";

import { useRef } from "react";

interface StarRatingProps {
  value: number; // 0 = unset, 1..5
  onChange: (v: number) => void;
  groupLabel: string;
  starWords: readonly string[];
  tapHint: string;
  invalid?: boolean;
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden="true">
      <path
        d="M12 3.2l2.7 5.5 6.1.9-4.4 4.3 1 6L12 17l-5.4 2.9 1-6L3.2 9.6l6.1-.9z"
        className={filled ? "fill-rating" : "fill-rating-empty"}
        style={{ transition: "fill .12s" }}
      />
    </svg>
  );
}

/**
 * Accessible 1-5 star rating as a radio group. Tapping star N fills 1..N;
 * tapping the same star again does not clear it (avoids accidental zero).
 * Arrow keys move the selection. Each star has a >=44px tap target.
 */
export default function StarRating({
  value,
  onChange,
  groupLabel,
  starWords,
  tapHint,
  invalid,
}: StarRatingProps) {
  const btns = useRef<(HTMLButtonElement | null)[]>([]);

  function buzz() {
    try {
      navigator.vibrate?.(8);
    } catch {
      /* unsupported */
    }
  }

  function set(v: number) {
    onChange(v);
    buzz();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const v = Math.min(5, (value || 0) + 1);
      set(v);
      btns.current[v - 1]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      const v = Math.max(1, (value || 1) - 1);
      set(v);
      btns.current[v - 1]?.focus();
    }
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label={groupLabel}
        onKeyDown={onKey}
        className="flex gap-1.5"
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const checked = value === i;
          return (
            <button
              key={i}
              ref={(el) => {
                btns.current[i - 1] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={`${i} of 5${starWords[i - 1] ? `, ${starWords[i - 1]}` : ""}`}
              tabIndex={checked || (!value && i === 1) ? 0 : -1}
              onClick={() => set(i)}
              className="grid h-[52px] w-[52px] place-items-center rounded-xl active:scale-95"
              style={{ transition: "transform .1s" }}
            >
              <Star filled={value >= i} />
            </button>
          );
        })}
      </div>
      <div
        className={`mt-2 min-h-[19px] text-[13px] font-semibold ${
          value ? "text-primary" : "font-medium text-muted"
        } ${invalid && !value ? "text-crit" : ""}`}
      >
        {value ? `${value} · ${starWords[value - 1]}` : tapHint}
      </div>
    </div>
  );
}
