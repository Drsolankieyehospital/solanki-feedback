export default function PagePlaceholder({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="max-w-sm rounded-card bg-surface p-8 text-center shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-muted">Coming in {phase}.</p>
      </div>
    </div>
  );
}
