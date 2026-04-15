import prisma from "../lib/prisma";
import { Hero } from "../components/organisms/Hero";
import { ProductCard } from "../components/molecules/ProductCard";
import { Product } from "@prisma/client";
import { Button } from "../components/atoms/Button";

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 8
  });

  return (
    <main className="min-h-screen bg-white">
      {/* SECCIÓN HERO CON SCROLLYTELLING */}
      <Hero />

      {/* SECCIÓN PRODUCTOS DESTACADOS */}
      <section className="relative z-20 py-32 bg-white px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">

          {/* HEADER SECCIÓN TIENDA */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="max-w-xl">
              <h2 className="font-condensed font-black text-6xl md:text-8xl text-starfeet-blue leading-none mb-4 uppercase tracking-tighter">
                TIENDA <br /><span className="text-starfeet-lime">OFICIAL</span>
              </h2>
              <p className="font-sans font-medium text-lg text-starfeet-dark-100 uppercase tracking-widest max-w-sm">
                Explora nuestra línea de dispositivos de reeducación biomecánica y calzado premium.
              </p>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" size="sm">
                CONOCER TODOS
              </Button>
            </div>
          </div>

          {/* GRID DE PRODUCTOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* CTA SECCIÓN INFO */}
          <div className="mt-32 p-12 bg-starfeet-blue rounded-3xl overflow-hidden relative group">
            {/* Abstract pattern bg */}
            <div className="absolute top-0 right-0 w-full h-full opacity-10 -rotate-12 translate-x-1/2 translate-y-1/2 pointer-events-none select-none">
              <span className="font-condensed font-black text-[300px] text-white leading-none">SF</span>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 items-center gap-12">
              <div>
                <h3 className="font-condensed font-black text-5xl md:text-6xl text-white mb-4 uppercase tracking-tighter">
                  ¿SOS PROFESIONAL?
                </h3>
                <p className="font-sans font-normal text-gray-300 max-w-md">
                  Sumate a nuestra red de kinesiólogos y distribuidores oficiales. Ofrecemos herramientas técnicas y soporte especializado.
                </p>
              </div>
              <div className="flex md:justify-end">
                <Button variant="primary">
                  REGISTRARSE
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER SIMPLE */}
      <footer className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="font-condensed font-black text-3xl text-starfeet-blue mb-6 tracking-tighter opacity-20">
            STARFEET
          </div>
          <p className="font-sans text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
            © 2026 Starfeet Tech • Buenos Aires, Argentina
          </p>
        </div>
      </footer>
    </main>
  );
}
