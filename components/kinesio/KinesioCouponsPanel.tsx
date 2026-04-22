"use client";

import { useEffect, useMemo, useState } from "react";

import { compactNumber, formatDateOnly, progressPercent } from "@/components/kinesio/kinesio-utils";

type CouponAssignment = {
  id: string;
  assignedAt: string;
  coupon: {
    id: string;
    code: string;
    usageCount: number;
    maxUses: number;
    expiresAt: string | null;
    isActive: boolean;
    _count: { redemptions: number };
  };
};

export function KinesioCouponsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<CouponAssignment[]>([]);
  const [query, setQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/kinesio/coupons", { cache: "no-store" });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error ?? "No se pudieron cargar los cupones");
        setAssignments(payload.assignments ?? []);
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
    return assignments.filter((assignment) => {
      const matchesQuery =
        !normalized || assignment.coupon.code.toLowerCase().includes(normalized) || assignment.id.toLowerCase().includes(normalized);
      const matchesActive = !onlyActive || assignment.coupon.isActive;
      return matchesQuery && matchesActive;
    });
  }, [assignments, query, onlyActive]);

  const totalUsed = filtered.reduce((acc, item) => acc + item.coupon.usageCount, 0);
  const totalRedemptions = filtered.reduce((acc, item) => acc + item.coupon._count.redemptions, 0);

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-3">
        <StatCard label="Asignados" value={compactNumber(filtered.length)} loading={loading} />
        <StatCard label="Usos acumulados" value={compactNumber(totalUsed)} loading={loading} />
        <StatCard label="Redenciones" value={compactNumber(totalRedemptions)} loading={loading} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Buscar cupón</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Código o id de asignación"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-starfeet-blue/50 focus:ring-2 focus:ring-starfeet-blue/15"
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
            <input type="checkbox" checked={onlyActive} onChange={(event) => setOnlyActive(event.target.checked)} />
            Mostrar sólo activos
          </label>
        </div>
      </section>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="space-y-3">
        {filtered.length === 0 && !loading ? (
          <EmptyState title="Sin cupones" description="No hay cupones asignados con los filtros actuales." />
        ) : null}
        {filtered.map((assignment) => {
          const progress = progressPercent(assignment.coupon.usageCount, assignment.coupon.maxUses);
          const expired = assignment.coupon.expiresAt ? new Date(assignment.coupon.expiresAt).getTime() < Date.now() : false;
          return (
            <article key={assignment.id} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Cupón asignado</p>
                  <h3 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">
                    {assignment.coupon.code}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">Asignado el {formatDateOnly(assignment.assignedAt)}</p>
                </div>
                <StatusTag active={assignment.coupon.isActive && !expired} text={expired ? "Vencido" : assignment.coupon.isActive ? "Activo" : "Inactivo"} />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <MiniMetric label="Usos" value={`${compactNumber(assignment.coupon.usageCount)}/${compactNumber(assignment.coupon.maxUses)}`} />
                <MiniMetric label="Redenciones" value={compactNumber(assignment.coupon._count.redemptions)} />
                <MiniMetric label="Vence" value={assignment.coupon.expiresAt ? formatDateOnly(assignment.coupon.expiresAt) : "Sin vencimiento"} />
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-starfeet-blue" style={{ width: `${progress}%` }} />
              </div>
            </article>
          );
        })}
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

function StatusTag({ active, text }: { active: boolean; text: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      {text}
    </span>
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
