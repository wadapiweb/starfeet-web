import { AdminProductsManager } from "@/components/admin/AdminProductsManager";

type AdminProductsPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const query = await searchParams;
  return <AdminProductsManager initialEdit={query.edit ?? null} />;
}
