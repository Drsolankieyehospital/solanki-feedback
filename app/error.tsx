"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
      <div className="font-display text-2xl font-semibold text-ink">
        Something went wrong
      </div>
      <p className="max-w-sm text-sm text-muted">
        Please try again. If this keeps happening, contact the hospital office.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-field bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft"
      >
        Try again
      </button>
    </main>
  );
}
