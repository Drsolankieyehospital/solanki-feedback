"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LanguageProvider, useLanguage } from "@/lib/i18n/LanguageProvider";

const SUBMIT_FLAG = "fb-submitted";

function ThankYouInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const decided = useRef(false);

  // Reached only via a real submission. Direct visits bounce to the form.
  // Guarded so React StrictMode's double-invoked effect can't clear the flag
  // on the first run and then redirect on the second.
  useEffect(() => {
    if (decided.current) return;
    decided.current = true;
    let flag: string | null = null;
    try {
      flag = sessionStorage.getItem(SUBMIT_FLAG);
      if (flag) sessionStorage.removeItem(SUBMIT_FLAG);
    } catch {
      /* ignore */
    }
    if (flag) setReady(true);
    else router.replace("/");
  }, [router]);

  if (!ready) return null;

  const googleUrl = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL;

  return (
    <div className="mx-auto flex min-h-dvh max-w-form flex-col items-center justify-center px-8 text-center">
      <div className="mb-[22px] grid h-[92px] w-[92px] place-items-center rounded-full bg-ok shadow-card">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-12 w-12"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mb-2.5 font-display text-[23px] font-semibold text-ink">
        {t.thanksTitle}
      </h1>
      <p className="mb-[26px] max-w-[30ch] text-[14.5px] text-muted">
        {t.thanksBody}
      </p>

      {/* Shown to everyone — review-gating (only asking happy patients) violates
          Google's policy. */}
      {googleUrl && (
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-divider bg-surface px-5 py-3.5 text-[14.5px] font-semibold text-ink shadow-soft"
        >
          <svg viewBox="0 0 24 24" fill="var(--rating)" className="h-[19px] w-[19px]">
            <path d="M12 3.2l2.7 5.5 6.1.9-4.4 4.3 1 6L12 17l-5.4 2.9 1-6L3.2 9.6l6.1-.9z" />
          </svg>
          {t.google}
        </a>
      )}

      <div className="mt-[26px] text-xs leading-relaxed text-muted">
        <span className="font-semibold text-ink">{t.hospital}</span>
        <br />
        191/1, Link Road, 2nd Cross, Malleshwaram, Bengaluru 560003
        <br />
        080-2356 2211 · 080-2356 2299
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <LanguageProvider>
      <main className="min-h-dvh bg-canvas">
        <ThankYouInner />
      </main>
    </LanguageProvider>
  );
}
