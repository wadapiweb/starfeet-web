"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { OrderStatus, Currency } from "@prisma/client";

type OrderSummary = {
  id: string;
  status: OrderStatus;
  currency: Currency;
  totalAmount: string;
  snapshotClientName: string | null;
  snapshotClientEmail: string | null;
  createdAt: string;
  user: { name: string | null; email: string };
  coupon: { code: string } | null;
  _count: { orderItems: number };
};

export function AdminSalesManager() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== "all") q.set("status", statusFilter);
      if (search.trim()) q.set("search", search.trim());
      q.set("page", page.toString());

      const res = await fetch(`/api/v1/admin/sales?${q.toString()}`);
      if (!res.ok) throw new Error("Error al cargar órdenes");
      const json = await res.json();
      setOrders(json.orders);
      setTotal(json.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function updateStatus(id: string, newStatus: OrderStatus) {
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/sales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar la orden");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    }
  }

  const currencyFormatter = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">Ventas y Órdenes</h2>
          <p className="text-sm text-gray-600">Total resultados: {total}</p>
        </div>
        <div className="flex gap-2">
          <label className="block">
            <span className="sr-only">Buscar órdenes</span>
            <input
              type="search"
              placeholder="Buscar ID, email o nombre"
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-starfeet-blue"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadData()}
            />
          </label>
          <label className="block">
            <span className="sr-only">Filtrar por estado</span>
            <select
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="INITIATED">Iniciado</option>
              <option value="PENDING_PAYMENT">Pendiente Pago</option>
              <option value="PAID">Pagado</option>
              <option value="SHIPPED">Enviado</option>
              <option value="DELIVERED">Entregado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </label>
        </div>
      </header>

      {error && <p className="mb-4 text-sm font-bold text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-gray-50 uppercase text-gray-500 text-xs font-semibold tracking-wider">
            <tr>
              <th className="px-4 py-3">Fecha / ID</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Items / Cupón</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  {loading ? "Cargando..." : "No se encontraron órdenes."}
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <Link
                      href={`/admin/sales/${order.id}`}
                      className="font-mono text-xs text-starfeet-blue hover:underline"
                    >
                      {order.id.slice(0, 10)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.snapshotClientName || order.user?.name || "Sin nombre"}</p>
                    <p className="text-xs text-gray-500">{order.snapshotClientEmail || order.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{order._count.orderItems} item(s)</p>
                    {order.coupon ? (
                      <span className="inline-block mt-1 bg-blue-100 text-starfeet-blue text-xs font-bold px-2 py-0.5 rounded-full">
                        {order.coupon.code}
                      </span>
                    ) : <span className="text-xs text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-bold text-gray-900">
                      {order.currency} {currencyFormatter.format(Number(order.totalAmount))}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Cambiar estado de la orden ${order.id.slice(0, 10)}`}
                      className={`text-xs font-bold border rounded-md px-2 py-1 outline-none ${
                        order.status === "PAID" ? "bg-green-50 border-green-200 text-green-700" :
                        order.status === "CANCELLED" ? "bg-red-50 border-red-200 text-red-700" :
                        "bg-white border-gray-300 text-gray-700"
                      }`}
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                      disabled={loading}
                    >
                      <option value="INITIATED">Iniciado</option>
                      <option value="PENDING_PAYMENT">Pend. Pago</option>
                      <option value="PAID">Pagado</option>
                      <option value="SHIPPED">Enviado</option>
                      <option value="DELIVERED">Entregado</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
        <button 
          disabled={page === 1 || loading} 
          onClick={() => setPage(p => p - 1)}
          className="border border-gray-300 px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-gray-50 text-gray-800 font-medium"
        >
          Anterior
        </button>
        <span className="font-semibold">Página {page}</span>
        <button 
          disabled={orders.length < 20 || loading} 
          onClick={() => setPage(p => p + 1)}
          className="border border-gray-300 px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-gray-50 text-gray-800 font-medium"
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
