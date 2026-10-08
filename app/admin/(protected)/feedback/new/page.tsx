import Link from "next/link";
import { getActiveStaff } from "@/lib/staff";
import ManualEntryForm from "@/components/admin/feedback/ManualEntryForm";

export const dynamic = "force-dynamic";

export default async function ManualEntryPage() {
  const staff = await getActiveStaff();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/feedback" className="text-[13px] font-semibold text-primary">
          ← Back to list
        </Link>
        <h1 className="font-display text-base font-semibold text-ink">
          Manual paper-form entry
        </h1>
      </div>
      <ManualEntryForm staff={staff} />
    </div>
  );
}
