"use client";

import { useActionState } from "react";
import { inviteUser, type InviteState } from "@/app/admin/(protected)/users/actions";
import type { AdminUserRow } from "@/lib/users";

function InviteForm() {
  const [state, action, pending] = useActionState<InviteState, FormData>(
    inviteUser,
    {},
  );
  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-card bg-surface p-[18px] shadow-soft"
    >
      <div className="flex-1 min-w-[150px]">
        <label className="fb-label" htmlFor="i_name">Full name</label>
        <input id="i_name" name="full_name" className="fb-input" placeholder="Jane Doe" />
      </div>
      <div className="flex-1 min-w-[180px]">
        <label className="fb-label" htmlFor="i_email">Email</label>
        <input id="i_email" name="email" type="email" className="fb-input" placeholder="jane@hospital.com" />
      </div>
      <div className="min-w-[120px]">
        <label className="fb-label" htmlFor="i_role">Role</label>
        <select id="i_role" name="role" className="fb-input fb-select" defaultValue="viewer">
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-field bg-primary px-4 py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
      >
        {pending ? "Inviting…" : "Send invite"}
      </button>
      {state.error && <span className="text-[13px] font-medium text-crit">{state.error}</span>}
      {state.ok && <span className="text-[13px] font-medium text-ok">Invite sent ✓</span>}
    </form>
  );
}

export default function UsersManager({ rows }: { rows: AdminUserRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <InviteForm />
      <div className="overflow-x-auto rounded-card bg-surface shadow-soft">
        <table className="w-full min-w-[480px] border-collapse text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="border-b border-divider px-4 py-3">Name</th>
              <th className="border-b border-divider px-4 py-3">Email</th>
              <th className="border-b border-divider px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.user_id}>
                <td className="border-b border-divider px-4 py-3 font-semibold text-ink">{u.full_name}</td>
                <td className="border-b border-divider px-4 py-3 text-muted">{u.email}</td>
                <td className="border-b border-divider px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-[3px] text-[11px] font-semibold capitalize ${u.role === "admin" ? "bg-primary-tint text-primary" : "bg-canvas text-muted"}`}
                  >
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
