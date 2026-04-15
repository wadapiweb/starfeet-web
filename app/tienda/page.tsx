import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ShopCheckoutFlow } from "@/components/shop/ShopCheckoutFlow";

export default async function TiendaPage() {
  const session = await auth();
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

  const normalizedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    type: product.type,
    priceArs: Number(product.priceArs),
    priceUsd: Number(product.priceUsd),
  }));

  return (
    <main className="min-h-screen bg-white pt-32 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="font-condensed font-black text-5xl md:text-7xl text-starfeet-blue uppercase tracking-tight">
            Tienda Starfeet
          </h1>
          <p className="mt-3 text-sm md:text-base text-gray-600">
            Catálogo + flujo de carrito/checkout para comprador registrado o invitado.
          </p>
        </header>
        <ShopCheckoutFlow products={normalizedProducts} prefillEmail={session?.user?.email ?? ""} />
      </div>
    </main>
  );
}
