import { AdminCouponsManager } from "@/components/admin/AdminCouponsManager";

type AdminCouponsPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function AdminCouponsPage({ searchParams }: AdminCouponsPageProps) {
  const query = await searchParams;
  return <AdminCouponsManager initialEdit={query.edit ?? null} />;
}
