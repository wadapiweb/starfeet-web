import prisma from "@/lib/prisma";
import { Hero } from "@/components/organisms/Hero";
import { ProductCard } from "@/components/molecules/ProductCard";
import { Product } from "@prisma/client";
import { Button } from "@/components/atoms/Button";

export default async function Inicio2Page() {
  const products = await prisma.product
    .findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    })
    .catch((error) => {
      console.error("Inicio2 products fallback: database unavailable", error);
      return [];
    });

  return (
    <main className="min-h-screen bg-white">
      <Hero />

      <section className="relative z-20 border-t border-gray-100 bg-white px-6 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 className="font-condensed mb-4 text-6xl font-black uppercase leading-none tracking-tighter text-starfeet-blue md:text-8xl">
                TIENDA <br />
                <span className="text-starfeet-lime">OFICIAL</span>
              </h2>
              <p className="font-sans max-w-sm text-lg font-medium uppercase tracking-widest text-starfeet-dark-100">
                Explora nuestra línea de dispositivos de reeducación biomecánica y calzado premium.
              </p>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" size="sm">
                CONOCER TODOS
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="group relative mt-32 overflow-hidden rounded-3xl bg-starfeet-blue p-12">
            <div className="pointer-events-none absolute right-0 top-0 h-full w-full -translate-x-1/2 translate-y-1/2 -rotate-12 select-none opacity-10">
              <span className="font-condensed text-[300px] font-black leading-none text-white">SF</span>
            </div>

            <div className="relative z-10 grid grid-cols-1 items-center gap-12 md:grid-cols-2">
              <div>
                <h3 className="font-condensed mb-4 text-5xl font-black uppercase tracking-tighter text-white md:text-6xl">
                  ¿SOS PROFESIONAL?
                </h3>
                <p className="font-sans max-w-md font-normal text-gray-300">
                  Sumate a nuestra red de kinesiólogos y distribuidores oficiales. Ofrecemos herramientas técnicas y soporte especializado.
                </p>
              </div>
              <div className="flex md:justify-end">
                <Button variant="primary">REGISTRARSE</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="mb-6 font-condensed text-3xl font-black tracking-tighter text-starfeet-blue opacity-20">
            STARFEET
          </div>
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
            © 2026 Starfeet Tech • Buenos Aires, Argentina
          </p>
        </div>
      </footer>
    </main>
  );
}
