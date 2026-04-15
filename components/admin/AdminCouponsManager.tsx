"use client";

import Link from "next/link";
import { Dispatch, FormEvent, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";

type Kinesio = {
  id: string;
  name: string | null;
  email: string;
};

type Coupon = {
  id: string;
  slug: string | null;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  commissionType: "PERCENTAGE" | "FIXED_AMOUNT";
  commissionValue: number;
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

type CouponForm = {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxUses: number;
  isStackable: boolean;
  isActive: boolean;
  expiresAt: string;
  commissionType: "PERCENTAGE" | "FIXED_AMOUNT";
  commissionValue: number;
  kinesioUserIds: string[];
};

const initialForm: CouponForm = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: 10,
  maxUses: 50,
  isStackable: false,
  isActive: true,
  expiresAt: "",
  commissionType: "PERCENTAGE",
  commissionValue: 5,
  kinesioUserIds: [],
};

function isoAtEndOfDay(dateValue: string) {
  return new Date(`${dateValue}T23:59:00.000Z`).toISOString();
}

function dateOnly(iso: string | null | undefined) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function AdminCouponsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [kinesios, setKinesios] = useState<Kinesio[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CouponForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CouponForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [codeFilter, setCodeFilter] = useState("");
  const [couponPendingDelete, setCouponPendingDelete] = useState<Coupon | null>(null);

  const canCreate = useMemo(() => {
    return (
      createForm.code.trim().length >= 3 &&
      createForm.discountValue > 0 &&
      createForm.maxUses > 0 &&
      createForm.commissionValue >= 0 &&
      createForm.expiresAt.length > 0
    );
  }, [createForm]);

  const canEdit = useMemo(() => {
    return (
      editForm.code.trim().length >= 3 &&
      editForm.discountValue > 0 &&
      editForm.maxUses > 0 &&
      editForm.commissionValue >= 0 &&
      editForm.expiresAt.length > 0
    );
  }, [editForm]);

  const loadData = useCallback(async () => {
    setError(null);
    const search = new URLSearchParams();
    if (statusFilter !== "all") search.set("status", statusFilter);
    if (codeFilter.trim()) search.set("code", codeFilter.trim());

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
  }, [codeFilter, statusFilter]);

  useEffect(() => {
    loadData().catch((e) => setError(e instanceof Error ? e.message : "Error de carga"));
  }, [loadData]);

  function toggleKinesio(formSetter: Dispatch<SetStateAction<CouponForm>>, id: string) {
    formSetter((prev) => ({
      ...prev,
      kinesioUserIds: prev.kinesioUserIds.includes(id)
        ? prev.kinesioUserIds.filter((value) => value !== id)
        : [...prev.kinesioUserIds, id],
    }));
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!canCreate) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/v1/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          code: createForm.code.toUpperCase().trim(),
          expiresAt: isoAtEndOfDay(createForm.expiresAt),
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "Error al crear cupón");

      setSuccess("Cupón creado correctamente.");
      setCreateForm(initialForm);
      setCreateOpen(false);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function startEditing(coupon: Coupon) {
    setEditingId(coupon.id);
    setCreateOpen(false);
    setEditForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxUses: coupon.maxUses,
      isStackable: coupon.isStackable,
      isActive: coupon.isActive,
      expiresAt: dateOnly(coupon.expiresAt),
      commissionType: coupon.commissionType,
      commissionValue: coupon.commissionValue,
      kinesioUserIds: coupon.assignments.map((assignment) => assignment.kinesioUser.id),
    });
  }

  async function onSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId || !canEdit) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/admin/coupons/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          code: editForm.code.toUpperCase().trim(),
          expiresAt: isoAtEndOfDay(editForm.expiresAt),
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo editar el cupón");

      setSuccess("Cupón actualizado correctamente.");
      setEditingId(null);
      setEditForm(initialForm);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function requestDeleteCoupon(coupon: Coupon) {
    setCouponPendingDelete(coupon);
  }

  async function confirmDeleteCoupon() {
    if (!couponPendingDelete) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/admin/coupons/${couponPendingDelete.id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo eliminar el cupón");

      const mode = payload?.mode === "deactivated" ? "desactivado por seguridad" : "eliminado";
      setSuccess(`Cupón ${mode} correctamente.`);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setCouponPendingDelete(null);
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <div>
          <h2 className="font-condensed text-3xl font-bold uppercase text-starfeet-blue">Cupones</h2>
          <p className="text-sm text-gray-600">Creación y administración de cupones promocionales.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreateOpen((prev) => !prev);
            setEditingId(null);
          }}
          className="cursor-pointer rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white"
        >
          {createOpen ? "Cerrar" : "Agregar cupón"}
        </button>
      </header>

      {createOpen ? (
        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">Nuevo cupón</h3>
          <CouponFormFields
            form={createForm}
            kinesios={kinesios}
            onChange={setCreateForm}
            onToggleKinesio={(id) => toggleKinesio(setCreateForm, id)}
            onSubmit={onCreate}
            loading={loading}
            submitLabel="Crear cupón"
            canSubmit={canCreate}
          />
        </article>
      ) : null}

      {editingId ? (
        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">Editar cupón</h3>
            <button
              type="button"
              className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setEditingId(null);
                setEditForm(initialForm);
              }}
            >
              Cancelar
            </button>
          </div>

          <CouponFormFields
            form={editForm}
            kinesios={kinesios}
            onChange={setEditForm}
            onToggleKinesio={(id) => toggleKinesio(setEditForm, id)}
            onSubmit={onSaveEdit}
            loading={loading}
            submitLabel="Guardar cambios"
            canSubmit={canEdit}
          />
        </article>
      ) : null}

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p> : null}

      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
        </div>

        <div className="mt-4 overflow-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.14em] text-gray-600">
              <tr>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Descuento</th>
                <th className="px-3 py-2">Comisión</th>
                <th className="px-3 py-2">Usos</th>
                <th className="px-3 py-2">Vence</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Profesionales</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-gray-500">No hay cupones para ese filtro.</td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-t border-gray-200">
                    <td className="px-3 py-2 font-bold text-starfeet-blue">{coupon.code}</td>
                    <td className="px-3 py-2">
                      {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `${coupon.discountValue} fijo`}
                    </td>
                    <td className="px-3 py-2">
                      {coupon.commissionType === "PERCENTAGE" ? `${coupon.commissionValue}%` : `${coupon.commissionValue} fijo`}
                    </td>
                    <td className="px-3 py-2">
                      {coupon.usageCount}/{coupon.maxUses}
                    </td>
                    <td className="px-3 py-2">{new Date(coupon.expiresAt).toISOString().slice(0, 10)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${coupon.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}
                      >
                        {coupon.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {coupon.assignments.length === 0
                        ? "Sin asignar"
                        : coupon.assignments
                            .map((assignment) => assignment.kinesioUser.name ?? assignment.kinesioUser.email)
                            .join(", ")}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/coupons/${coupon.slug ?? coupon.id}`}
                          className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-700 hover:bg-gray-100"
                        >
                          Ver
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEditing(coupon)}
                          className="cursor-pointer rounded-lg border border-starfeet-blue/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-starfeet-blue hover:bg-starfeet-blue/5"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDeleteCoupon(coupon)}
                          className="cursor-pointer rounded-lg border border-red-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <ConfirmDialog
        open={Boolean(couponPendingDelete)}
        title="Eliminar cupón"
        description={
          couponPendingDelete
            ? `Se eliminará el cupón "${couponPendingDelete.code}". Si tiene historial, quedará desactivado automáticamente.`
            : ""
        }
        confirmLabel="Eliminar cupón"
        onCancel={() => setCouponPendingDelete(null)}
        onConfirm={confirmDeleteCoupon}
        loading={loading}
      />
    </section>
  );
}

function CouponFormFields({
  form,
  kinesios,
  onChange,
  onToggleKinesio,
  onSubmit,
  loading,
  submitLabel,
  canSubmit,
}: {
  form: CouponForm;
  kinesios: Kinesio[];
  onChange: Dispatch<SetStateAction<CouponForm>>;
  onToggleKinesio: (id: string) => void;
  onSubmit: (event: FormEvent) => Promise<void> | void;
  loading: boolean;
  submitLabel: string;
  canSubmit: boolean;
}) {
  return (
    <form className="mt-4 space-y-4" onSubmit={onSubmit}>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Código</span>
        <input
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          value={form.code}
          onChange={(e) => onChange((prev) => ({ ...prev, code: e.target.value }))}
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
            onChange={(e) => onChange((prev) => ({ ...prev, discountType: e.target.value as CouponForm["discountType"] }))}
          >
            <option value="PERCENTAGE">Porcentaje</option>
            <option value="FIXED_AMOUNT">Monto fijo</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Valor descuento</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            type="number"
            min={1}
            value={form.discountValue}
            onChange={(e) => onChange((prev) => ({ ...prev, discountValue: Number(e.target.value) }))}
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
              onChange((prev) => ({ ...prev, commissionType: e.target.value as CouponForm["commissionType"] }))
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
            onChange={(e) => onChange((prev) => ({ ...prev, commissionValue: Number(e.target.value) }))}
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
            onChange={(e) => onChange((prev) => ({ ...prev, maxUses: Number(e.target.value) }))}
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Caducidad</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            type="date"
            value={form.expiresAt}
            onChange={(e) => onChange((prev) => ({ ...prev, expiresAt: e.target.value }))}
            required
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isStackable}
            onChange={(e) => onChange((prev) => ({ ...prev, isStackable: e.target.checked }))}
          />
          Cupón acumulable
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => onChange((prev) => ({ ...prev, isActive: e.target.checked }))}
          />
          Cupón activo
        </label>
      </div>

      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-wider text-gray-600">Asignar profesionales</legend>
        <div className="mt-2 max-h-40 overflow-auto rounded-xl border border-gray-200 p-2">
          {kinesios.map((kinesio) => (
            <label key={kinesio.id} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
              <input
                type="checkbox"
                checked={form.kinesioUserIds.includes(kinesio.id)}
                onChange={() => onToggleKinesio(kinesio.id)}
              />
              <span>
                {kinesio.name ?? "Sin nombre"} ({kinesio.email})
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="cursor-pointer rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {loading ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
