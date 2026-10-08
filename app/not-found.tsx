import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
      <div className="font-display text-5xl font-bold text-primary">404</div>
      <p className="text-sm text-muted">This page could not be found.</p>
      <Link
        href="/"
        className="mt-2 rounded-field bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft"
      >
        Go to the feedback form
      </Link>
    </main>
  );
}
