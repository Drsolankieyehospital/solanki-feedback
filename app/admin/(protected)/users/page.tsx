import { getAdminUsers } from "@/lib/users";
import UsersManager from "@/components/admin/users/UsersManager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { live, rows } = await getAdminUsers();
  return (
    <div className="flex flex-col gap-4">
      {!live && (
        <div className="rounded-field border border-divider bg-primary-tint px-4 py-2.5 text-[12.5px] font-medium text-primary">
          Showing sample users — connect Supabase to invite admins and viewers.
        </div>
      )}
      <UsersManager rows={rows} />
    </div>
  );
}
