"use client";

import { useEffect, useMemo, useState } from "react";
import { getProductTypeLabel } from "@/lib/product-types";

type OrderListItem = {
  id: string;
  status: string;
  currency: "ARS" | "USD";
  totalAmount: number;
  createdAt: string;
  coupon: null | {
    code: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
  };
  orderItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    productId: string;
  }>;
};

type OrderDetail = {
  id: string;
  status: string;
  currency: "ARS" | "USD";
  totalAmount: number;
  createdAt: string;
  snapshotClientName: string | null;
  snapshotClientEmail: string | null;
  snapshotClientPhone: string | null;
  paymentProvider: string | null;
  transactionId: string | null;
  shippingDetails: unknown;
  coupon: null | {
    code: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
  };
  orderItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    userSelectedGender: string;
    userSelectedSize: string;
    product: {
      id: string;
      name: string;
      type: string;
    };
  }>;
};

function currencyFormat(value: number, currency: "ARS" | "USD") {
  return `${currency} ${Number(value).toLocaleString()}`;
}

export function ClienteOrdersDashboard() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOrderSummary = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  async function loadOrders() {
    setLoadingList(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/cliente/orders", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "No se pudieron cargar las órdenes");
      }

      const list = (json.orders ?? []) as OrderListItem[];
      setOrders(list);

      if (list.length > 0) {
        setSelectedOrderId((prev) => prev ?? list[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoadingList(false);
    }
  }

  async function loadDetail(orderId: string) {
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/cliente/orders/${orderId}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "No se pudo cargar el detalle");
      }
      setSelectedOrder(json.order as OrderDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setSelectedOrder(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (!selectedOrderId) return;
    loadDetail(selectedOrderId);
  }, [selectedOrderId]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-5 mt-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">Mis pedidos</h2>
        {loadingList && <p className="mt-3 text-sm text-gray-500">Cargando órdenes...</p>}
        {!loadingList && orders.length === 0 && (
          <p className="mt-3 text-sm text-gray-500">Todavía no tenés compras registradas.</p>
        )}
        <div className="mt-3 space-y-2">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedOrderId(order.id)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                order.id === selectedOrderId ? "border-starfeet-blue bg-blue-50" : "border-gray-200 bg-white"
              }`}
            >
              <p className="font-bold text-starfeet-blue">Orden {order.id.slice(0, 8)}</p>
              <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
              <p className="text-sm text-gray-700 mt-1">
                {currencyFormat(Number(order.totalAmount), order.currency)} · {order.status}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">Detalle</h2>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {!selectedOrderId && <p className="mt-3 text-sm text-gray-500">Seleccioná una orden para ver el detalle.</p>}
        {loadingDetail && <p className="mt-3 text-sm text-gray-500">Cargando detalle...</p>}

        {selectedOrder && (
          <div className="mt-3 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="font-bold text-starfeet-blue">Orden {selectedOrder.id}</p>
              <p className="text-sm text-gray-700">
                {currencyFormat(Number(selectedOrder.totalAmount), selectedOrder.currency)} · {selectedOrder.status}
              </p>
              <p className="text-xs text-gray-500 mt-1">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
            </div>

            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Datos de compra</p>
              <p className="text-sm text-gray-700 mt-2">
                Email: {selectedOrder.snapshotClientEmail ?? selectedOrderSummary?.id ?? "N/A"}
              </p>
              <p className="text-sm text-gray-700">Pago: {selectedOrder.paymentProvider ?? "N/A"}</p>
              <p className="text-sm text-gray-700">
                Cupón:{" "}
                {selectedOrder.coupon
                  ? `${selectedOrder.coupon.code} (${selectedOrder.coupon.discountType === "PERCENTAGE"
                      ? `${selectedOrder.coupon.discountValue}%`
                      : selectedOrder.coupon.discountValue
                    })`
                  : "Sin cupón"}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Items</p>
              <div className="mt-2 space-y-2">
                {selectedOrder.orderItems.map((item) => (
                  <article key={item.id} className="rounded-lg border border-gray-200 p-2">
                    <p className="font-bold text-starfeet-blue">{item.product.name}</p>
                    <p className="text-xs text-gray-500">
                      {getProductTypeLabel(item.product.type as "STARFEET" | "SLIPPER" | "OTHER")} · Qty {item.quantity} · {currencyFormat(Number(item.unitPrice), selectedOrder.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Selección: {item.userSelectedGender} / {item.userSelectedSize}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
