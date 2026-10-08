import type { FeedbackStatus } from "@/types/database";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-card bg-surface p-[18px] shadow-soft ${className}`}>
      {children}
    </section>
  );
}

export function CardHead({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <h2 className="font-display text-[15px] font-semibold text-ink">{title}</h2>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

/** Small inline star row for tables / lists. */
export function Stars({ value }: { value: number }) {
  return (
    <span
      className="whitespace-nowrap text-[12px] tracking-[1px] text-rating"
      aria-label={`${value} of 5`}
    >
      {"★".repeat(value)}
      <span className="text-rating-empty">{"★".repeat(5 - value)}</span>
    </span>
  );
}

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  new: "bg-[#FBE9E9] text-crit",
  reviewed: "bg-primary-tint text-primary",
  follow_up: "bg-[#FDF0DC] text-[#C77700]",
  resolved: "bg-[#E8F6EF] text-ok",
};

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  follow_up: "Follow-up",
  resolved: "Resolved",
};

export function StatusPill({ status }: { status: FeedbackStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-semibold ${STATUS_STYLES[status]}`}
    >
      <span className="h-[7px] w-[7px] rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
