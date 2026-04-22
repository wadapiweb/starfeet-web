"use client";

import { useEffect, useMemo, useState } from "react";

import { compactNumber, formatDateOnly } from "@/components/kinesio/kinesio-utils";

type PayoutPeriod = {
  period: string;
  total: number;
  pending: number;
  validated: number;
  paid: number;
  rejected: number;
  count: number;
};

export function KinesioPayoutsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<PayoutPeriod[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/kinesio/payouts", { cache: "no-store" });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error ?? "No se pudieron cargar las liquidaciones");
        setPeriods(payload.periods ?? []);
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
    return periods.filter((period) => !normalized || period.period.toLowerCase().includes(normalized));
  }, [periods, query]);

  const total = filtered.reduce((acc, period) => acc + Number(period.total), 0);

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-3">
        <StatCard label="Períodos" value={compactNumber(filtered.length)} loading={loading} />
        <StatCard label="Total" value={compactNumber(total)} loading={loading} />
        <StatCard label="Pagado" value={compactNumber(filtered.reduce((acc, item) => acc + Number(item.paid), 0))} loading={loading} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Buscar período</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="2026-04"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-starfeet-blue/50 focus:ring-2 focus:ring-starfeet-blue/15"
          />
        </label>
      </section>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="space-y-3">
        {filtered.length === 0 && !loading ? (
          <EmptyState title="Sin liquidaciones" description="No hay cierres para el período buscado." />
        ) : null}
        {filtered.map((period) => (
          <article key={period.period} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Período</p>
                <h3 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">{period.period}</h3>
                <p className="mt-1 text-sm text-gray-600">{formatDateOnly(`${period.period}-01`)}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                {compactNumber(period.count)} movimientos
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <MiniMetric label="Total" value={compactNumber(period.total)} />
              <MiniMetric label="Pendiente" value={compactNumber(period.pending)} />
              <MiniMetric label="Pagado" value={compactNumber(period.paid)} />
            </div>
          </article>
        ))}
      </section>
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
