import { AdminProfessionalsManager } from "@/components/admin/AdminProfessionalsManager";

type AdminProfessionalsPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function AdminProfessionalsPage({ searchParams }: AdminProfessionalsPageProps) {
  const query = await searchParams;
  return <AdminProfessionalsManager initialEdit={query.edit ?? null} />;
}
