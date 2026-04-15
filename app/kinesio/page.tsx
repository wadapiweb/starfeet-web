import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { KinesioDashboard } from "@/components/kinesio/KinesioDashboard";

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
        <section className="mt-6">
          <KinesioDashboard />
        </section>
      </div>
    </main>
  );
}
