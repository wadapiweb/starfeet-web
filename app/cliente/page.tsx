import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ClientePage() {
  const session = await auth();

  if (!session?.user) {
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

        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">Mis pedidos</h2>
            <p className="mt-2 text-sm text-gray-600">Listado y detalle de órdenes.</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">Datos personales</h2>
            <p className="mt-2 text-sm text-gray-600">Gestión de datos y preferencias.</p>
          </article>
        </section>
      </div>
    </main>
  );
}
