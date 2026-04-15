import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

type TiendaProductoPageProps = {
  params: Promise<{ slug: string }>;
};

const numberFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default async function TiendaProductoPage({ params }: TiendaProductoPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [{ slug }, { id: slug }],
    },
    include: {
      inventories: {
        orderBy: { physicalSize: "asc" },
      },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white px-6 pb-16 pt-32">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Producto</p>
          <h1 className="mt-2 font-condensed text-5xl font-black uppercase tracking-tight text-starfeet-blue">
            {product.name}
          </h1>
          <p className="mt-2 text-sm uppercase text-gray-500">{product.type}</p>

          <p className="mt-4 text-base text-gray-700">{product.description ?? "Sin descripción"}</p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            <article className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Precio ARS</p>
              <p className="mt-1 text-2xl font-black text-starfeet-blue">ARS {numberFormatter.format(Number(product.priceArs))}</p>
            </article>
            <article className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Precio USD</p>
              <p className="mt-1 text-2xl font-black text-starfeet-blue">USD {numberFormatter.format(Number(product.priceUsd))}</p>
            </article>
          </div>

          <article className="mt-4 rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Stock por talle</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.inventories.map((inventory) => (
                <span
                  key={inventory.id}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${inventory.stock > inventory.lowStockThreshold ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                >
                  {inventory.physicalSize}: {inventory.stock}
                </span>
              ))}
            </div>
          </article>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/tienda"
              className="cursor-pointer rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white"
            >
              Ir a tienda
            </Link>
            <Link
              href="/"
              className="cursor-pointer rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100"
            >
              Volver al home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
