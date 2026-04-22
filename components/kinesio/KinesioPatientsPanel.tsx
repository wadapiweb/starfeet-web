"use client";

import { useEffect, useMemo, useState } from "react";

import { DropdownSelect } from "@/components/atoms/DropdownSelect";
import { compactNumber, formatDateOnly } from "@/components/kinesio/kinesio-utils";

type Patient = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
};

type PatientDetail = Patient & {
  orders: Array<{
    id: string;
    status: string;
    totalAmount: number;
    currency: "ARS" | "USD";
    createdAt: string;
  }>;
};

export function KinesioPatientsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selected, setSelected] = useState<PatientDetail | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/kinesio/patients", { cache: "no-store" });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error ?? "No se pudieron cargar los pacientes");
        const list = payload.patients ?? [];
        setPatients(list);
        setSelectedId((current) => current || list[0]?.id || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error inesperado");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedId) {
        setSelected(null);
        return;
      }
      try {
        const res = await fetch(`/api/v1/kinesio/patients/${selectedId}`, { cache: "no-store" });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error ?? "No se pudo cargar el paciente");
        setSelected(payload.patient as PatientDetail);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error inesperado");
        setSelected(null);
      }
    };

    loadDetail();
  }, [selectedId]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return patients.filter((patient) => {
      if (!normalized) return true;
      return [patient.name, patient.email, patient.phone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized));
    });
  }, [patients, query]);

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-3">
        <StatCard label="Pacientes" value={compactNumber(filtered.length)} loading={loading} />
        <StatCard label="Con fecha inicial" value={compactNumber(filtered.filter((patient) => patient.firstOrderAt).length)} loading={loading} />
        <StatCard label="Con actividad reciente" value={compactNumber(filtered.filter((patient) => patient.lastOrderAt).length)} loading={loading} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Buscar paciente</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre, email o teléfono"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-starfeet-blue/50 focus:ring-2 focus:ring-starfeet-blue/15"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Paciente seleccionado</span>
            <DropdownSelect
              value={selectedId}
              onChange={setSelectedId}
              ariaLabel="Paciente seleccionado"
              placeholder="Seleccionar paciente"
              options={filtered.map((patient) => ({
                value: patient.id,
                label: patient.name ?? patient.email,
                description: patient.email,
              }))}
              className="mt-1"
              buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {filtered.length === 0 && !loading ? (
            <EmptyState title="Sin pacientes" description="No hay pacientes con los filtros actuales." />
          ) : null}
          {filtered.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => setSelectedId(patient.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                selectedId === patient.id ? "border-starfeet-blue bg-white" : "border-gray-200 bg-white hover:border-starfeet-blue/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-starfeet-blue">{patient.name ?? "Paciente sin nombre"}</p>
                  <p className="text-sm text-gray-600">{patient.email}</p>
                  <p className="mt-1 text-xs text-gray-500">{patient.phone ?? "Sin teléfono"}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                  {patient.lastOrderAt ? "Activo" : "Nuevo"}
                </span>
              </div>
            </button>
          ))}
        </div>

        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Detalle</p>
                <h3 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">
                  {selected.name ?? "Paciente sin nombre"}
                </h3>
                <p className="text-sm text-gray-600">{selected.email}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MiniMetric label="Primera orden" value={formatDateOnly(selected.firstOrderAt)} />
                <MiniMetric label="Última orden" value={formatDateOnly(selected.lastOrderAt)} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Órdenes</p>
                <div className="mt-2 space-y-2">
                  {selected.orders.length === 0 ? (
                    <p className="text-sm text-gray-600">Sin órdenes registradas.</p>
                  ) : (
                    selected.orders.map((order) => (
                      <article key={order.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
                        <p className="font-semibold text-starfeet-blue">
                          {order.id.slice(0, 8)} · {order.status}
                        </p>
                        <p className="text-gray-600">
                          {order.currency} {compactNumber(order.totalAmount)} · {formatDateOnly(order.createdAt)}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="Seleccioná un paciente" description="Abrí un registro para ver su historial y órdenes." />
          )}
        </article>
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
