"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStoredCartSession, saveCartSession, clearCartSession } from "@/lib/cart-session.client";
import { Button } from "@/components/atoms/Button";

function AddToCartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const productId = searchParams.get("productId") || "";
  const qty = parseInt(searchParams.get("qty") || "1", 10);
  const inventoryId = searchParams.get("inventoryId") || undefined;
  const gender = searchParams.get("gender") || undefined;
  const size = searchParams.get("size") || undefined;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (!productId) {
      setError("ID de producto inválido o no especificado.");
      setLoading(false);
      return;
    }

    const session = getStoredCartSession();
    if (session?.cartId) {
      // Cart session exists, attempt to add the item directly
      addItemToCart(session.cartId, session.customerEmail);
    } else {
      // No active cart session, show email form
      setLoading(false);
      setShowEmailForm(true);
    }
  }, [productId]);

  async function addItemToCart(cartId: string, customerEmail: string) {
    try {
      setLoading(true);
      setError(null);

      // Verify or add item to cart
      const res = await fetch(`/api/v1/shop/cart/${cartId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_item",
          productId,
          inventoryId,
          gender: gender ? (gender.toUpperCase() === "FEMALE" ? "FEMALE" : "MALE") : undefined,
          size,
          quantity: qty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Error al agregar el producto al carrito.");
      }

      // Re-save session just in case
      saveCartSession({ cartId, customerEmail });

      // Redirect to checkout
      router.push("/tienda/checkout");
    } catch (err: any) {
      console.error("Cart insertion error:", err);
      // If the cart expired or wasn't found, clear and show email form
      clearCartSession();
      setLoading(false);
      setShowEmailForm(true);
    }
  }

  async function handleCreateCartAndAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Por favor, ingresá un email válido.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Create Cart
      const cartRes = await fetch("/api/v1/shop/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: email.trim().toLowerCase(),
          currency: "ARS",
        }),
      });

      const cartData = await cartRes.json();
      if (!cartRes.ok) {
        throw new Error(cartData?.error || "No se pudo iniciar el proceso de compra.");
      }

      const cartId = cartData.cart.id;

      // 2. Add Item to the newly created cart
      await addItemToCart(cartId, email.trim().toLowerCase());
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-starfeet-blue border-t-starfeet-lime"></div>
          <p className="font-sans text-sm font-bold uppercase tracking-widest text-starfeet-blue">
            Procesando tu compra...
          </p>
        </div>
      </div>
    );
  }

  if (error && !showEmailForm) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
        <div className="max-w-md text-center">
          <h1 className="font-condensed text-3xl font-black uppercase text-red-600 mb-4">
            Error de compra
          </h1>
          <p className="font-sans text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push("/")} className="w-full">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-100 ring-1 ring-gray-100">
        <h1 className="mb-2 font-condensed text-4xl font-black uppercase leading-none tracking-tight text-starfeet-blue">
          Starfeet <br /><span className="text-starfeet-lime">Oficial</span>
        </h1>
        <p className="mb-6 font-sans text-sm font-medium uppercase tracking-widest text-gray-500">
          Iniciando tu compra rápida
        </p>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateCartAndAdd} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Ingresá tu email para continuar
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-starfeet-blue focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-starfeet-blue py-4 font-condensed text-lg font-black uppercase text-white transition-all hover:bg-starfeet-lime hover:text-starfeet-blue"
          >
            Continuar al Checkout
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AddToCartPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-starfeet-blue border-t-starfeet-lime"></div>
      </div>
    }>
      <AddToCartContent />
    </Suspense>
  );
}
