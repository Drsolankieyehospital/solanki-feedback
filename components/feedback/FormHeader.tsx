"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import LanguageToggle from "./LanguageToggle";

/** Blue header band with logo, NABH badge, language toggle, title + intro. */
export default function FormHeader() {
  const { t } = useLanguage();
  return (
    <header
      className="relative overflow-hidden px-5 pb-[54px] text-white"
      style={{
        paddingTop: "calc(18px + env(safe-area-inset-top, 0px))",
        background:
          "linear-gradient(160deg, var(--primary-soft), var(--primary) 60%, var(--primary-deep))",
      }}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
        viewBox="0 0 480 220"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M-40 160 Q120 60 260 140 T520 90"
          stroke="var(--primary-soft)"
          strokeWidth="40"
          fill="none"
          opacity="0.35"
        />
        <path
          d="M-40 210 Q160 120 320 190 T540 150"
          stroke="#fff"
          strokeWidth="30"
          fill="none"
          opacity="0.08"
        />
      </svg>

      <div className="relative z-10 flex items-center gap-3">
        <span
          className="grid h-11 w-11 flex-none place-items-center rounded-[13px]"
          style={{ background: "rgba(255,255,255,0.16)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-[26px] w-[26px]">
            <path
              d="M12 5C6.5 5 2.7 9.2 1.5 12c1.2 2.8 5 7 10.5 7s9.3-4.2 10.5-7C21.3 9.2 17.5 5 12 5Z"
              stroke="#fff"
              strokeWidth="1.6"
            />
            <circle cx="12" cy="12" r="3.2" fill="#fff" />
          </svg>
        </span>
        <div className="font-display text-[15px] font-semibold leading-tight">
          {t.hospital}
          <span className="block text-[11px] font-normal opacity-85">
            {t.location}
          </span>
        </div>
        <span
          className="ml-auto flex-none rounded-lg border border-white/35 px-[7px] py-1 text-center text-[9.5px] font-semibold leading-tight opacity-90"
          aria-label={t.nabh}
        >
          NABH
          <br />
          Accredited
        </span>
      </div>

      <div className="relative z-10 my-[14px] mt-4">
        <LanguageToggle />
      </div>

      <h1 className="relative z-10 text-balance font-display text-[21px] font-bold tracking-tight">
        {t.title}
      </h1>
      <p className="relative z-10 mt-1.5 max-w-[38ch] text-[12.5px] opacity-90">
        {t.intro}
      </p>
    </header>
  );
}
