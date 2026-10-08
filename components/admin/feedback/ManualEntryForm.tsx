"use client";

import { useActionState } from "react";
import {
  createManualFeedback,
  type ManualState,
} from "@/app/admin/(protected)/feedback/new/actions";
import { QUESTIONS } from "@/lib/questions";
import { en } from "@/lib/i18n/en";
import { todayIST } from "@/lib/dates";
import type { StaffOption } from "@/lib/staff";

export default function ManualEntryForm({ staff }: { staff: StaffOption[] }) {
  const [state, action, pending] = useActionState<ManualState, FormData>(
    createManualFeedback,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="rounded-card bg-surface p-[18px] shadow-soft">
        <h2 className="mb-3 font-display text-[15px] font-semibold text-ink">
          Patient details
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="fb-label" htmlFor="pn">Patient name</label>
            <input id="pn" name="patient_name" className="fb-input" required />
          </div>
          <div>
            <label className="fb-label" htmlFor="mrd">MRD number</label>
            <input id="mrd" name="mrd_number" className="fb-input" required />
          </div>
          <div>
            <label className="fb-label" htmlFor="mob">Mobile</label>
            <input id="mob" name="mobile" inputMode="numeric" maxLength={10} className="fb-input" required />
          </div>
          <div>
            <label className="fb-label" htmlFor="vd">Visit date</label>
            <input id="vd" name="visit_date" type="date" defaultValue={todayIST()} className="fb-input" required />
          </div>
          <div className="sm:col-span-2">
            <label className="fb-label" htmlFor="staff">OPD staff</label>
            <select id="staff" name="opd_staff_id" className="fb-input fb-select" defaultValue="" required>
              <option value="" disabled>Select</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name_en}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-card bg-surface p-[18px] shadow-soft">
        <h2 className="mb-3 font-display text-[15px] font-semibold text-ink">Responses</h2>
        <div className="grid gap-3">
          {QUESTIONS.map((q) => (
            <div key={q.field} className="grid items-center gap-2 sm:grid-cols-[1fr_200px]">
              <label className="text-[13.5px] text-ink" htmlFor={q.field}>
                {q.n}. {en[q.labelKey] as string}
              </label>
              {q.type === "star" && (
                <select id={q.field} name={q.field} className="fb-input fb-select !min-h-0 !py-2" defaultValue="" required>
                  <option value="" disabled>Rate 1–5</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} — {en.starWords[n - 1]}</option>
                  ))}
                </select>
              )}
              {q.type === "choice" && (
                <select id={q.field} name={q.field} className="fb-input fb-select !min-h-0 !py-2" defaultValue="" required>
                  <option value="" disabled>Select</option>
                  {q.options.map((o) => (
                    <option key={o} value={o}>{en[o]}</option>
                  ))}
                </select>
              )}
              {q.type === "text" && (
                <input id={q.field} name={q.field} className="fb-input !min-h-0 !py-2" placeholder="(optional)" />
              )}
            </div>
          ))}
          <div>
            <label className="fb-label" htmlFor="sugg">Suggestions (optional)</label>
            <textarea id="sugg" name="suggestions" rows={3} className="fb-input min-h-[80px] resize-y" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-field bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save paper entry"}
        </button>
        {state.error && <span className="text-[13px] font-medium text-crit">{state.error}</span>}
      </div>
    </form>
  );
}
