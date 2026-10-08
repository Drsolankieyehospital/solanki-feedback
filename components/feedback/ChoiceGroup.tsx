"use client";

interface ChoiceOption {
  value: string;
  label: string;
}

interface ChoiceGroupProps {
  value: string | null;
  onChange: (v: string) => void;
  options: ChoiceOption[];
  groupLabel: string;
}

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[17px] w-[17px]"
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

/** Yes / No / Incomplete pills as a radio group; selected fills brand ink. */
export default function ChoiceGroup({
  value,
  onChange,
  options,
  groupLabel,
}: ChoiceGroupProps) {
  function buzz() {
    try {
      navigator.vibrate?.(8);
    } catch {
      /* unsupported */
    }
  }

  return (
    <div role="radiogroup" aria-label={groupLabel} className="flex flex-wrap gap-[9px]">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => {
              onChange(o.value);
              buzz();
            }}
            className={`flex min-w-[84px] flex-1 items-center justify-center gap-1.5 rounded-field border-[1.5px] px-2.5 py-[13px] text-sm font-semibold transition ${
              on
                ? "border-primary bg-primary text-white"
                : "border-divider bg-surface text-ink"
            }`}
          >
            {on && <Check />}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
