"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CommissionStatus, Currency } from "@prisma/client";

type FinanceSummary = {
  summary: {
    pendingAmount: number;
    pendingCount: number;
    paidAmount: number;
    paidCount: number;
  };
  kinesioBalances: Array<{
    id: string;
    slug: string;
    name: string | null;
    email: string;
    pendingAmount: number;
    pendingCount: number;
  }>;
  recentCommissions: Array<{
    id: string;
    amount: string;
    status: CommissionStatus;
    createdAt: string;
    kinesioUser: { name: string | null, email: string };
    order: { id: string, totalAmount: string, currency: Currency };
    coupon: { code: string } | null;
  }>;
};

export function AdminFinanceOverview() {
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/finance");
      if (!res.ok) throw new Error("Error al cargar finanzas");
      const json = await res.json();
      setData(json);
    } catch(err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currencyFormatter = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (loading) return <p className="text-gray-500 p-4">Cargando métricas financieras...</p>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">Finanzas</h2>
        <p className="text-sm text-gray-600 mt-1">Consolidado de comisiones y flujo de profesionales.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-900">Pendiente de Liquidar</p>
          <p className="mt-2 font-condensed text-4xl font-black text-amber-700">
            ARS {currencyFormatter.format(data.summary.pendingAmount)}
          </p>
          <p className="mt-1 text-sm text-amber-800">{data.summary.pendingCount} registros pendientes o validados</p>
        </article>

        <article className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-green-900">Histórico Pagado</p>
          <p className="mt-2 font-condensed text-4xl font-black text-green-700">
            ARS {currencyFormatter.format(data.summary.paidAmount)}
          </p>
          <p className="mt-1 text-sm text-green-800">{data.summary.paidCount} registros abonados</p>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.5fr]">
        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">Saldos por Profesional</h3>
          <div className="mt-4 space-y-3">
            {data.kinesioBalances.length === 0 ? (
              <p className="text-sm text-gray-500">No hay profesionales con saldo pendiente.</p>
            ) : (
              data.kinesioBalances.map(k => (
                <div key={k.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">{k.name || "Sin nombre"}</span>
                    <span className="text-xs text-gray-500">{k.pendingCount} operaciones</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-amber-600">ARS {currencyFormatter.format(k.pendingAmount)}</span>
                    <Link href={`/admin/professionals/${k.slug}`} className="text-[10px] text-starfeet-blue hover:underline font-bold uppercase mt-1">Ver Detalle</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">10 Registros Recientes</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 uppercase text-gray-500 text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Profesional</th>
                  <th className="px-3 py-2">Cupón</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentCommissions.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-gray-500">Sin comisiones recientes</td></tr>
                ) : (
                  data.recentCommissions.map(c => (
                    <tr key={c.id}>
                      <td className="px-3 py-2 text-xs text-gray-600">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2"><span className="font-medium text-gray-800">{c.kinesioUser.name || c.kinesioUser.email}</span></td>
                      <td className="px-3 py-2 text-xs">{c.coupon?.code || "-"}</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-900">ARS {currencyFormatter.format(Number(c.amount))}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.status === "PAID" ? "bg-green-100 text-green-800" : c.status === "PENDING" ? "bg-gray-100 text-gray-800" : c.status === "VALIDATED" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>

    </div>
  );
}
