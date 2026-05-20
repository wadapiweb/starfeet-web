"use client";

import { DropdownSelect } from "@/components/atoms/DropdownSelect";
import { ProductImageGallery } from "@/components/shared/ProductImageGallery";
import { getProductTypeLabel, type ProductTypeValue } from "@/lib/product-types";
import { clearCartSession, getStoredCartSession, saveCartSession } from "@/lib/cart-session.client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type ShopProduct = {
  id: string;
  name: string;
  type: ProductTypeValue;
  description: string | null;
  imageUrls: string[];
  priceArs: number;
  priceUsd: number;
  inventories: Array<{
    id: string;
    physicalSize: "S" | "M" | "L";
    color: string;
    stock: number;
    lowStockThreshold: number;
    isActive: boolean;
    sortOrder: number;
  }>;
};

type CartItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  gender: "MALE" | "FEMALE" | "UNISEX" | null;
  size: string | null;
  product: {
    id: string;
    name: string;
    imageUrls?: string[];
  };
  inventory: null | {
    id: string;
    physicalSize: "S" | "M" | "L";
    color: string;
  };
};

type CartData = {
  id: string;
  status: string;
  currency: "ARS" | "USD";
  customerEmail: string;
  coupon: null | {
    code: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
  };
  items: CartItem[];
};

export function ShopCheckoutFlow({
  products,
  prefillEmail,
  paymentProviders,
  defaultPaymentProvider,
  compactCheckout = false,
}: {
  products: ShopProduct[];
  prefillEmail?: string;
  paymentProviders: Array<"MERCADOPAGO" | "TRANSFERENCIA" | "PAYPAL">;
  defaultPaymentProvider: "MERCADOPAGO" | "TRANSFERENCIA" | "PAYPAL";
  compactCheckout?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const [cart, setCart] = useState<CartData | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [paymentProvider, setPaymentProvider] = useState(
    paymentProviders.includes(defaultPaymentProvider) ? defaultPaymentProvider : paymentProviders[0] ?? "MERCADOPAGO",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<string, string>>({});
  const [storedCartId, setStoredCartId] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);
  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [],
  );

  const subtotal = useMemo(
    () => (cart?.items ?? []).reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0),
    [cart],
  );

  const discount = useMemo(() => {
    if (!cart?.coupon) return 0;
    if (cart.coupon.discountType === "PERCENTAGE") {
      return (subtotal * cart.coupon.discountValue) / 100;
    }
    return cart.coupon.discountValue;
  }, [cart, subtotal]);

  const total = Math.max(0, subtotal - discount);

  useEffect(() => {
    const stored = getStoredCartSession();
    setStoredCartId(stored?.cartId ?? null);

    if (stored?.cartId && !cart?.id) {
      refreshCart(stored.cartId).catch(() => {
        clearCartSession();
        setStoredCartId(null);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getActiveVariants(product: ShopProduct) {
    return [...product.inventories]
      .filter((inventory) => inventory.isActive && Number(inventory.stock) > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.physicalSize.localeCompare(b.physicalSize) || a.color.localeCompare(b.color));
  }

  function getSelectedVariantId(product: ShopProduct) {
    const activeVariants = getActiveVariants(product);
    const selected = selectedVariantByProduct[product.id];
    if (selected && activeVariants.some((variant) => variant.id === selected)) {
      return selected;
    }
    return activeVariants[0]?.id ?? "";
  }

  async function withErrorHandling<T>(fn: () => Promise<T>) {
    setError(null);
    setMessage(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      return null;
    }
  }

  async function ensureCart() {
    if (cart) return cart;
    const stored = getStoredCartSession();
    if (stored?.cartId) {
      try {
        const res = await fetch(`/api/v1/shop/cart/${stored.cartId}`, { cache: "no-store" });
        const json = await res.json();
        if (res.ok) {
          const loaded = json.cart as CartData;
          setCart(loaded);
          if (!email.trim()) {
            setEmail(stored.customerEmail);
          }
          return loaded;
        }
      } catch {
        clearCartSession();
      }
    }

    if (!email.trim()) {
      throw new Error("Ingresá un email para crear carrito.");
    }

    const res = await fetch("/api/v1/shop/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerEmail: email.trim().toLowerCase(), currency }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? "No se pudo crear carrito");

    const created = json.cart as CartData;
    setCart(created);
    saveCartSession({ cartId: created.id, customerEmail: email.trim().toLowerCase() });
    return created;
  }

  async function refreshCart(cartId: string) {
    const res = await fetch(`/api/v1/shop/cart/${cartId}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? "No se pudo cargar carrito");
    setCart(json.cart as CartData);
  }

  async function addItem(productId: string, inventoryId?: string, sizeLabel?: string) {
    return withErrorHandling(async () => {
      setLoading(true);
      const active = await ensureCart();
      const res = await fetch(`/api/v1/shop/cart/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_item",
          productId,
          inventoryId,
          gender: "UNISEX",
          size: sizeLabel ?? "",
          quantity: 1,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "No se pudo agregar el producto");
      await refreshCart(active.id);
      saveCartSession({ cartId: active.id, customerEmail: email.trim().toLowerCase() });
      setMessage("Producto agregado al carrito.");
      setLoading(false);
      return json;
    });
  }

  async function updateItemQuantity(itemId: string, quantity: number) {
    await withErrorHandling(async () => {
      setLoading(true);
      const active = await ensureCart();
      const res = await fetch(`/api/v1/shop/cart/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_item",
          itemId,
          quantity,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "No se pudo actualizar el carrito");
      await refreshCart(active.id);
      setMessage("Carrito actualizado.");
      setLoading(false);
    });
    setLoading(false);
  }

  async function removeItem(itemId: string) {
    await withErrorHandling(async () => {
      setLoading(true);
      const active = await ensureCart();
      const res = await fetch(`/api/v1/shop/cart/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_item",
          itemId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "No se pudo quitar el ítem");
      await refreshCart(active.id);
      setMessage("Ítem quitado del carrito.");
      setLoading(false);
    });
    setLoading(false);
  }

  async function applyCoupon() {
    await withErrorHandling(async () => {
      setLoading(true);
      const active = await ensureCart();
      const res = await fetch(`/api/v1/shop/cart/${active.id}/apply-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "No se pudo aplicar cupón");
      await refreshCart(active.id);
      setMessage(`Cupón ${json?.coupon?.code ?? ""} aplicado.`);
      setLoading(false);
    });
    setLoading(false);
  }

  async function checkout() {
    await withErrorHandling(async () => {
      if (!cart) {
        throw new Error("Primero creá carrito y agregá productos.");
      }
      if (!email.trim()) {
        throw new Error("Ingresá un email válido.");
      }
      if (!clientName.trim()) {
        throw new Error("Ingresá tu nombre.");
      }
      if (!clientPhone.trim()) {
        throw new Error("Ingresá tu teléfono.");
      }
      if (!paymentProvider) {
        throw new Error("Seleccioná una pasarela de pago.");
      }
      setLoading(true);
      const res = await fetch("/api/v1/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart.id,
          clientName,
          clientPhone,
          paymentProvider,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "No se pudo completar checkout");
      setMessage(`Orden creada: ${json.order.id}`);
      setCheckoutOrderId(json.order.id as string);
      setCart(null);
      setCouponCode("");
      clearCartSession();
      setCheckoutStep(3);
      setLoading(false);
    });
    setLoading(false);
  }

  async function handlePrimaryAction() {
    if (checkoutStep === 1) {
      if (currentItems.length === 0) {
        setError("Agregá al menos un producto antes de continuar.");
        return;
      }
      setCheckoutStep(2);
      return;
    }

    if (checkoutStep === 2) {
      if (!email.trim()) {
        setError("Ingresá un email válido.");
        return;
      }
      if (!clientName.trim()) {
        setError("Ingresá tu nombre.");
        return;
      }
      if (!clientPhone.trim()) {
        setError("Ingresá tu teléfono.");
        return;
      }
      setCheckoutStep(3);
      return;
    }

    await checkout();
  }

  const currentItems = cart?.items ?? [];

  function formatGenderLabel(gender: CartItem["gender"]) {
    switch (gender) {
      case "MALE":
        return "Hombre";
      case "FEMALE":
        return "Mujer";
      case "UNISEX":
        return "Unisex";
      default:
        return "Sin género";
    }
  }

  return (
    <div className={compactCheckout ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]"}>
      {!compactCheckout ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-condensed font-bold text-3xl text-starfeet-blue uppercase">Productos</h2>
              <p className="mt-1 text-sm text-gray-500">Elegí una variante, agregá al carrito y revisá todo a la derecha.</p>
            </div>
            <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gray-600">
              {products.length} productos
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {products.map((product) => {
              const activeVariants = getActiveVariants(product);
              const selectedVariantId = getSelectedVariantId(product);
              const selectedVariant = activeVariants.find((variant) => variant.id === selectedVariantId) ?? null;

              return (
                <article key={product.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                  <ProductImageGallery images={product.imageUrls} alt={product.name} variant="card" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-condensed font-bold text-xl text-starfeet-blue uppercase">{product.name}</h3>
                      <p className="text-xs text-gray-500 uppercase">{getProductTypeLabel(product.type)}</p>
                    </div>
                    <span className="rounded-full bg-gray-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      {activeVariants.length > 0 ? `${activeVariants.length} variantes` : "Sin stock"}
                    </span>
                  </div>
                  <p className="mt-2 min-h-10 text-sm text-gray-600">{product.description ?? "Sin descripción"}</p>

                  {activeVariants.length > 0 ? (
                    <label className="mt-3 block">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Variante</span>
                      <DropdownSelect
                        value={selectedVariantId}
                        onChange={(value) => setSelectedVariantByProduct((prev) => ({ ...prev, [product.id]: value }))}
                        ariaLabel={`Variante de ${product.name}`}
                        options={activeVariants.map((variant) => ({
                          value: variant.id,
                          label: `${variant.physicalSize} • ${variant.color}`,
                          description: `${variant.stock} disponibles`,
                        }))}
                        className="mt-1"
                        buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                      />
                      {selectedVariant ? (
                        <p className="mt-1 text-[11px] text-gray-500">
                          Seleccionada: {selectedVariant.physicalSize} • {selectedVariant.color}
                        </p>
                      ) : null}
                    </label>
                  ) : null}

                  <p className="mt-3 text-sm font-bold text-starfeet-blue">
                    {currency === "USD" ? `USD ${numberFormatter.format(Number(product.priceUsd))}` : `ARS ${numberFormatter.format(Number(product.priceArs))}`}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded-xl bg-starfeet-blue px-3 py-2 text-xs font-bold text-white transition hover:bg-starfeet-lime hover:text-starfeet-blue disabled:opacity-50"
                      onClick={() =>
                        addItem(
                          product.id,
                          selectedVariant?.id || undefined,
                          selectedVariant?.physicalSize,
                        )
                      }
                      disabled={loading || activeVariants.length === 0}
                    >
                      {activeVariants.length === 0 ? "Sin stock" : "Agregar"}
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-starfeet-blue px-3 py-2 text-xs font-bold text-starfeet-blue transition hover:bg-starfeet-blue hover:text-white disabled:opacity-50"
                      onClick={async () => {
                        const result = await addItem(product.id, selectedVariant?.id || undefined, selectedVariant?.physicalSize);
                        if (result) {
                          router.push("/tienda/checkout");
                        }
                      }}
                      disabled={loading || activeVariants.length === 0}
                    >
                      Comprar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <aside className={`rounded-2xl border border-gray-200 bg-gray-50 p-5 h-fit ${compactCheckout ? "mx-auto w-full max-w-3xl" : "sticky top-28"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-condensed font-bold text-3xl text-starfeet-blue uppercase">{compactCheckout ? "Checkout" : "Carrito"}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {compactCheckout ? "Revisá tu compra y completá los datos." : "Revisá, ajustá cantidades y luego confirmá."}
            </p>
          </div>
          {compactCheckout ? (
            <button
              type="button"
              onClick={() => router.push("/tienda")}
              className="rounded-full border border-gray-300 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gray-600 transition hover:border-starfeet-blue hover:text-starfeet-blue"
            >
              Volver
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">
          <span className={`rounded-full px-2 py-1 ${checkoutStep === 1 ? "bg-starfeet-blue text-white" : "bg-gray-100"}`}>1</span>
          <span>Carrito</span>
          <span className="text-gray-300">—</span>
          <span className={`rounded-full px-2 py-1 ${checkoutStep === 2 ? "bg-starfeet-blue text-white" : "bg-gray-100"}`}>2</span>
          <span>Datos</span>
          <span className="text-gray-300">—</span>
          <span className={`rounded-full px-2 py-1 ${checkoutStep === 3 ? "bg-starfeet-blue text-white" : "bg-gray-100"}`}>3</span>
          <span>Pago</span>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Paso 2</p>
          <h3 className="mt-1 font-condensed text-xl font-black uppercase text-starfeet-blue">Datos de contacto</h3>
          <p className="mt-1 text-sm text-gray-500">Necesitamos estos datos para generar la orden y avanzar al pago.</p>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Email comprador</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            placeholder="cliente@email.com"
          />
        </label>

        <label className="mt-3 block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Moneda</span>
          <DropdownSelect
            value={currency}
            onChange={(value) => setCurrency(value as "ARS" | "USD")}
            ariaLabel="Moneda"
            options={[
              { value: "ARS", label: "ARS" },
              { value: "USD", label: "USD" },
            ]}
            className="mt-1"
            buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Paso 3</p>
          <h3 className="mt-1 font-condensed text-xl font-black uppercase text-starfeet-blue">Pago</h3>
          <p className="mt-1 text-sm text-gray-500">Elegí la pasarela y finalizá la compra.</p>
        </div>

        <label className="mt-3 block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Pasarela de pago</span>
          <DropdownSelect
            value={paymentProviders.length === 0 ? "" : paymentProvider}
            onChange={(value) => setPaymentProvider(value as "MERCADOPAGO" | "TRANSFERENCIA" | "PAYPAL")}
            ariaLabel="Pasarela de pago"
            placeholder={paymentProviders.length === 0 ? "Sin pasarelas activas" : "Seleccionar pasarela"}
            disabled={paymentProviders.length === 0}
            options={
              paymentProviders.length === 0
                ? []
                : paymentProviders.map((provider) => ({
                  value: provider,
                  label:
                    provider === "MERCADOPAGO"
                      ? "MercadoPago"
                      : provider === "TRANSFERENCIA"
                        ? "Transferencia bancaria"
                        : "PayPal",
                }))
            }
            className="mt-1"
            buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Se alimenta desde la configuración del admin.
          </p>
        </label>

        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Carrito</p>
          <p className="text-xs text-gray-500 break-all">{cart?.id ?? storedCartId ?? "No creado"}</p>
          <p className="mt-2 text-sm text-gray-700">Items: {currentItems.length}</p>
          <p className="text-sm text-gray-700">Subtotal: {numberFormatter.format(subtotal)}</p>
          <p className="text-sm text-gray-700">Descuento: {numberFormatter.format(discount)}</p>
          <p className="font-bold text-starfeet-blue">Total: {numberFormatter.format(total)}</p>
          {currentItems.length ? (
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
              {currentItems.map((item) => {
                const previewImage = item.product.imageUrls?.[0];
                const lineTotal = Number(item.unitPrice) * item.quantity;
                return (
                  <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-start gap-3">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
                        {previewImage ? (
                          <Image src={previewImage} alt={item.product.name} fill className="object-cover" sizes="64px" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] uppercase text-gray-400">Sin imagen</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-starfeet-blue">{item.product.name}</p>
                            <p className="text-[11px] text-gray-600">
                              {`${formatGenderLabel(item.gender)} · ${item.size ?? item.inventory?.physicalSize ?? "?"} · ${item.inventory?.color ?? "Sin color"}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                            aria-label="Quitar ítem"
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                              <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <path d="M6 6l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M10 10v6M14 10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center overflow-hidden rounded-full border border-gray-200 bg-white">
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="px-3 py-1 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                              aria-label="Disminuir cantidad"
                              disabled={loading || item.quantity <= 1}
                            >
                              −
                            </button>
                            <span className="min-w-10 px-3 py-1 text-center text-sm font-bold text-starfeet-blue">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-1 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                              aria-label="Aumentar cantidad"
                              disabled={loading}
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] uppercase tracking-widest text-gray-500">Total línea</p>
                            <p className="text-sm font-bold text-starfeet-blue">{numberFormatter.format(lineTotal)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            placeholder="Cupón"
          />
          <button
            type="button"
            onClick={applyCoupon}
            className="rounded-xl border border-starfeet-blue px-3 py-2 text-xs font-bold text-starfeet-blue disabled:opacity-50"
            disabled={loading}
          >
            Aplicar
          </button>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Nombre</span>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Teléfono</span>
          <input
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <button
          type="button"
          onClick={handlePrimaryAction}
          className="mt-4 w-full rounded-xl bg-starfeet-lime px-3 py-3 text-sm font-black uppercase text-starfeet-blue disabled:opacity-50"
          disabled={loading || checkoutOrderId !== null || currentItems.length === 0 || (checkoutStep === 3 && paymentProviders.length === 0)}
        >
          {checkoutStep === 1
            ? "Continuar a datos"
            : checkoutStep === 2
              ? "Continuar a pago"
              : checkoutOrderId
                ? "Compra completada"
                : "Confirmar checkout"}
        </button>

        {checkoutOrderId ? (
          <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-green-700">Pago pendiente</p>
            <p className="mt-1 text-sm text-green-900">
              Tu orden <span className="font-bold">{checkoutOrderId}</span> fue creada. Ahora corresponde completar el pago con{" "}
              <span className="font-bold">{paymentProvider}</span>.
            </p>
            <p className="mt-1 text-xs text-green-700">
              Esta versión todavía no tiene integración automática con la pasarela; el siguiente paso es conectar el link real de pago.
            </p>
          </div>
        ) : null}

        {message && <p className="mt-3 text-xs text-green-700">{message}</p>}
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </aside>
    </div>
  );
}
