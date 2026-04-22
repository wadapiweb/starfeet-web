"use client";

import { useEffect, useMemo, useState } from "react";

import { DropdownSelect } from "@/components/atoms/DropdownSelect";
import { commissionStatusLabel, compactNumber, currencyLabel, formatDate } from "@/components/kinesio/kinesio-utils";

type Commission = {
  id: string;
  amount: number;
  status: "PENDING" | "VALIDATED" | "PAID" | "REJECTED";
  createdAt: string;
  coupon: { code: string } | null;
  order: { id: string; status: string; snapshotClientEmail: string | null; createdAt: string };
};

const statusOptions = [
  { label: "Todas", value: "ALL" },
  { label: "Pendientes", value: "PENDING" },
  { label: "Validadas", value: "VALIDATED" },
  { label: "Pagadas", value: "PAID" },
  { label: "Rechazadas", value: "REJECTED" },
];

export function KinesioCommissionsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [status, setStatus] = useState<string>("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/kinesio/commissions", { cache: "no-store" });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error ?? "No se pudieron cargar las comisiones");
        setCommissions(payload.commissions ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error inesperado");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return commissions.filter((entry) => {
      const matchesStatus = status === "ALL" || entry.status === status;
      const matchesQuery =
        !normalized ||
        entry.id.toLowerCase().includes(normalized) ||
        entry.order.id.toLowerCase().includes(normalized) ||
        entry.order.snapshotClientEmail?.toLowerCase().includes(normalized) ||
        entry.coupon?.code.toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [commissions, query, status]);

  const total = filtered.reduce((acc, entry) => acc + Number(entry.amount), 0);

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-3">
        <StatCard label="Comisiones" value={compactNumber(filtered.length)} loading={loading} />
        <StatCard label="Total" value={currencyLabel(total, "ARS")} loading={loading} />
        <StatCard label="Pagadas" value={compactNumber(filtered.filter((entry) => entry.status === "PAID").length)} loading={loading} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Buscar comisión</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Orden, cliente o cupón"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-starfeet-blue/50 focus:ring-2 focus:ring-starfeet-blue/15"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Estado</span>
            <DropdownSelect
              value={status}
              onChange={setStatus}
              ariaLabel="Filtrar comisiones por estado"
              placeholder="Todos"
              options={statusOptions}
              className="mt-1"
              buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="space-y-3">
        {filtered.length === 0 && !loading ? (
          <EmptyState title="Sin comisiones" description="No hay registros para el filtro actual." />
        ) : null}
        {filtered.map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Comisión</p>
                <h3 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">
                  {currencyLabel(entry.amount, "ARS")}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{formatDate(entry.createdAt)}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                {commissionStatusLabel(entry.status)}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <MiniMetric label="Orden" value={entry.order.id.slice(0, 8)} />
              <MiniMetric label="Cliente" value={entry.order.snapshotClientEmail ?? "Sin email"} />
              <MiniMetric label="Cupón" value={entry.coupon?.code ?? "Sin cupón"} />
            </div>
          </article>
        ))}
      </section>

      <a
        href="/api/v1/kinesio/commissions/export"
        className="inline-flex items-center rounded-xl border border-starfeet-blue px-4 py-2 text-sm font-bold text-starfeet-blue"
      >
        Exportar CSV
      </a>
    </div>
  );
}

function StatCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-2 font-condensed text-3xl font-black text-starfeet-blue">{loading ? "..." : value}</p>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <article className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center">
      <p className="font-semibold text-starfeet-blue">{title}</p>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </article>
  );
}
