// Patient feedback form lands here (QR target). Built out in Phase 3.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-form flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary shadow-card">
        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
          <path
            d="M12 5C6.5 5 2.7 9.2 1.5 12c1.2 2.8 5 7 10.5 7s9.3-4.2 10.5-7C21.3 9.2 17.5 5 12 5Z"
            stroke="#fff"
            strokeWidth="1.6"
          />
          <circle cx="12" cy="12" r="3.2" fill="#fff" />
        </svg>
      </div>
      <h1 className="font-display text-xl font-semibold text-ink">
        Dr. Solanki Eye Hospital
      </h1>
      <p className="text-sm text-muted">
        Patient feedback form — coming together in Phase 3.
      </p>
    </main>
  );
}
