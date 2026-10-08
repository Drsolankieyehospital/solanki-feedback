import { getDashboardData, resolveRange } from "@/lib/reports";
import Dashboard from "@/components/admin/dashboard/Dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const range = resolveRange(str(sp.range), str(sp.from), str(sp.to));
  const data = await getDashboardData(range);

  return <Dashboard data={data} range={range} />;
}
