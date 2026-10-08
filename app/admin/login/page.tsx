"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signIn, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    signIn,
    {},
  );
  const [attempts, setAttempts] = useState(0);
  const [lockLeft, setLockLeft] = useState(0);
  const nextRef = useRef<HTMLInputElement>(null);

  // carry ?next through to the server action
  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next");
    if (n && nextRef.current) nextRef.current.value = n;
  }, []);

  // count failed attempts; lock for 60s after 5
  useEffect(() => {
    if (state.error) setAttempts((a) => a + 1);
  }, [state]);

  useEffect(() => {
    if (attempts > 0 && attempts % 5 === 0) setLockLeft(60);
  }, [attempts]);

  useEffect(() => {
    if (lockLeft <= 0) return;
    const id = setInterval(() => setLockLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [lockLeft]);

  const locked = lockLeft > 0;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary shadow-card">
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
              <path
                d="M12 5C6.5 5 2.7 9.2 1.5 12c1.2 2.8 5 7 10.5 7s9.3-4.2 10.5-7C21.3 9.2 17.5 5 12 5Z"
                stroke="#fff"
                strokeWidth="1.6"
              />
              <circle cx="12" cy="12" r="3.2" fill="#fff" />
            </svg>
          </span>
          <div>
            <h1 className="font-display text-lg font-semibold text-ink">
              Dr. Solanki Eye Hospital
            </h1>
            <p className="text-[13px] text-muted">Feedback admin panel</p>
          </div>
        </div>

        <form
          action={formAction}
          className="rounded-card bg-surface p-6 shadow-card"
        >
          <input ref={nextRef} type="hidden" name="next" defaultValue="/admin" />

          <label className="fb-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="fb-input mb-4"
            placeholder="you@hospital.com"
          />

          <label className="fb-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={10}
            className="fb-input"
            placeholder="••••••••••"
          />

          {state.error && (
            <p
              role="alert"
              className="mt-4 rounded-field border-[1.5px] border-crit bg-[#FDECEC] px-3.5 py-2.5 text-[13px] font-medium text-crit"
            >
              {state.error}
            </p>
          )}

          {locked && (
            <p className="mt-4 text-[13px] font-medium text-muted">
              Too many attempts. Try again in {lockLeft}s.
            </p>
          )}

          <button
            type="submit"
            disabled={pending || locked}
            className="mt-5 flex w-full items-center justify-center rounded-field bg-primary p-3.5 font-display text-[15px] font-semibold text-white shadow-soft transition active:bg-primary-deep disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>

          <div className="mt-4 text-center">
            <Link
              href="/admin/forgot-password"
              className="text-[13px] font-semibold text-primary"
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
