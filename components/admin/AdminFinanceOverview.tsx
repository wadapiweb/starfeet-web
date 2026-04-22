"use client";

import { useCallback, useEffect, useState } from "react";
import { CommissionStatus, Currency, OrderStatus } from "@prisma/client";
import type { ReactNode } from "react";

type FinanceSummary = {
  cash: {
    totalAmount: number;
    totalCount: number;
    recognizedAmount: number;
    recognizedCount: number;
    openAmount: number;
    openCount: number;
    cancelledAmount: number;
    cancelledCount: number;
    averageTicket: number;
    averageRecognizedTicket: number;
  };
  summary: {
    pendingAmount: number;
    pendingCount: number;
    validatedAmount: number;
    validatedCount: number;
    paidAmount: number;
    paidCount: number;
    rejectedAmount: number;
    rejectedCount: number;
    outstandingAmount: number;
    totalEntries: number;
  };
  operations: {
    activeKinesios: number;
    activeCoupons: number;
    couponAssignments: number;
    couponRedemptions: number;
    couponUsageTotal: number;
    payoutPeriods: number;
    payoutAmount: number;
  };
  orderStatusTotals: Array<{
    status: OrderStatus;
    count: number;
    amount: number;
  }>;
  orderCurrencyTotals: Array<{
    currency: Currency;
    count: number;
    amount: number;
  }>;
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
    amount: number;
    status: CommissionStatus;
    createdAt: string;
    kinesioUser: { name: string | null; email: string };
    order: { id: string; totalAmount: number; currency: Currency };
    coupon: { code: string } | null;
  }>;
  recentOrders: Array<{
    id: string;
    status: OrderStatus;
    currency: Currency;
    totalAmount: number;
    createdAt: string;
    user: { name: string | null; email: string } | null;
    coupon: { code: string } | null;
    commissionCount: number;
  }>;
  topCoupons: Array<{
    id: string;
    code: string;
    usageCount: number;
    maxUses: number;
    commissionValue: number;
    assignmentsCount: number;
  }>;
};

export function AdminFinanceOverview() {
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/finance", { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar finanzas");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const money = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const date = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
  });

  if (loading) return <p className="p-4 text-gray-500">Cargando métricas financieras...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!data) return null;

  const hasCommissionData = data.summary.totalEntries > 0;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div>
          <h2 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">Finanzas</h2>
          <p className="mt-1 text-sm text-gray-600">
            Caja, comisiones, liquidaciones y actividad comercial. La lectura usa datos reales de órdenes, cupones y comisiones.
          </p>
        </div>

        {!hasCommissionData ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No hay comisiones registradas todavía. La caja ya es real, pero la capa de comisión/liquidación aún no tiene movimiento en esta base.
          </div>
        ) : null}
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Facturación total"
          value={`ARS ${money.format(data.cash.totalAmount)}`}
          detail={`${data.cash.totalCount} órdenes registradas`}
          tone="blue"
        />
        <MetricCard
          label="Caja reconocida"
          value={`ARS ${money.format(data.cash.recognizedAmount)}`}
          detail={`${data.cash.recognizedCount} órdenes cobradas o enviadas`}
          tone="green"
        />
        <MetricCard
          label="Pipeline abierto"
          value={`ARS ${money.format(data.cash.openAmount)}`}
          detail={`${data.cash.openCount} órdenes en curso`}
          tone="amber"
        />
        <MetricCard
          label="Comisiones pendientes"
          value={`ARS ${money.format(data.summary.outstandingAmount)}`}
          detail={`${data.summary.pendingCount} comisiones pendientes o validadas`}
          tone="slate"
        />
        <MetricCard
          label="Profesionales activos"
          value={String(data.operations.activeKinesios)}
          detail={`${data.operations.activeCoupons} cupones activos · ${data.operations.couponAssignments} asignaciones`}
          tone="violet"
        />
        <MetricCard
          label="Redenciones y liquidaciones"
          value={`${data.operations.couponRedemptions} / ${data.operations.payoutPeriods}`}
          detail={`ARS ${money.format(data.operations.payoutAmount)} en liquidaciones registradas`}
          tone="rose"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Caja por estado" subtitle="Realidad operativa de ventas por fase">
          <CompactTable
            headers={["Estado", "Órdenes", "Monto"]}
            emptyMessage="No hay órdenes para resumir"
            rows={data.orderStatusTotals.map((row) => [
              <StatusTag key={`${row.status}-status`} status={row.status} />,
              String(row.count),
              `ARS ${money.format(row.amount)}`,
            ])}
          />
        </Panel>

        <Panel title="Caja por moneda" subtitle="Distribución real de la facturación">
          <CompactTable
            headers={["Moneda", "Órdenes", "Monto"]}
            emptyMessage="No hay movimientos por moneda"
            rows={data.orderCurrencyTotals.map((row) => [
              <span key={`${row.currency}-currency`} className="font-semibold text-gray-800">{row.currency}</span>,
              String(row.count),
              `ARS ${money.format(row.amount)}`,
            ])}
          />
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Saldos por profesional" subtitle="Saldo pendiente para liquidación por kinesiólogo">
          <CompactTable
            headers={["Profesional", "Operaciones", "Saldo"]}
            emptyMessage="No hay saldos pendientes"
            rows={data.kinesioBalances.map((k) => [
              <div key={k.id} className="flex flex-col">
                <span className="font-semibold text-gray-800">{k.name || "Sin nombre"}</span>
                <span className="text-xs text-gray-500">{k.email}</span>
              </div>,
              String(k.pendingCount),
              <span key={`${k.id}-amount`} className="font-bold text-amber-600">
                ARS {money.format(k.pendingAmount)}
              </span>,
            ])}
          />
        </Panel>

        <Panel title="Top cupones" subtitle="Attribution real por uso y potencial de comisión">
          <CompactTable
            headers={["Cupón", "Uso", "Asignados"]}
            emptyMessage="No hay cupones para mostrar"
            rows={data.topCoupons.map((coupon) => [
              <div key={coupon.id} className="flex flex-col">
                <span className="font-semibold text-gray-800">{coupon.code}</span>
                <span className="text-xs text-gray-500">
                  Comisión {coupon.commissionValue}% · {coupon.usageCount}/{coupon.maxUses}
                </span>
              </div>,
              String(coupon.usageCount),
              String(coupon.assignmentsCount),
            ])}
          />
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Últimas órdenes" subtitle="Punto de partida real para caja y atribución">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Cupón</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Coms.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      Sin órdenes recientes
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-3 py-2 text-xs text-gray-600">{date.format(new Date(order.createdAt))}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{order.user?.name || "Sin nombre"}</span>
                          <span className="text-xs text-gray-500">{order.user?.email}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">{order.coupon?.code || "-"}</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-900">
                        {order.currency} {money.format(order.totalAmount)}
                      </td>
                      <td className="px-3 py-2">
                        <StatusTag status={order.status} />
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">{order.commissionCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Últimas comisiones" subtitle="Ledger de comisiones generado por cupón">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
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
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      Sin comisiones recientes
                    </td>
                  </tr>
                ) : (
                  data.recentCommissions.map((commission) => (
                    <tr key={commission.id}>
                      <td className="px-3 py-2 text-xs text-gray-600">{date.format(new Date(commission.createdAt))}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{commission.kinesioUser.name || commission.kinesioUser.email}</span>
                          <span className="text-xs text-gray-500">{commission.kinesioUser.email}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">{commission.coupon?.code || "-"}</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-900">
                        ARS {money.format(commission.amount)}
                      </td>
                      <td className="px-3 py-2">
                        <StatusTag status={commission.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      </div>
      {children}
    </article>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "green" | "amber" | "slate" | "violet" | "rose";
}) {
  type MetricTone = "blue" | "green" | "amber" | "slate" | "violet" | "rose";
  const toneClasses: Record<MetricTone, { border: string; bg: string; label: string; value: string; detail: string }> = {
    blue: { border: "border-blue-200", bg: "bg-blue-50", label: "text-blue-900", value: "text-starfeet-blue", detail: "text-blue-800" },
    green: { border: "border-green-200", bg: "bg-green-50", label: "text-green-900", value: "text-green-700", detail: "text-green-800" },
    amber: { border: "border-amber-200", bg: "bg-amber-50", label: "text-amber-900", value: "text-amber-700", detail: "text-amber-800" },
    slate: { border: "border-slate-200", bg: "bg-slate-50", label: "text-slate-900", value: "text-slate-700", detail: "text-slate-700" },
    violet: { border: "border-violet-200", bg: "bg-violet-50", label: "text-violet-900", value: "text-violet-700", detail: "text-violet-800" },
    rose: { border: "border-rose-200", bg: "bg-rose-50", label: "text-rose-900", value: "text-rose-700", detail: "text-rose-800" },
  };

  const styles = toneClasses[tone];

  return (
    <article className={`rounded-2xl border ${styles.border} ${styles.bg} p-5`}>
      <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${styles.label}`}>{label}</p>
      <p className={`mt-2 font-condensed text-4xl font-black ${styles.value}`}>{value}</p>
      <p className={`mt-1 text-sm ${styles.detail}`}>{detail}</p>
    </article>
  );
}

function CompactTable({
  headers,
  rows,
  emptyMessage,
}: {
  headers: string[];
  rows: ReactNode[][];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full whitespace-nowrap text-left text-sm">
        <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusTag({ status }: { status: OrderStatus | CommissionStatus }) {
  const label =
    status === "PAID"
      ? "Pagado"
      : status === "VALIDATED"
        ? "Validada"
        : status === "PENDING"
          ? "Pendiente"
          : status === "REJECTED"
            ? "Rechazada"
            : status === "INITIATED"
              ? "Iniciada"
              : status === "PENDING_PAYMENT"
                ? "Pendiente de pago"
                : status === "SHIPPED"
                  ? "Enviada"
                  : status === "DELIVERED"
                    ? "Entregada"
                    : status === "CANCELLED"
                      ? "Cancelada"
                      : status;
  const styles =
    status === "PAID"
      ? "bg-green-100 text-green-800"
      : status === "VALIDATED"
        ? "bg-amber-100 text-amber-800"
        : status === "REJECTED" || status === "CANCELLED"
          ? "bg-red-100 text-red-800"
          : "bg-gray-100 text-gray-800";

  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase ${styles}`}>
      {label}
    </span>
  );
}
