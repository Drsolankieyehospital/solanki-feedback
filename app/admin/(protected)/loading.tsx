export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="h-8 w-48 rounded-lg bg-divider" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-card bg-surface shadow-soft" />
        ))}
      </div>
      <div className="h-64 rounded-card bg-surface shadow-soft" />
      <div className="h-80 rounded-card bg-surface shadow-soft" />
    </div>
  );
}
