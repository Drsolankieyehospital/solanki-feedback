"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestReset, type ResetState } from "./actions";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    requestReset,
    {},
  );

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-5 py-10">
      <div className="w-full max-w-[400px]">
        <form
          action={formAction}
          className="rounded-card bg-surface p-6 shadow-card"
        >
          <h1 className="mb-1 font-display text-lg font-semibold text-ink">
            Reset your password
          </h1>
          <p className="mb-5 text-[13px] text-muted">
            We&apos;ll email you a link to set a new password.
          </p>

          {state.sent ? (
            <p
              role="status"
              className="rounded-field border-[1.5px] border-ok bg-[#E8F6EF] px-3.5 py-3 text-[13px] font-medium text-ok"
            >
              If that email is registered, a reset link is on its way.
            </p>
          ) : (
            <>
              <label className="fb-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                className="fb-input"
                placeholder="you@hospital.com"
              />

              {state.error && (
                <p
                  role="alert"
                  className="mt-4 rounded-field border-[1.5px] border-crit bg-[#FDECEC] px-3.5 py-2.5 text-[13px] font-medium text-crit"
                >
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="mt-5 flex w-full items-center justify-center rounded-field bg-primary p-3.5 font-display text-[15px] font-semibold text-white shadow-soft transition active:bg-primary-deep disabled:opacity-60"
              >
                {pending ? "Sending…" : "Send reset link"}
              </button>
            </>
          )}

          <div className="mt-4 text-center">
            <Link href="/admin/login" className="text-[13px] font-semibold text-primary">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
