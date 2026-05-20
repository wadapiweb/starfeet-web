import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductSingleActions } from "@/components/admin/ProductSingleActions";
import { ProductImageGallery } from "@/components/shared/ProductImageGallery";
import { getProductTypeLabel } from "@/lib/product-types";

type AdminProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default async function AdminProductDetailPage({ params }: AdminProductDetailPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
    },
    include: {
      inventories: true,
      _count: {
        select: {
          orderItems: true,
          cartItems: true,
        },
      },
    },
  });

  if (!product) notFound();

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Producto</p>
            <h2 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">{product.name}</h2>
          </div>
          <ProductSingleActions
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              description: product.description,
              type: product.type,
              priceArs: Number(product.priceArs),
              priceUsd: Number(product.priceUsd),
              compareAtPriceArs: product.compareAtPriceArs ? Number(product.compareAtPriceArs) : null,
              compareAtPriceUsd: product.compareAtPriceUsd ? Number(product.compareAtPriceUsd) : null,
              imageUrls: product.imageUrls,
              isActive: product.isActive,
              inventories: product.inventories
                .map((inventory) => ({
                  id: inventory.id,
                  sku: inventory.sku,
                  physicalSize: inventory.physicalSize,
                  color: inventory.color,
                  stock: inventory.stock,
                  lowStockThreshold: inventory.lowStockThreshold,
                  isActive: inventory.isActive,
                  sortOrder: inventory.sortOrder,
                }))
                .sort((a, b) => a.sortOrder - b.sortOrder || a.physicalSize.localeCompare(b.physicalSize)),
            }}
          />
        </div>
        <div className="mt-4">
          <ProductImageGallery images={product.imageUrls} alt={product.name} variant="detail" />
        </div>
        <p className="mt-2 text-sm uppercase text-gray-500">{getProductTypeLabel(product.type)}</p>
        <p className="mt-3 text-sm text-gray-700">{product.description ?? "Sin descripción"}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${product.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
            {product.isActive ? "Activo" : "Inactivo"}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">/{product.slug ?? product.id}</span>
          <Link
            href={`/tienda/producto/${product.slug ?? product.id}`}
            target="_blank"
            className="rounded-full border border-starfeet-blue/30 px-3 py-1 text-xs font-bold text-starfeet-blue hover:bg-starfeet-blue/5"
          >
            Ver como usuario
          </Link>
          <Link
            href="/admin/products"
            className="rounded-full border border-gray-300 px-3 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100"
          >
            Volver a productos
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Precio ARS" value={`ARS ${currencyFormatter.format(Number(product.priceArs))}`} />
        <MetricCard label="Precio USD" value={`USD ${currencyFormatter.format(Number(product.priceUsd))}`} />
        <MetricCard label="En órdenes" value={`${product._count.orderItems}`} />
        <MetricCard label="En carritos" value={`${product._count.cartItems}`} />
      </section>

      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">Variantes y stock</h3>
        <div className="mt-3 overflow-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.12em] text-gray-600">
              <tr>
                <th className="px-3 py-2">Talle</th>
                <th className="px-3 py-2">Color</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Umbral bajo stock</th>
              </tr>
            </thead>
            <tbody>
              {product.inventories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-gray-500">Sin variantes cargadas.</td>
                </tr>
              ) : (
                [...product.inventories]
                  .sort((a, b) => a.sortOrder - b.sortOrder || a.physicalSize.localeCompare(b.physicalSize))
                  .map((inventory) => (
                    <tr key={inventory.id} className="border-t border-gray-200 text-gray-700">
                      <td className="px-3 py-2 font-bold text-starfeet-blue">{inventory.physicalSize}</td>
                      <td className="px-3 py-2">{inventory.color}</td>
                      <td className="px-3 py-2 font-mono text-xs">{inventory.sku}</td>
                      <td className="px-3 py-2">{inventory.stock}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${inventory.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                          {inventory.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-3 py-2">{inventory.lowStockThreshold}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <p className="mt-2 font-condensed text-2xl font-black text-starfeet-blue">{value}</p>
    </article>
  );
}
