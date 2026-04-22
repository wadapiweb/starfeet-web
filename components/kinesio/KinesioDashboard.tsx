"use client";

import { DropdownSelect } from "@/components/atoms/DropdownSelect";
import { densityClasses } from "@/components/kinesio/kinesio-utils";
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

type PatientDetail = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  orders: Array<{
    id: string;
    status: string;
    totalAmount: number;
    currency: "ARS" | "USD";
    createdAt: string;
  }>;
};

type Commission = {
  id: string;
  amount: number;
  status: "PENDING" | "VALIDATED" | "PAID" | "REJECTED";
  createdAt: string;
  coupon: { code: string } | null;
  order: { id: string; status: string; snapshotClientEmail: string | null; createdAt: string };
};

type PayoutPeriod = {
  period: string;
  total: number;
  pending: number;
  validated: number;
  paid: number;
  rejected: number;
  count: number;
};

type KinesioSettings = {
  dashboardRangeDays: number;
  tableDensity: "comfortable" | "compact";
  showQuickTips: boolean;
  autoRefreshMinutes: number;
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
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<PatientDetail | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [periods, setPeriods] = useState<PayoutPeriod[]>([]);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [showQuickTips, setShowQuickTips] = useState(true);

  const query = useMemo(() => `from=${from}&to=${to}`, [from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, couponsRes, patientsRes, commissionsRes, payoutsRes, settingsRes] = await Promise.all([
        fetch(`/api/v1/kinesio/dashboard?${query}`, { cache: "no-store" }),
        fetch("/api/v1/kinesio/coupons", { cache: "no-store" }),
        fetch(`/api/v1/kinesio/patients?${query}`, { cache: "no-store" }),
        fetch(`/api/v1/kinesio/commissions?${query}`, { cache: "no-store" }),
        fetch(`/api/v1/kinesio/payouts?${query}`, { cache: "no-store" }),
        fetch("/api/v1/kinesio/settings", { cache: "no-store" }),
      ]);

      if (!dashRes.ok || !couponsRes.ok || !patientsRes.ok || !commissionsRes.ok || !payoutsRes.ok || !settingsRes.ok) {
        throw new Error("No se pudieron cargar los datos del dashboard.");
      }

      const dashJson = await dashRes.json();
      const couponsJson = await couponsRes.json();
      const patientsJson = await patientsRes.json();
      const commissionsJson = await commissionsRes.json();
      const payoutsJson = await payoutsRes.json();
      const settingsJson = await settingsRes.json();

      const patientList = patientsJson.patients ?? [];
      setDashboard(dashJson);
      setCoupons(couponsJson.assignments ?? []);
      setPatients(patientList);
      setCommissions(commissionsJson.commissions ?? []);
      setPeriods(payoutsJson.periods ?? []);
      const kinesioSettings = settingsJson.settings as KinesioSettings | undefined;
      setDensity(kinesioSettings?.tableDensity === "compact" ? "compact" : "comfortable");
      setShowQuickTips(kinesioSettings?.showQuickTips !== false);
      setSelectedPatientId((current) => current || patientList[0]?.id || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadPatientDetail = useCallback(async (patientId: string) => {
    if (!patientId) {
      setSelectedPatientDetail(null);
      return;
    }
    try {
      const res = await fetch(`/api/v1/kinesio/patients/${patientId}`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo cargar el detalle del paciente");
      setSelectedPatientDetail(payload.patient ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setSelectedPatientDetail(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadPatientDetail(selectedPatientId);
  }, [selectedPatientId, loadPatientDetail]);

  return (
    <div className="space-y-4">
      {showQuickTips ? (
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Tip operativo</p>
          <p className="mt-1 text-sm text-sky-900">
            Empezá por el rango de fechas, seguí con pacientes y terminá en comisiones. Esa secuencia evita lecturas inconsistentes.
          </p>
        </section>
      ) : null}

      <section className={`rounded-2xl border border-gray-200 bg-white ${densityClasses(density)}`}>
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
        <a
          href={`/api/v1/kinesio/commissions/export?${query}`}
          className="mt-3 inline-block rounded-xl border border-starfeet-blue px-3 py-2 text-xs font-bold text-starfeet-blue"
        >
          Exportar comisiones CSV
        </a>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className={`grid grid-cols-2 ${density === "compact" ? "gap-2" : "gap-3"}`}>
        <MetricCard label="Pacientes" value={dashboard?.patientsCount ?? 0} loading={loading} />
        <MetricCard label="Usos de cupón" value={dashboard?.couponUsage ?? 0} loading={loading} />
        <MetricCard label="Comisiones" value={dashboard?.commissionsCount ?? 0} loading={loading} />
        <MetricCard
          label="Total comisiones"
          value={Number(dashboard?.commissionsTotal ?? 0).toLocaleString()}
          loading={loading}
        />
      </section>

      <section className={`rounded-2xl border border-gray-200 bg-white ${densityClasses(density)}`}>
        <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">Estado de liquidación</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {(["PENDING", "VALIDATED", "PAID", "REJECTED"] as const).map((status) => (
            <div key={status} className="rounded-xl border border-gray-200 p-2">
              <p className="text-xs font-bold text-gray-500">{commissionStatusLabel(status)}</p>
              <p className="font-bold text-starfeet-blue">{dashboard?.commissionByStatus?.[status] ?? 0}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`rounded-2xl border border-gray-200 bg-white ${densityClasses(density)}`}>
        <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">Liquidaciones por período</h2>
        <div className="mt-3 space-y-2">
          {periods.length === 0 && <p className="text-sm text-gray-500">Sin movimientos en el período.</p>}
          {periods.map((period) => (
            <article key={period.period} className="rounded-xl border border-gray-200 p-3">
              <p className="font-bold text-starfeet-blue">{period.period}</p>
              <p className="text-xs text-gray-600">
                Total {period.total.toLocaleString()} · Count {period.count} · Paid {period.paid.toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={`rounded-2xl border border-gray-200 bg-white ${densityClasses(density)}`}>
        <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">Cupones asignados</h2>
        <div className="mt-3 space-y-2">
          {coupons.length === 0 && <p className="text-sm text-gray-500">No hay cupones asignados.</p>}
          {coupons.map((assignment) => (
            <article key={assignment.id} className="rounded-xl border border-gray-200 p-3">
              <p className="font-bold text-starfeet-blue">{assignment.coupon.code}</p>
              <p className="text-xs text-gray-600">
                Usos {assignment.coupon.usageCount}/{assignment.coupon.maxUses} · Redenciones{" "}
                {assignment.coupon._count.redemptions}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={`rounded-2xl border border-gray-200 bg-white ${densityClasses(density)}`}>
        <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">Pacientes</h2>
        <div className="mt-3">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Paciente seleccionado</span>
            <DropdownSelect
              value={selectedPatientId}
              onChange={(value) => setSelectedPatientId(value)}
              ariaLabel="Paciente seleccionado"
              placeholder="Seleccionar paciente"
              options={patients.map((patient) => ({
                value: patient.id,
                label: `${patient.name ?? patient.email} (${patient.email})`,
              }))}
              className="mt-1"
              buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-3 space-y-2">
          {!selectedPatientDetail && <p className="text-sm text-gray-500">No hay detalle de paciente seleccionado.</p>}
          {selectedPatientDetail && (
            <article className="rounded-xl border border-gray-200 p-3">
              <p className="font-bold text-starfeet-blue">{selectedPatientDetail.name ?? "Paciente sin nombre"}</p>
              <p className="text-xs text-gray-600">{selectedPatientDetail.email}</p>
              <p className="mt-2 text-xs font-bold text-gray-500">Órdenes</p>
              <div className="mt-1 space-y-1">
                {selectedPatientDetail.orders.length === 0 && <p className="text-xs text-gray-500">Sin órdenes.</p>}
                {selectedPatientDetail.orders.map((order) => (
                  <p key={order.id} className="text-xs text-gray-600">
                    {order.id.slice(0, 8)} · {orderStatusLabel(order.status)} · {order.currency} {Number(order.totalAmount).toLocaleString()}
                  </p>
                ))}
              </div>
            </article>
          )}
        </div>
      </section>

      <section className={`rounded-2xl border border-gray-200 bg-white ${densityClasses(density)}`}>
        <h2 className="font-condensed font-bold text-2xl text-starfeet-blue uppercase">Comisiones recientes</h2>
        <div className="mt-3 space-y-2">
                {commissions.length === 0 && <p className="text-sm text-gray-500">Sin comisiones en el período.</p>}
                {commissions.map((entry) => (
                  <article key={entry.id} className="rounded-xl border border-gray-200 p-3">
                    <p className="font-bold text-starfeet-blue">
                      {Number(entry.amount).toLocaleString()} · {commissionStatusLabel(entry.status)}
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

function commissionStatusLabel(status: "PENDING" | "VALIDATED" | "PAID" | "REJECTED") {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "VALIDATED":
      return "Validada";
    case "PAID":
      return "Pagada";
    case "REJECTED":
      return "Rechazada";
    default:
      return status;
  }
}

function orderStatusLabel(status: string) {
  switch (status) {
    case "INITIATED":
      return "Iniciada";
    case "PENDING_PAYMENT":
      return "Pendiente de pago";
    case "PAID":
      return "Pagada";
    case "SHIPPED":
      return "Enviada";
    case "DELIVERED":
      return "Entregada";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status;
  }
}
