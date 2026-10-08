"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export default function QrPoster() {
  const [origin, setOrigin] = useState("");
  const [location, setLocation] = useState("Reception");
  const [qr, setQr] = useState("");

  useEffect(() => {
    setOrigin(
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin,
    );
  }, []);

  const slug = slugify(location);
  const url = origin
    ? `${origin}/${slug ? `?src=${slug}` : ""}`
    : "";

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 520, margin: 1, errorCorrectionLevel: "M" })
      .then(setQr)
      .catch(() => setQr(""));
  }, [url]);

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      {/* controls */}
      <div className="flex flex-col gap-4 print:hidden">
        <div className="rounded-card bg-surface p-[18px] shadow-soft">
          <label className="fb-label" htmlFor="loc">
            QR placement / location
          </label>
          <input
            id="loc"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Reception, OPD waiting, Pharmacy"
            className="fb-input"
          />
          <p className="mt-2 text-[11.5px] text-muted">
            This is saved on each submission (as <code>src</code>) so you learn
            which placement works.
          </p>

          <div className="mt-4">
            <div className="fb-label">Link</div>
            <div className="break-all rounded-field border border-divider bg-canvas px-3 py-2 text-[12px] text-ink">
              {url || "…"}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={qr || undefined}
              download={`qr-${slug || "feedback"}.png`}
              aria-disabled={!qr}
              className={`rounded-field bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft ${!qr ? "pointer-events-none opacity-50" : ""}`}
            >
              Download QR (PNG)
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-field border border-divider bg-surface px-4 py-2.5 text-sm font-semibold text-ink"
            >
              Print poster
            </button>
          </div>
        </div>
      </div>

      {/* A5 poster preview */}
      <div className="flex justify-center">
        <div
          className="flex w-full max-w-[420px] flex-col items-center rounded-card border border-divider bg-white p-8 text-center shadow-soft"
          style={{ aspectRatio: "148 / 210" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                <path
                  d="M12 5C6.5 5 2.7 9.2 1.5 12c1.2 2.8 5 7 10.5 7s9.3-4.2 10.5-7C21.3 9.2 17.5 5 12 5Z"
                  stroke="#fff"
                  strokeWidth="1.6"
                />
                <circle cx="12" cy="12" r="3.2" fill="#fff" />
              </svg>
            </span>
            <div className="text-left">
              <div className="font-display text-[15px] font-bold leading-tight text-ink">
                Dr. Solanki Eye Hospital
              </div>
              <div className="text-[11px] text-muted">Malleshwaram, Bengaluru</div>
            </div>
          </div>

          <div className="mt-6 font-display text-[22px] font-bold leading-snug text-primary">
            Share your feedback
          </div>
          <div className="font-display text-[18px] font-semibold leading-snug text-ink">
            ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ತಿಳಿಸಿ
          </div>

          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt="Feedback QR code"
              className="mt-5 h-[220px] w-[220px]"
            />
          ) : (
            <div className="mt-5 grid h-[220px] w-[220px] place-items-center text-muted">
              Generating…
            </div>
          )}

          <div className="mt-3 text-[12px] font-medium text-ink">
            Scan with your phone camera
          </div>
          <div className="mt-auto pt-6 text-[10px] leading-relaxed text-muted">
            191/1, Link Road, 2nd Cross, Malleshwaram, Bengaluru 560003
            <br />
            080-2356 2211 · 080-2356 2299
          </div>
        </div>
      </div>
    </div>
  );
}
