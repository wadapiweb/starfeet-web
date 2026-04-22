"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dispatch, FormEvent, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { EntityActionsMenu } from "@/components/atoms/EntityActionsMenu";
import { EntityFormModal } from "@/components/atoms/EntityFormModal";
import { ToggleSwitch } from "@/components/atoms/ToggleSwitch";

type ModalMode = "create" | "view" | "edit";

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

type CouponFormErrors = Partial<Record<"code" | "discountValue" | "commissionValue" | "maxUses" | "expiresAt", string>>;

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

function toForm(coupon: Coupon): CouponForm {
  return {
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
  };
}

function validateCouponForm(form: CouponForm): CouponFormErrors {
  const errors: CouponFormErrors = {};
  if (!form.code.trim()) errors.code = "El código es obligatorio.";
  else if (form.code.trim().length < 3) errors.code = "Debe tener al menos 3 caracteres.";
  if (!(form.discountValue > 0)) errors.discountValue = "Debe ser mayor a 0.";
  if (!(form.maxUses > 0)) errors.maxUses = "Debe ser mayor a 0.";
  if (form.commissionValue < 0) errors.commissionValue = "No puede ser negativo.";
  if (!form.expiresAt) errors.expiresAt = "La fecha de caducidad es obligatoria.";
  return errors;
}

export function AdminCouponsManager({ initialEdit = null }: { initialEdit?: string | null }) {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [kinesios, setKinesios] = useState<Kinesio[]>([]);
  const [createForm, setCreateForm] = useState<CouponForm>(initialForm);
  const [editForm, setEditForm] = useState<CouponForm>(initialForm);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [couponPendingDelete, setCouponPendingDelete] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [codeFilter, setCodeFilter] = useState("");
  const [initialEditHandled, setInitialEditHandled] = useState(false);
  const [createErrors, setCreateErrors] = useState<CouponFormErrors>({});
  const [editErrors, setEditErrors] = useState<CouponFormErrors>({});

  const selected = useMemo(() => coupons.find((coupon) => coupon.id === selectedId) ?? null, [coupons, selectedId]);

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

  function openCreateModal() {
    setCreateForm(initialForm);
    setCreateErrors({});
    setSelectedId(null);
    setModalMode("create");
  }

  const openViewModal = useCallback((coupon: Coupon) => {
    setSelectedId(coupon.id);
    setEditForm(toForm(coupon));
    setModalMode("view");
  }, []);

  const openEditModal = useCallback((coupon: Coupon) => {
    openViewModal(coupon);
    setEditErrors({});
    setModalMode("edit");
  }, [openViewModal]);

  useEffect(() => {
    if (!initialEdit || initialEditHandled || coupons.length === 0) return;
    const target = coupons.find((coupon) => coupon.slug === initialEdit || coupon.id === initialEdit);
    if (!target) {
      setInitialEditHandled(true);
      return;
    }
    openEditModal(target);
    setInitialEditHandled(true);
  }, [coupons, initialEdit, initialEditHandled, openEditModal]);

  function closeModal() {
    setModalMode(null);
    setSelectedId(null);
  }

  async function onCreate(event?: FormEvent) {
    event?.preventDefault();
    const validationErrors = validateCouponForm(createForm);
    setCreateErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0 || !canCreate) return;

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

      closeModal();
      setSuccess("Cupón creado correctamente.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function onSaveEdit(event?: FormEvent) {
    event?.preventDefault();
    const validationErrors = validateCouponForm(editForm);
    setEditErrors(validationErrors);
    if (!selected || Object.keys(validationErrors).length > 0 || !canEdit) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/admin/coupons/${selected.id}`, {
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

      closeModal();
      setSuccess("Cupón actualizado correctamente.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function requestDelete(coupon: Coupon) {
    setCouponPendingDelete(coupon);
  }

  async function confirmDelete() {
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
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setCouponPendingDelete(null);
      setLoading(false);
    }
  }

  const modalTitle = modalMode === "create" ? "Agregar cupón" : modalMode === "edit" ? "Editar cupón" : "Ver cupón";
  const headerActions =
    selected && modalMode ? (
      <EntityActionsMenu
        onView={() => router.push(`/admin/coupons/${selected.slug ?? selected.id}`)}
        onEdit={() => openEditModal(selected)}
        onDelete={() => requestDelete(selected)}
      />
    ) : undefined;

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <div>
          <h2 className="font-condensed text-3xl font-bold uppercase text-starfeet-blue">Cupones</h2>
          <p className="text-sm text-gray-600">Creación y administración de cupones promocionales.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="cursor-pointer rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white"
        >
          Agregar cupón
        </button>
      </header>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p> : null}

      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="sr-only">Filtrar por código</span>
            <input
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
              placeholder="Filtrar por código"
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="sr-only">Filtrar por estado</span>
            <select
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
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
                <th className="px-3 py-2 text-right">Opciones</th>
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
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/coupons/${coupon.slug ?? coupon.id}`}
                        className="cursor-pointer font-bold text-starfeet-blue hover:underline"
                      >
                        {coupon.code}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `${coupon.discountValue} fijo`}
                    </td>
                    <td className="px-3 py-2">
                      {coupon.commissionType === "PERCENTAGE" ? `${coupon.commissionValue}%` : `${coupon.commissionValue} fijo`}
                    </td>
                    <td className="px-3 py-2">{coupon.usageCount}/{coupon.maxUses}</td>
                    <td className="px-3 py-2">{new Date(coupon.expiresAt).toISOString().slice(0, 10)}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${coupon.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                        {coupon.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {coupon.assignments.length === 0
                        ? "Sin asignar"
                        : coupon.assignments.map((assignment) => assignment.kinesioUser.name ?? assignment.kinesioUser.email).join(", ")}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <EntityActionsMenu
                          onView={() => router.push(`/admin/coupons/${coupon.slug ?? coupon.id}`)}
                          onEdit={() => openEditModal(coupon)}
                          onDelete={() => requestDelete(coupon)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <EntityFormModal
        open={Boolean(modalMode)}
        mode={modalMode ?? "view"}
        title={modalTitle}
        loading={loading}
        headerActions={headerActions}
        onClose={closeModal}
        onSubmit={modalMode === "create" ? () => onCreate() : modalMode === "edit" ? () => onSaveEdit() : undefined}
        submitLabel={modalMode === "create" ? "Crear cupón" : "Editar cupón"}
      >
        <CouponFormFields
          form={modalMode === "create" ? createForm : editForm}
          kinesios={kinesios}
          onChange={modalMode === "create" ? setCreateForm : setEditForm}
          onToggleKinesio={(id) => toggleKinesio(modalMode === "create" ? setCreateForm : setEditForm, id)}
          fieldErrors={modalMode === "create" ? createErrors : editErrors}
        />
      </EntityFormModal>

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
        onConfirm={confirmDelete}
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
  fieldErrors,
}: {
  form: CouponForm;
  kinesios: Kinesio[];
  onChange: Dispatch<SetStateAction<CouponForm>>;
  onToggleKinesio: (id: string) => void;
  fieldErrors: CouponFormErrors;
}) {
  const fieldClass = (name: keyof CouponFormErrors) =>
    `mt-1 w-full rounded-xl border px-3 py-2 text-sm ${
      fieldErrors[name] ? "border-red-500 bg-red-50" : "border-gray-300"
    }`;

  return (
    <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Código</span>
        <input
          className={fieldClass("code")}
          value={form.code}
          onChange={(e) => onChange((prev) => ({ ...prev, code: e.target.value }))}
          placeholder="KINESIO-10"
          required
        />
        {fieldErrors.code ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.code}</span> : null}
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
            className={fieldClass("discountValue")}
            type="number"
            min={1}
            value={form.discountValue}
            onChange={(e) => onChange((prev) => ({ ...prev, discountValue: Number(e.target.value) }))}
            required
          />
          {fieldErrors.discountValue ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.discountValue}</span> : null}
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Tipo comisión</span>
          <select
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            value={form.commissionType}
            onChange={(e) => onChange((prev) => ({ ...prev, commissionType: e.target.value as CouponForm["commissionType"] }))}
          >
            <option value="PERCENTAGE">Porcentaje</option>
            <option value="FIXED_AMOUNT">Monto fijo</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Valor comisión</span>
          <input
            className={fieldClass("commissionValue")}
            type="number"
            min={0}
            value={form.commissionValue}
            onChange={(e) => onChange((prev) => ({ ...prev, commissionValue: Number(e.target.value) }))}
          />
          {fieldErrors.commissionValue ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.commissionValue}</span> : null}
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Usos máximos</span>
          <input
            className={fieldClass("maxUses")}
            type="number"
            min={1}
            value={form.maxUses}
            onChange={(e) => onChange((prev) => ({ ...prev, maxUses: Number(e.target.value) }))}
            required
          />
          {fieldErrors.maxUses ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.maxUses}</span> : null}
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Caducidad</span>
          <input
            className={fieldClass("expiresAt")}
            type="date"
            value={form.expiresAt}
            onChange={(e) => onChange((prev) => ({ ...prev, expiresAt: e.target.value }))}
            required
          />
          {fieldErrors.expiresAt ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.expiresAt}</span> : null}
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3">
          <ToggleSwitch
            checked={form.isStackable}
            onChange={(checked) => onChange((prev) => ({ ...prev, isStackable: checked }))}
            ariaLabel="Cupón acumulable"
          />
          <span className="text-sm text-gray-700">Cupón acumulable</span>
        </div>
        <div className="flex items-center gap-3">
          <ToggleSwitch
            checked={form.isActive}
            onChange={(checked) => onChange((prev) => ({ ...prev, isActive: checked }))}
            ariaLabel="Cupón activo"
          />
          <span className="text-sm text-gray-700">Cupón activo</span>
        </div>
      </div>

      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-wider text-gray-600">Asignar profesionales</legend>
        <div className="mt-2 max-h-40 overflow-auto rounded-xl border border-gray-200 p-2">
          {kinesios.map((kinesio) => (
            <div key={kinesio.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm hover:bg-gray-50">
              <span>
                {kinesio.name ?? "Sin nombre"} ({kinesio.email})
              </span>
              <ToggleSwitch
                checked={form.kinesioUserIds.includes(kinesio.id)}
                onChange={() => onToggleKinesio(kinesio.id)}
                ariaLabel={`Asignar profesional ${kinesio.name ?? kinesio.email}`}
              />
            </div>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
