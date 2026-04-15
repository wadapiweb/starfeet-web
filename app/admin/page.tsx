import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminCouponsManager } from "@/components/admin/AdminCouponsManager";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-32 pb-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-condensed font-black text-4xl md:text-6xl text-starfeet-blue uppercase tracking-tight">
          Panel Admin
        </h1>
        <p className="mt-4 text-sm md:text-base text-gray-600 max-w-2xl">
          Acceso central a ventas, cupones, envíos, leads, campañas y finanzas. Esta pantalla es el scaffold
          inicial para el módulo administrativo.
        </p>

        <AdminCouponsManager />
      </div>
    </main>
  );
}
