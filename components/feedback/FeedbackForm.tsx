"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { QUESTIONS } from "@/lib/questions";
import { feedbackSchema, type FeedbackInput } from "@/lib/validation/feedback";
import type { StringKey } from "@/lib/i18n/en";
import type { StaffOption } from "@/lib/staff";
import { todayIST, daysAgoIST } from "@/lib/dates";
import FormHeader from "./FormHeader";
import FormFooter from "./FormFooter";
import StarRating from "./StarRating";
import ChoiceGroup from "./ChoiceGroup";
import Turnstile from "./Turnstile";

const DRAFT_KEY = "fb-draft";

// Order used to scroll to the first error.
const FIELD_ORDER: (keyof FeedbackInput)[] = [
  "patient_name",
  "mrd_number",
  "mobile",
  "visit_date",
  "opd_staff_id",
  ...QUESTIONS.map((q) => q.field as keyof FeedbackInput),
];

export default function FeedbackForm({ staff }: { staff: StaffOption[] }) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const today = todayIST();
  const [suggLen, setSuggLen] = useState(0);
  const [token, setToken] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      patient_name: "",
      mrd_number: "",
      mobile: "",
      visit_date: today,
      opd_staff_id: "",
      employee_recognition: "",
      suggestions: "",
      language: lang,
      source: "qr",
    },
  });

  // keep language in the payload current
  useEffect(() => {
    setValue("language", lang);
  }, [lang, setValue]);

  // capture ?src=<location> from the QR URL
  useEffect(() => {
    const src = new URLSearchParams(window.location.search).get("src");
    if (src) setValue("source", src.slice(0, 60));
  }, [setValue]);

  // Restore an in-progress draft (survives an accidental back-swipe).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) reset({ ...(JSON.parse(raw) as Partial<FeedbackInput>) });
    } catch {
      /* ignore */
    }
  }, [reset]);

  // Autosave draft to sessionStorage as the patient fills the form.
  useEffect(() => {
    const sub = watch((values) => {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      } catch {
        /* ignore */
      }
    });
    return () => sub.unsubscribe();
  }, [watch]);

  const handleToken = useCallback((tk: string) => setToken(tk), []);

  const err = (key: keyof FeedbackInput) => {
    const m = errors[key]?.message as StringKey | undefined;
    return m ? t[m] ?? t.errRequired : null;
  };

  function onInvalid() {
    const first = FIELD_ORDER.find((f) => errors[f]);
    if (!first) return;
    const el = document.getElementById(`field-${first}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.querySelector<HTMLElement>("input,select,button")?.focus({
      preventScroll: true,
    });
  }

  async function onValid(data: FeedbackInput) {
    setSubmitError(null);
    const payload = {
      ...data,
      turnstileToken: token || undefined,
      website: honeypotRef.current?.value ?? "",
    };
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (res.ok && json.ok) {
        try {
          sessionStorage.setItem("fb-submitted", "1");
          sessionStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        router.replace("/thank-you");
        return;
      }
      setSubmitError(res.status === 429 ? t.errRate : t.errSubmit);
    } catch {
      setSubmitError(t.errSubmit);
    }
    window.scrollTo({ top: document.body.scrollHeight });
  }

  const invalidCls = (f: keyof FeedbackInput) =>
    errors[f] ? "fb-field-invalid" : "";

  return (
    <div className="mx-auto max-w-form">
      <FormHeader />

      <form
        ref={formRef}
        onSubmit={handleSubmit(onValid, onInvalid)}
        noValidate
        className="relative z-10 -mt-9 flex flex-col gap-3.5 px-3.5 pb-32"
      >
        {/* honeypot (hidden) — bots fill it, humans never see it */}
        <input
          ref={honeypotRef}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />

        {/* ---- patient details ---- */}
        <div className="fb-card shadow-card">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-[15px] w-[15px] text-primary"
            >
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
            </svg>
            {t.yourDetails}
          </div>

          <div id="field-patient_name" className={`mt-0 ${invalidCls("patient_name")}`}>
            <label className="fb-label" htmlFor="patient_name">
              {t.patientName} <span className="text-crit">*</span>
            </label>
            <input
              id="patient_name"
              className="fb-input"
              type="text"
              autoComplete="name"
              placeholder={t.phName}
              {...register("patient_name")}
            />
            {err("patient_name") && <p className="fb-err">{err("patient_name")}</p>}
          </div>

          <div id="field-mrd_number" className={`mt-[13px] ${invalidCls("mrd_number")}`}>
            <label className="fb-label" htmlFor="mrd_number">
              {t.mrd} <span className="text-crit">*</span>
            </label>
            <input
              id="mrd_number"
              className="fb-input"
              type="text"
              autoCapitalize="characters"
              placeholder={t.phMrd}
              {...register("mrd_number")}
            />
            {err("mrd_number") && <p className="fb-err">{err("mrd_number")}</p>}
          </div>

          <div id="field-mobile" className={`mt-[13px] ${invalidCls("mobile")}`}>
            <label className="fb-label" htmlFor="mobile">
              {t.mobile} <span className="text-crit">*</span>
            </label>
            <input
              id="mobile"
              className="fb-input"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder={t.phMobile}
              {...register("mobile", {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                },
              })}
            />
            {err("mobile") && <p className="fb-err">{err("mobile")}</p>}
          </div>

          <div id="field-visit_date" className={`mt-[13px] ${invalidCls("visit_date")}`}>
            <label className="fb-label" htmlFor="visit_date">
              {t.date} <span className="text-crit">*</span>
            </label>
            <input
              id="visit_date"
              className="fb-input"
              type="date"
              min={daysAgoIST(7)}
              max={today}
              {...register("visit_date")}
            />
            {err("visit_date") && <p className="fb-err">{err("visit_date")}</p>}
          </div>

          <div id="field-opd_staff_id" className={`mt-[13px] ${invalidCls("opd_staff_id")}`}>
            <label className="fb-label" htmlFor="opd_staff_id">
              {t.opdStaff} <span className="text-crit">*</span>
            </label>
            <select
              id="opd_staff_id"
              className="fb-input fb-select"
              defaultValue=""
              {...register("opd_staff_id")}
            >
              <option value="" disabled>
                {t.select}
              </option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {lang === "kn" ? s.name_kn : s.name_en}
                </option>
              ))}
            </select>
            {err("opd_staff_id") && <p className="fb-err">{err("opd_staff_id")}</p>}
          </div>
        </div>

        {/* ---- questions ---- */}
        {QUESTIONS.map((q) => {
          const field = q.field as keyof FeedbackInput;
          const value = watch(field);
          const qLabel = t[q.labelKey] as string;
          return (
            <div key={q.field} id={`field-${q.field}`} className="fb-card">
              <div className="flex items-center gap-2.5">
                <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-[9px] bg-primary-tint font-display text-[13px] font-bold text-primary">
                  {q.n}
                </span>
                <span className="font-display text-[14.5px] font-semibold leading-tight">
                  {qLabel}
                </span>
                {q.type === "text" ? (
                  <span className="text-xs font-medium text-muted">{t.optional}</span>
                ) : (
                  <span className="text-crit">*</span>
                )}
              </div>

              <div className="mt-3">
                {q.type === "star" && (
                  <StarRating
                    value={(value as number) || 0}
                    onChange={(v) =>
                      setValue(field, v as never, { shouldValidate: true })
                    }
                    groupLabel={qLabel}
                    starWords={t.starWords}
                    tapHint={t.tapStar}
                    invalid={!!errors[field]}
                  />
                )}

                {q.type === "choice" && (
                  <ChoiceGroup
                    value={(value as string) || null}
                    onChange={(v) =>
                      setValue(field, v as never, { shouldValidate: true })
                    }
                    groupLabel={qLabel}
                    options={q.options.map((o) => ({ value: o, label: t[o] }))}
                  />
                )}

                {q.type === "text" && (
                  <input
                    className="fb-input"
                    type="text"
                    maxLength={q.max}
                    placeholder={t.recoPh}
                    {...register("employee_recognition")}
                  />
                )}
              </div>

              {errors[field] && q.type !== "text" && (
                <p className="fb-err">
                  {q.type === "star" ? t.errRating : t.errChoice}
                </p>
              )}
            </div>
          );
        })}

        {/* ---- suggestions ---- */}
        <div className="fb-card">
          <div className="flex items-center gap-2">
            <span className="font-display text-[14.5px] font-semibold leading-tight">
              {t.suggestions}
            </span>
            <span className="text-xs font-medium text-muted">{t.optional}</span>
          </div>
          <textarea
            className="fb-input mt-3 min-h-[108px] resize-y leading-relaxed"
            maxLength={2000}
            placeholder={t.phSugg}
            {...register("suggestions", {
              onChange: (e) => setSuggLen(e.target.value.length),
            })}
          />
          <div className="mt-1.5 text-right text-[11px] tabular-nums text-muted">
            {2000 - suggLen} {t.charsLeft}
          </div>
        </div>

        {/* ---- consent ---- */}
        <div className="flex items-start gap-2.5 px-1 text-[11.5px] leading-relaxed text-muted">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="mt-0.5 h-4 w-4 flex-none text-primary"
          >
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <span>{t.consent}</span>
        </div>

        {/* bot protection (renders only when a site key is configured) */}
        <Turnstile onToken={handleToken} />

        {submitError && (
          <div
            role="alert"
            className="rounded-field border-[1.5px] border-crit bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-crit"
          >
            {submitError}
          </div>
        )}

        <FormFooter />
      </form>

      {/* ---- sticky submit ---- */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-form px-3.5"
        style={{
          paddingTop: 14,
          paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
          background:
            "linear-gradient(to top, var(--canvas) 72%, transparent)",
        }}
      >
        <button
          type="button"
          onClick={handleSubmit(onValid, onInvalid)}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2.5 rounded-[15px] bg-primary p-4 font-display text-base font-semibold text-white shadow-card transition active:bg-primary-deep disabled:opacity-75"
        >
          {isSubmitting ? (
            <>
              <span className="fb-spin h-[18px] w-[18px] rounded-full border-[2.5px] border-white/40 border-t-white" />
              {t.sending}
            </>
          ) : (
            <>
              {t.submit}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-[19px] w-[19px]"
              >
                <path d="M5 12h14m-6-6l6 6-6 6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
