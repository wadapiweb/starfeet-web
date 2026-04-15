import prisma from "@/lib/prisma";
import { ProductCard } from "@/components/molecules/ProductCard";
import { Product } from "@prisma/client";

export default async function TiendaPage() {
  const products = await prisma.product
    .findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 24,
    })
    .catch((error) => {
      console.error("Tienda fallback: database unavailable", error);
      return [];
    });

  return (
    <main className="min-h-screen bg-white pt-32 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="font-condensed font-black text-5xl md:text-7xl text-starfeet-blue uppercase tracking-tight">
            Tienda Starfeet
          </h1>
          <p className="mt-3 text-sm md:text-base text-gray-600">
            Catálogo completo de productos y accesorios.
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      </div>
    </main>
  );
}
