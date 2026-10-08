import { getAllStaff } from "@/lib/staff";
import StaffManager from "@/components/admin/staff/StaffManager";

export const dynamic = "force-dynamic";

export default async function StaffAdminPage() {
  const { live, rows } = await getAllStaff();
  return (
    <div className="flex flex-col gap-4">
      {!live && (
        <div className="rounded-field border border-divider bg-primary-tint px-4 py-2.5 text-[12.5px] font-medium text-primary">
          Showing the seed staff — connect Supabase to add, rename or deactivate
          staff. Changes won&apos;t persist until then.
        </div>
      )}
      <StaffManager rows={rows} />
    </div>
  );
}
