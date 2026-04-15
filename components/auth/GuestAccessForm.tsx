"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

type GuestOrderItem = {
  id: string;
  quantity: number;
  unitPrice: string | number;
  userSelectedGender: string;
  userSelectedSize: string;
};

type GuestOrder = {
  id: string;
  status: string;
  currency: string;
  totalAmount: string | number;
  snapshotClientEmail: string | null;
  createdAt: string;
  orderItems: GuestOrderItem[];
  coupon?: { code: string } | null;
};

type GuestOrdersResponse = {
  orders?: GuestOrder[];
  email?: string;
  error?: string;
};

export function GuestAccessForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"request" | "verify" | "orders">("request");
  const [orders, setOrders] = useState<GuestOrder[]>([]);
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const totalOrdersAmount = useMemo(
    () => orders.reduce((acc, current) => acc + Number(current.totalAmount), 0),
    [orders]
  );

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setDevCode(null);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const hasOrdersResponse = await fetch("/api/v1/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const hasOrdersPayload = await hasOrdersResponse.json();
      if (!hasOrdersResponse.ok) {
        throw new Error(hasOrdersPayload?.error ?? "No se pudo validar el email.");
      }
      if (!hasOrdersPayload?.hasGuestOrders) {
        throw new Error("No encontramos compras de invitado asociadas a ese email.");
      }

      const response = await fetch("/api/auth/guest/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "No se pudo enviar el código.");
      }

      setStep("verify");
      setMessage("Te enviamos un código para acceder a tus compras de invitado.");
      if (payload?.devCode) setDevCode(payload.devCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const verifyResponse = await fetch("/api/auth/guest/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, code: code.trim() }),
      });
      const verifyPayload = await verifyResponse.json();
      if (!verifyResponse.ok) {
        throw new Error(verifyPayload?.error ?? "Código inválido o expirado.");
      }

      const ordersResponse = await fetch("/api/v1/guest/orders", { method: "GET" });
      const ordersPayload = (await ordersResponse.json()) as GuestOrdersResponse;
      if (!ordersResponse.ok) {
        throw new Error(ordersPayload.error ?? "No se pudieron cargar las compras.");
      }

      setOrders(ordersPayload.orders ?? []);
      setGuestEmail(ordersPayload.email ?? normalizedEmail);
      setStep("orders");
      setMessage("Acceso validado correctamente.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function closeGuestSession() {
    setLoading(true);
    try {
      await fetch("/api/auth/guest/logout", { method: "POST" });
      setStep("request");
      setCode("");
      setOrders([]);
      setGuestEmail("");
      setMessage("Sesión de invitado cerrada.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {step === "request" ? (
        <form onSubmit={requestCode} className="space-y-4" noValidate>
          <label htmlFor="guest-email" className="block text-xs font-bold uppercase tracking-[0.14em] text-gray-700">
            Email de compra
          </label>
          <input
            id="guest-email"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-starfeet-blue transition focus:ring-2"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {message ? <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-starfeet-blue/90 disabled:opacity-50"
          >
            {loading ? "Validando..." : "Enviar código de acceso"}
          </button>
        </form>
      ) : null}

      {step === "verify" ? (
        <form onSubmit={verifyCode} className="space-y-4" noValidate>
          <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
            Email validado: {email.toLowerCase().trim()}
          </p>

          {devCode ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Código de desarrollo: <strong>{devCode}</strong>
            </p>
          ) : null}

          <label htmlFor="guest-code" className="block text-xs font-bold uppercase tracking-[0.14em] text-gray-700">
            Código recibido
          </label>
          <input
            id="guest-code"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-starfeet-blue transition focus:ring-2"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            required
          />

          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {message ? <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-starfeet-blue/90 disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Acceder a mis compras"}
          </button>

          <button
            type="button"
            className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
            onClick={() => {
              setStep("request");
              setCode("");
              setError(null);
              setMessage(null);
            }}
          >
            Volver
          </button>
        </form>
      ) : null}

      {step === "orders" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <p>
              Compras de invitado para <span className="font-bold">{guestEmail}</span>
            </p>
            <p className="mt-1">
              Órdenes: <span className="font-bold">{orders.length}</span> · Total: <span className="font-bold">{totalOrdersAmount.toFixed(2)}</span>
            </p>
          </div>

          <div className="space-y-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded-xl border border-gray-200 p-3 text-sm">
                <p className="font-bold text-starfeet-blue">Orden {order.id.slice(0, 10)}</p>
                <p className="text-gray-600">
                  {new Date(order.createdAt).toLocaleDateString("es-AR")} · {order.status}
                </p>
                <p className="text-gray-700">
                  {order.currency} {Number(order.totalAmount).toFixed(2)}
                </p>
                <p className="text-gray-600">Items: {order.orderItems.length}</p>
                {order.coupon?.code ? <p className="text-gray-600">Cupón: {order.coupon.code}</p> : null}
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={closeGuestSession}
            disabled={loading}
            className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cerrar sesión de invitado
          </button>
        </div>
      ) : null}

      <p className="text-sm text-gray-600">
        ¿Tienes cuenta?{" "}
        <Link href="/login" className="text-starfeet-blue hover:underline">
          Ingresar
        </Link>
      </p>
    </div>
  );
}
