import { auth } from "@/auth";
import { redirect } from "next/navigation";

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

        <section className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {["Ventas", "Cupones", "Envíos", "Leads", "Campañas", "Usuarios"].map((item) => (
            <article key={item} className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">{item}</h2>
              <p className="mt-2 text-sm text-gray-600">Módulo en etapa de implementación.</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
