"use client";

import { useActionState } from "react";
import {
  updateFeedback,
  type UpdateState,
} from "@/app/admin/(protected)/feedback/[id]/actions";
import type { FeedbackStatus } from "@/types/database";

const OPTIONS: [FeedbackStatus, string][] = [
  ["new", "New"],
  ["reviewed", "Reviewed"],
  ["follow_up", "Follow-up"],
  ["resolved", "Resolved"],
];

export default function StatusEditor({
  id,
  status,
  notes,
}: {
  id: string;
  status: FeedbackStatus;
  notes: string | null;
}) {
  const action = updateFeedback.bind(null, id);
  const [state, formAction, pending] = useActionState<UpdateState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className="fb-label" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="fb-input fb-select"
        >
          {OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="fb-label" htmlFor="admin_notes">
          Admin notes
        </label>
        <textarea
          id="admin_notes"
          name="admin_notes"
          defaultValue={notes ?? ""}
          rows={3}
          className="fb-input min-h-[88px] resize-y"
          placeholder="Internal note for follow-up…"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-field bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {state.ok && <span className="text-[13px] font-medium text-ok">Saved ✓</span>}
        {state.error && (
          <span className="text-[13px] font-medium text-crit">{state.error}</span>
        )}
      </div>
    </form>
  );
}
