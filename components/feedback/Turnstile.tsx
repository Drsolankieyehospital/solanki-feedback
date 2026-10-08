"use client";

import { useEffect, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: any) => string;
      remove: (id: string) => void;
    };
  }
}

const SCRIPT_ID = "cf-turnstile";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

/**
 * Cloudflare Turnstile. Renders nothing (and requires no token) until
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is set — so the form works in dev without keys.
 */
export default function Turnstile({
  onToken,
}: {
  onToken: (token: string) => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;

    function render() {
      if (!window.turnstile || !ref.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: (t: string) => onToken(t),
        "error-callback": () => onToken(""),
        "expired-callback": () => onToken(""),
        theme: "light",
      });
    }

    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      render();
    }

    return () => {
      try {
        if (widgetId.current) window.turnstile?.remove(widgetId.current);
      } catch {
        /* ignore */
      }
      widgetId.current = null;
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return <div ref={ref} className="my-1 flex justify-center" />;
}
