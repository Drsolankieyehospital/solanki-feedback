import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <AdminShell admin={admin} signOutAction={signOut}>
      {children}
    </AdminShell>
  );
}
