import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ClienteOrdersDashboard } from "@/components/cliente/ClienteOrdersDashboard";

export default async function ClientePage() {
  const session = await auth();

  if (!session?.user?.isActive || session.user.sessionRevoked) {
    redirect("/api/auth/signin");
  }
  if (session.user.role !== "CLIENTE") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-32 pb-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-condensed font-black text-4xl md:text-6xl text-starfeet-blue uppercase tracking-tight">
          Mi Cuenta
        </h1>
        <p className="mt-4 text-sm md:text-base text-gray-600">
          Portal cliente para historial de compras, estado de órdenes y datos de perfil.
        </p>

        <ClienteOrdersDashboard />
      </div>
    </main>
  );
}
