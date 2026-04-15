"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Kinesio = {
  id: string;
  name: string | null;
  email: string;
};

type Coupon = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxUses: number;
  usageCount: number;
  isStackable: boolean;
  isActive: boolean;
  expiresAt: string;
  assignments: Array<{
    kinesioUser: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
};

type CreateCouponPayload = {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxUses: number;
  isStackable: boolean;
  expiresAt: string;
  commissionType: "PERCENTAGE" | "FIXED_AMOUNT";
  commissionValue: number;
  kinesioUserIds: string[];
};

const initialForm: CreateCouponPayload = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: 10,
  maxUses: 50,
  isStackable: false,
  expiresAt: "",
  commissionType: "PERCENTAGE",
  commissionValue: 5,
  kinesioUserIds: [],
};

export function AdminCouponsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [kinesios, setKinesios] = useState<Kinesio[]>([]);
  const [form, setForm] = useState<CreateCouponPayload>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [codeFilter, setCodeFilter] = useState("");
  const [kinesioFilter, setKinesioFilter] = useState("");

  const canSubmit = useMemo(() => {
    return (
      form.code.trim().length >= 3 &&
      form.discountValue > 0 &&
      form.maxUses > 0 &&
      form.commissionValue >= 0 &&
      form.expiresAt.length > 0
    );
  }, [form]);

  const loadData = useCallback(async () => {
    setError(null);
    const search = new URLSearchParams();
    if (statusFilter !== "all") search.set("status", statusFilter);
    if (codeFilter.trim()) search.set("code", codeFilter.trim());
    if (kinesioFilter) search.set("kinesioUserId", kinesioFilter);

    const [couponRes, kinesioRes] = await Promise.all([
      fetch(`/api/v1/admin/coupons?${search.toString()}`, { cache: "no-store" }),
      fetch("/api/v1/admin/kinesios", { cache: "no-store" }),
    ]);

    if (!couponRes.ok) throw new Error("No se pudieron cargar los cupones");
    if (!kinesioRes.ok) throw new Error("No se pudieron cargar los profesionales");

    const couponsJson = await couponRes.json();
    const kinesioJson = await kinesioRes.json();
    setCoupons(couponsJson.coupons ?? []);
    setKinesios(kinesioJson.professionals ?? kinesioJson.kinesios ?? []);
  }, [codeFilter, kinesioFilter, statusFilter]);

  useEffect(() => {
    loadData().catch((e) => setError(e instanceof Error ? e.message : "Error de carga"));
  }, [loadData]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return setError("Completá los campos obligatorios.");

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/v1/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          code: form.code.toUpperCase().trim(),
          expiresAt: new Date(`${form.expiresAt}T23:59:00.000Z`).toISOString(),
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "Error al crear cupón");

      setSuccess("Cupón creado correctamente.");
      setForm(initialForm);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(coupon: Coupon) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo actualizar estado");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function updateMaxUses(coupon: Coupon, nextMaxUses: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxUses: nextMaxUses }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo actualizar maxUses");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function revokeAssignment(couponId: string, kinesioUserId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/coupons/${couponId}/assignments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kinesioUserIds: [kinesioUserId] }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo revocar asignación");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function toggleKinesio(id: string) {
    setForm((prev) => ({
      ...prev,
      kinesioUserIds: prev.kinesioUserIds.includes(id)
        ? prev.kinesioUserIds.filter((value) => value !== id)
        : [...prev.kinesioUserIds, id],
    }));
  }

  return (
    <section className="mt-10 grid grid-cols-1 xl:grid-cols-[1.1fr_1.9fr] gap-6">
      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-condensed font-bold text-3xl text-starfeet-blue uppercase">Crear Cupón</h2>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Código</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="KINESIO-10"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Tipo descuento</span>
              <select
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                value={form.discountType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, discountType: e.target.value as CreateCouponPayload["discountType"] }))
                }
              >
                <option value="PERCENTAGE">Porcentaje</option>
                <option value="FIXED_AMOUNT">Monto fijo</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Valor</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                type="number"
                min={1}
                value={form.discountValue}
                onChange={(e) => setForm((prev) => ({ ...prev, discountValue: Number(e.target.value) }))}
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Usos máximos</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                type="number"
                min={1}
                value={form.maxUses}
                onChange={(e) => setForm((prev) => ({ ...prev, maxUses: Number(e.target.value) }))}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Caducidad</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Tipo comisión</span>
              <select
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                value={form.commissionType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, commissionType: e.target.value as CreateCouponPayload["commissionType"] }))
                }
              >
                <option value="PERCENTAGE">Porcentaje</option>
                <option value="FIXED_AMOUNT">Monto fijo</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Valor comisión</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                type="number"
                min={0}
                value={form.commissionValue}
                onChange={(e) => setForm((prev) => ({ ...prev, commissionValue: Number(e.target.value) }))}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isStackable}
              onChange={(e) => setForm((prev) => ({ ...prev, isStackable: e.target.checked }))}
            />
            Cupón acumulable
          </label>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-gray-600">Asignar profesionales</legend>
            <div className="mt-2 max-h-40 overflow-auto rounded-xl border border-gray-200 p-2">
              {kinesios.map((kinesio) => (
                <label key={kinesio.id} className="flex items-center gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={form.kinesioUserIds.includes(kinesio.id)}
                    onChange={() => toggleKinesio(kinesio.id)}
                  />
                  <span>
                    {kinesio.name ?? "Sin nombre"} ({kinesio.email})
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Crear cupón"}
          </button>
        </form>
      </article>

      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-condensed font-bold text-3xl text-starfeet-blue uppercase">Cupones</h2>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
            placeholder="Filtrar por código"
            value={codeFilter}
            onChange={(e) => setCodeFilter(e.target.value)}
          />
          <select
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <select
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
            value={kinesioFilter}
            onChange={(e) => setKinesioFilter(e.target.value)}
          >
            <option value="">Todos los profesionales</option>
            {kinesios.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name ?? k.email}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 space-y-3">
          {coupons.length === 0 && <p className="text-sm text-gray-500">No hay cupones para ese filtro.</p>}
          {coupons.map((coupon) => (
            <div key={coupon.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-condensed font-bold text-xl text-starfeet-blue uppercase">{coupon.code}</h3>
                <span
                  className={`text-xs font-bold uppercase ${
                    coupon.isActive ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {coupon.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-700">
                {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `${coupon.discountValue} fijo`} ·{" "}
                {coupon.isStackable ? "Acumulable" : "No acumulable"} · Vence{" "}
                {new Date(coupon.expiresAt).toLocaleDateString()}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Uso {coupon.usageCount}/{coupon.maxUses}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(coupon)}
                  className="rounded-lg border border-starfeet-blue px-2 py-1 text-xs font-bold text-starfeet-blue"
                  disabled={loading}
                >
                  {coupon.isActive ? "Desactivar" : "Activar"}
                </button>
                <button
                  type="button"
                  onClick={() => updateMaxUses(coupon, coupon.maxUses + 10)}
                  className="rounded-lg border border-gray-400 px-2 py-1 text-xs font-bold text-gray-700"
                  disabled={loading}
                >
                  +10 usos
                </button>
              </div>

              <div className="mt-3 space-y-1">
                {coupon.assignments.length === 0 && <p className="text-xs text-gray-500">Sin asignaciones.</p>}
                {coupon.assignments.map((assignment) => (
                  <div key={assignment.kinesioUser.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-gray-600">
                      {assignment.kinesioUser.name ?? assignment.kinesioUser.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => revokeAssignment(coupon.id, assignment.kinesioUser.id)}
                      className="rounded-md border border-red-300 px-2 py-0.5 font-bold text-red-600"
                      disabled={loading}
                    >
                      Revocar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
