"use client";

import { DropdownSelect } from "@/components/atoms/DropdownSelect";
import { useMemo, useState } from "react";

type ShopProduct = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  priceArs: number;
  priceUsd: number;
};

type CartItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
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
}: {
  products: ShopProduct[];
  prefillEmail?: string;
  paymentProviders: Array<"MERCADOPAGO" | "TRANSFERENCIA" | "PAYPAL">;
  defaultPaymentProvider: "MERCADOPAGO" | "TRANSFERENCIA" | "PAYPAL";
}) {
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
    return created;
  }

  async function refreshCart(cartId: string) {
    const res = await fetch(`/api/v1/shop/cart/${cartId}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? "No se pudo cargar carrito");
    setCart(json.cart as CartData);
  }

  async function addItem(productId: string) {
    await withErrorHandling(async () => {
      setLoading(true);
      const active = await ensureCart();
      const res = await fetch(`/api/v1/shop/cart/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_item", productId, quantity: 1 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "No se pudo agregar el producto");
      await refreshCart(active.id);
      setMessage("Producto agregado al carrito.");
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
      setCart(null);
      setCouponCode("");
      setLoading(false);
    });
    setLoading(false);
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-condensed font-bold text-3xl text-starfeet-blue uppercase">Productos</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((product) => (
            <article key={product.id} className="rounded-2xl border border-gray-200 p-4">
              <h3 className="font-condensed font-bold text-xl text-starfeet-blue uppercase">{product.name}</h3>
              <p className="text-xs text-gray-500 uppercase">{product.type}</p>
              <p className="mt-2 text-sm text-gray-600 min-h-10">
                {product.description ?? "Sin descripción"}
              </p>
              <p className="mt-3 text-sm font-bold text-starfeet-blue">
                {currency === "USD"
                  ? `USD ${numberFormatter.format(Number(product.priceUsd))}`
                  : `ARS ${numberFormatter.format(Number(product.priceArs))}`}
              </p>
              <button
                type="button"
                className="mt-3 rounded-xl bg-starfeet-blue px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                onClick={() => addItem(product.id)}
                disabled={loading}
              >
                Agregar al carrito
              </button>
            </article>
          ))}
        </div>
      </section>

      <aside className="rounded-2xl border border-gray-200 bg-gray-50 p-5 h-fit">
        <h2 className="font-condensed font-bold text-3xl text-starfeet-blue uppercase">Checkout</h2>

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
          <p className="text-xs text-gray-500 break-all">{cart?.id ?? "No creado"}</p>
          <p className="mt-2 text-sm text-gray-700">Items: {cart?.items.length ?? 0}</p>
          <p className="text-sm text-gray-700">Subtotal: {numberFormatter.format(subtotal)}</p>
          <p className="text-sm text-gray-700">Descuento: {numberFormatter.format(discount)}</p>
          <p className="font-bold text-starfeet-blue">Total: {numberFormatter.format(total)}</p>
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
          onClick={checkout}
          className="mt-4 w-full rounded-xl bg-starfeet-lime px-3 py-3 text-sm font-black uppercase text-starfeet-blue disabled:opacity-50"
          disabled={loading || paymentProviders.length === 0}
        >
          Confirmar checkout
        </button>

        {message && <p className="mt-3 text-xs text-green-700">{message}</p>}
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </aside>
    </div>
  );
}
