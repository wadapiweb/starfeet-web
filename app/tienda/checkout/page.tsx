import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ShopCheckoutFlow } from "@/components/shop/ShopCheckoutFlow";
import { getAdminPaymentSettings } from "@/lib/admin-settings.server";

export default async function TiendaCheckoutPage() {
  const session = await auth();
  const [products, paymentSettings] = await Promise.all([
    prisma.product
      .findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 48,
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          imageUrls: true,
          priceArs: true,
          priceUsd: true,
          inventories: {
            select: {
              id: true,
              physicalSize: true,
              color: true,
              stock: true,
              lowStockThreshold: true,
              isActive: true,
              sortOrder: true,
            },
          },
        },
      })
      .catch((error) => {
        console.error("Tienda checkout fallback: database unavailable", error);
        return [];
      }),
    getAdminPaymentSettings().catch((error) => {
      console.error("Tienda checkout fallback: payment settings unavailable", error);
      return {
        defaultPaymentProvider: "MERCADOPAGO" as const,
        providers: ["MERCADOPAGO", "TRANSFERENCIA"] as const,
        enabled: {
          mercadopago: true,
          transfer: true,
          paypal: false,
        },
      };
    }),
  ]);

  const normalizedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    type: product.type,
    imageUrls: product.imageUrls,
    priceArs: Number(product.priceArs),
    priceUsd: Number(product.priceUsd),
    inventories: product.inventories
      .map((inventory) => ({
        id: inventory.id,
        physicalSize: inventory.physicalSize,
        color: inventory.color,
        stock: inventory.stock,
        lowStockThreshold: inventory.lowStockThreshold,
        isActive: inventory.isActive,
        sortOrder: inventory.sortOrder,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.physicalSize.localeCompare(b.physicalSize) || a.color.localeCompare(b.color)),
  }));

  return (
    <main className="min-h-screen bg-white pt-32 pb-16 px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <h1 className="font-condensed text-5xl font-black uppercase tracking-tight text-starfeet-blue md:text-7xl">
            Carrito y checkout
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-600 md:text-base">
            Revisá tu carrito, ajustá cantidades y completá la compra.
          </p>
        </header>

        <ShopCheckoutFlow
          products={normalizedProducts}
          prefillEmail={session?.user?.email ?? ""}
          paymentProviders={paymentSettings.providers as Array<"MERCADOPAGO" | "TRANSFERENCIA" | "PAYPAL">}
          defaultPaymentProvider={paymentSettings.defaultPaymentProvider as "MERCADOPAGO" | "TRANSFERENCIA" | "PAYPAL"}
          compactCheckout
        />
      </div>
    </main>
  );
}
