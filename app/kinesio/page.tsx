import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function KinesioPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }
  if (session.user.role !== "KINESIOLOGO") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-white pt-28 pb-10 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="font-condensed font-black text-4xl text-starfeet-blue uppercase tracking-tight">
          Portal Kinesio
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Vista mobile-first para seguimiento de cupones, pacientes relacionados y ganancias.
        </p>

        <section className="mt-6 space-y-3">
          {[
            "Dashboard de métricas",
            "Cupones asignados",
            "Pacientes relacionados",
            "Ganancias y liquidaciones",
          ].map((item) => (
            <article key={item} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h2 className="font-condensed font-bold text-xl text-starfeet-blue uppercase">{item}</h2>
              <p className="mt-1 text-xs text-gray-600">En construcción.</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
