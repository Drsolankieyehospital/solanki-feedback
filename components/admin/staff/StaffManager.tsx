"use client";

import { useActionState } from "react";
import { addStaff, saveStaff, type StaffActionState } from "@/app/admin/(protected)/staff/actions";
import type { StaffRow } from "@/lib/staff";

function AddForm() {
  const [state, action, pending] = useActionState<StaffActionState, FormData>(
    addStaff,
    {},
  );
  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-card bg-surface p-[18px] shadow-soft"
    >
      <div className="flex-1 min-w-[160px]">
        <label className="fb-label" htmlFor="add_en">Name (English)</label>
        <input id="add_en" name="name_en" className="fb-input" placeholder="Mr. New Staff" />
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="fb-label" htmlFor="add_kn">Name (ಕನ್ನಡ)</label>
        <input id="add_kn" name="name_kn" className="fb-input" placeholder="ಶ್ರೀ …" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-field bg-primary px-4 py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add staff"}
      </button>
      {state.error && <span className="text-[13px] font-medium text-crit">{state.error}</span>}
      {state.ok && <span className="text-[13px] font-medium text-ok">Added ✓</span>}
    </form>
  );
}

function RowForm({ staff }: { staff: StaffRow }) {
  const action = saveStaff.bind(null, staff.id);
  const [state, formAction, pending] = useActionState<StaffActionState, FormData>(
    action,
    {},
  );
  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-3 border-t border-divider px-[18px] py-3 first:border-t-0"
    >
      <input
        name="name_en"
        defaultValue={staff.name_en}
        className="fb-input !min-h-0 flex-1 !py-2 !text-sm"
        aria-label="Name (English)"
      />
      <input
        name="name_kn"
        defaultValue={staff.name_kn}
        className="fb-input !min-h-0 flex-1 !py-2 !text-sm"
        aria-label="Name (Kannada)"
      />
      <label className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
        <input type="checkbox" name="is_active" defaultChecked={staff.is_active} />
        Active
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-field border border-divider bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {state.ok && <span className="text-[12px] font-medium text-ok">✓</span>}
      {state.error && <span className="text-[12px] font-medium text-crit">{state.error}</span>}
    </form>
  );
}

export default function StaffManager({ rows }: { rows: StaffRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <AddForm />
      <div className="rounded-card bg-surface py-1 shadow-soft">
        {rows.map((s) => (
          <RowForm key={s.id} staff={s} />
        ))}
        {rows.length === 0 && (
          <p className="px-[18px] py-6 text-center text-sm text-muted">No staff yet.</p>
        )}
      </div>
    </div>
  );
}
