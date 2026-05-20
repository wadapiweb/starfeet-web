import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { ProductDetail, type ProductDetailProduct } from "@/components/organisms/ProductDetail";
import { getAdminSizingSettings } from "@/lib/admin-settings.server";
import { createDefaultProductSizingMatrix } from "@/lib/product-sizing";

type TiendaProductoPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TiendaProductoPage({ params }: TiendaProductoPageProps) {
  const { slug } = await params;
  const session = await auth();

  const [product, sizing] = await Promise.all([
    prisma.product.findFirst({
      where: {
        isActive: true,
        OR: [{ slug }, { id: slug }],
      },
      include: {
        inventories: true,
      },
    }),
    getAdminSizingSettings().catch((error) => {
      console.error("Tienda producto fallback: sizing settings unavailable", error);
      return createDefaultProductSizingMatrix();
    }),
  ]);

  if (!product) {
    notFound();
  }

  // Serialización para evitar el error de objetos Decimal/Date en Client Components
  const serializedProduct = {
    ...product,
    priceArs: product.priceArs.toNumber(),
    priceUsd: product.priceUsd.toNumber(),
    compareAtPriceArs: product.compareAtPriceArs?.toNumber() || null,
    compareAtPriceUsd: product.compareAtPriceUsd?.toNumber() || null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    inventories: product.inventories.map(inv => ({
      ...inv,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
    })).sort((a, b) => a.sortOrder - b.sortOrder || a.physicalSize.localeCompare(b.physicalSize))
  };

  const detailProduct: ProductDetailProduct = {
    id: serializedProduct.id,
    name: serializedProduct.name,
    description: serializedProduct.description,
    imageUrls: serializedProduct.imageUrls,
    priceArs: serializedProduct.priceArs,
    priceUsd: serializedProduct.priceUsd,
    inventories: serializedProduct.inventories.map((inventory) => ({
      id: inventory.id,
      physicalSize: inventory.physicalSize,
      color: inventory.color,
      stock: inventory.stock,
      lowStockThreshold: inventory.lowStockThreshold,
      isActive: inventory.isActive,
      sortOrder: inventory.sortOrder,
    })),
  };

  return (
    <main className="min-h-screen bg-white pt-24">
      <ProductDetail product={detailProduct} sizing={sizing} prefillEmail={session?.user?.email ?? ""} />
    </main>
  );
}
