import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { getProductTypeLabel } from "@/lib/product-types";

type TiendaPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

function formatCurrency(amount: unknown) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export default async function TiendaPage({ searchParams }: TiendaPageProps) {
  const session = await auth();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = resolvedSearchParams?.q?.trim().toLowerCase() ?? "";

  const products = await prisma.product
    .findMany({
      where: {
        isActive: true,
        ...(query
          ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 48,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        type: true,
        imageUrls: true,
        priceArs: true,
        compareAtPriceArs: true,
        inventories: {
          select: {
            id: true,
            stock: true,
            isActive: true,
            physicalSize: true,
            color: true,
            sortOrder: true,
          },
        },
      },
    })
    .catch((error) => {
      console.error("Tienda fallback: database unavailable", error);
      return [];
    });

  const visibleProducts = products.map((product) => ({
    ...product,
    activeInventories: [...product.inventories].filter((inventory) => inventory.isActive && inventory.stock > 0),
  }));

  return (
    <main className="min-h-screen bg-white pt-32 pb-16 px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-condensed text-5xl font-black uppercase tracking-tight text-starfeet-blue md:text-7xl">
              Tienda Starfeet
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-600 md:text-base">
              Catálogo de productos disponibles. Entrá al detalle para ver variantes y agregar al carrito.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Sesión</p>
            <p className="mt-1 text-sm font-semibold text-gray-700">
              {session?.user?.email ? `Ingresaste como ${session.user.email}` : "Compra como invitado o iniciá sesión"}
            </p>
          </div>
        </header>

        {query ? (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Resultados para <span className="font-bold text-starfeet-blue">“{query}”</span>
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => {
            const productUrl = `/tienda/producto/${product.slug ?? product.id}`;
            const primaryImage = product.imageUrls[0];
            return (
              <article key={product.id} className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <Link href={productUrl} className="block">
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    {primaryImage ? (
                      <Image src={primaryImage} alt={product.name} fill className="object-cover transition duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">Sin imagen</div>
                    )}
                    {product.compareAtPriceArs ? (
                      <span className="absolute left-4 top-4 rounded-full bg-starfeet-lime px-3 py-1 text-[10px] font-black uppercase tracking-widest text-starfeet-blue">
                        Oferta
                      </span>
                    ) : null}
                    {product.activeInventories.length === 0 ? (
                      <span className="absolute right-4 top-4 rounded-full bg-gray-900/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                        Sin stock
                      </span>
                    ) : null}
                  </div>
                </Link>

                <div className="space-y-4 p-5">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                      {getProductTypeLabel(product.type)}
                    </p>
                    <h2 className="mt-1 font-condensed text-2xl font-black uppercase tracking-tight text-starfeet-blue">
                      {product.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      {product.description ?? "Producto disponible en stock activo."}
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-4">
                    <div>
                      {product.compareAtPriceArs ? (
                        <p className="text-xs text-gray-400 line-through">{formatCurrency(product.compareAtPriceArs)}</p>
                      ) : null}
                      <p className="font-condensed text-2xl font-black uppercase leading-none text-starfeet-blue">
                        {formatCurrency(product.priceArs)}
                      </p>
                    </div>
                    <p className="text-right text-[11px] font-bold uppercase tracking-widest text-gray-500">
                      {product.activeInventories.length} variantes activas
                    </p>
                  </div>

                  <Link
                    href={productUrl}
                    className="block rounded-xl bg-starfeet-blue px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-white transition hover:bg-starfeet-lime hover:text-starfeet-blue"
                  >
                    Ver detalle
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        {visibleProducts.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
            <p className="text-lg font-bold text-starfeet-blue">No hay productos publicados.</p>
            <p className="mt-2 text-sm text-gray-500">
              Cuando haya productos activos, van a aparecer acá como catálogo.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
