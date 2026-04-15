"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type DashboardResponse = {
  patientsCount: number;
  couponUsage: number;
  commissionsCount: number;
  commissionsTotal: number;
  commissionByStatus: Record<"PENDING" | "VALIDATED" | "PAID" | "REJECTED", number>;
};

type CouponAssignment = {
  id: string;
  assignedAt: string;
  coupon: {
    id: string;
    code: string;
    usageCount: number;
    maxUses: number;
    expiresAt: string;
    _count: { redemptions: number };
  };
};

type Patient = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
};

type Commission = {
  id: string;
  amount: number;
  status: "PENDING" | "VALIDATED" | "PAID" | "REJECTED";
  createdAt: string;
  coupon: { code: string } | null;
  order: { id: string; status: string; snapshotClientEmail: string | null; createdAt: string };
};

const today = new Date();
const defaultTo = today.toISOString().slice(0, 10);
const defaultFrom = new Date(today.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);

export function KinesioDashboard() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [coupons, setCoupons] = useState<CouponAssignment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);

  const query = useMemo(() => `from=${from}&to=${to}`, [from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, couponsRes, patientsRes, commissionsRes] = await Promise.all([
        fetch(`/api/v1/kinesio/dashboard?${query}`, { cache: "no-store" }),
        fetch("/api/v1/kinesio/coupons", { cache: "no-store" }),
        fetch(`/api/v1/kinesio/patients?${query}`, { cache: "no-store" }),
        fetch(`/api/v1/kinesio/commissions?${query}`, { cache: "no-store" }),
      ]);

      if (!dashRes.ok || !couponsRes.ok || !patientsRes.ok || !commissionsRes.ok) {
        throw new Error("No se pudieron cargar los datos del dashboard.");
      }

      const dashJson = await dashRes.json();
      const couponsJson = await couponsRes.json();
      const patientsJson = await patientsRes.json();
      const commissionsJson = await commissionsRes.json();

      setDashboard(dashJson);
      setCoupons(couponsJson.assignments ?? []);
      setPatients(patientsJson.patients ?? []);
      setCommissions(commissionsJson.commissions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">Filtros</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Desde</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Hasta</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="grid grid-cols-2 gap-3">
        <MetricCard label="Pacientes" value={dashboard?.patientsCount ?? 0} loading={loading} />
        <MetricCard label="Usos de cupón" value={dashboard?.couponUsage ?? 0} loading={loading} />
        <MetricCard label="Comisiones" value={dashboard?.commissionsCount ?? 0} loading={loading} />
        <MetricCard
          label="Total comisiones"
          value={Number(dashboard?.commissionsTotal ?? 0).toLocaleString()}
          loading={loading}
        />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">Estado de liquidación</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {(["PENDING", "VALIDATED", "PAID", "REJECTED"] as const).map((status) => (
            <div key={status} className="rounded-xl border border-gray-200 p-2">
              <p className="text-xs font-bold text-gray-500">{status}</p>
              <p className="font-bold text-starfeet-blue">{dashboard?.commissionByStatus?.[status] ?? 0}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">Cupones asignados</h2>
        <div className="mt-3 space-y-2">
          {coupons.length === 0 && <p className="text-sm text-gray-500">No hay cupones asignados.</p>}
          {coupons.map((assignment) => (
            <article key={assignment.id} className="rounded-xl border border-gray-200 p-3">
              <p className="font-bold text-starfeet-blue">{assignment.coupon.code}</p>
              <p className="text-xs text-gray-600">
                Usos {assignment.coupon.usageCount}/{assignment.coupon.maxUses} · Redenciones {assignment.coupon._count.redemptions}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">Pacientes</h2>
        <div className="mt-3 space-y-2">
          {patients.length === 0 && <p className="text-sm text-gray-500">No hay pacientes vinculados.</p>}
          {patients.map((patient) => (
            <article key={patient.id} className="rounded-xl border border-gray-200 p-3">
              <p className="font-bold text-starfeet-blue">{patient.name ?? "Paciente sin nombre"}</p>
              <p className="text-xs text-gray-600">{patient.email}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">Comisiones recientes</h2>
        <div className="mt-3 space-y-2">
          {commissions.length === 0 && <p className="text-sm text-gray-500">Sin comisiones en el período.</p>}
          {commissions.map((entry) => (
            <article key={entry.id} className="rounded-xl border border-gray-200 p-3">
              <p className="font-bold text-starfeet-blue">
                {Number(entry.amount).toLocaleString()} · {entry.status}
              </p>
              <p className="text-xs text-gray-600">
                Orden {entry.order.id.slice(0, 8)} · Cliente {entry.order.snapshotClientEmail ?? "N/A"} · Cupón{" "}
                {entry.coupon?.code ?? "N/A"}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, loading }: { label: string; value: string | number; loading: boolean }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-2 font-condensed font-black text-3xl text-starfeet-blue">{loading ? "..." : value}</p>
    </article>
  );
}
