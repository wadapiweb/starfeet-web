"use client";

import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { EntityActionsMenu } from "@/components/atoms/EntityActionsMenu";
import { EntityFormModal } from "@/components/atoms/EntityFormModal";
import { DropdownSelect } from "@/components/atoms/DropdownSelect";
import { ToggleSwitch } from "@/components/atoms/ToggleSwitch";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";

type CouponSingleActionsProps = {
  coupon: {
    id: string;
    code: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    commissionType: "PERCENTAGE" | "FIXED_AMOUNT";
    commissionValue: number;
    maxUses: number;
    usageCount: number;
    isStackable: boolean;
    isActive: boolean;
    expiresAt: string | null;
    assignments: Array<{ kinesioUser: { id: string; name: string | null; email: string } }>;
  };
  kinesios: Array<{ id: string; name: string | null; email: string }>;
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

function isoAtEndOfDay(dateValue: string) {
  return new Date(`${dateValue}T23:59:00.000Z`).toISOString();
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

export function CouponSingleActions({ coupon, kinesios }: CouponSingleActionsProps) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<CouponFormErrors>({});
  const [form, setForm] = useState<CouponForm>({
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxUses: coupon.maxUses,
    isStackable: coupon.isStackable,
    isActive: coupon.isActive,
    expiresAt: (coupon.expiresAt ?? "").slice(0, 10),
    commissionType: coupon.commissionType,
    commissionValue: coupon.commissionValue,
    kinesioUserIds: coupon.assignments.map((assignment) => assignment.kinesioUser.id),
  });

  function toggleKinesio(id: string) {
    setForm((prev) => ({
      ...prev,
      kinesioUserIds: prev.kinesioUserIds.includes(id)
        ? prev.kinesioUserIds.filter((value) => value !== id)
        : [...prev.kinesioUserIds, id],
    }));
  }

  async function onSave() {
    const validationErrors = validateCouponForm(form);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          code: form.code.toUpperCase().trim(),
          expiresAt: isoAtEndOfDay(form.expiresAt),
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo editar el cupón");
      }
      setOpenEdit(false);
      setFieldErrors({});
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "No se pudo editar el cupón");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/coupons/${coupon.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo eliminar el cupón");
      }
      router.push("/admin/coupons");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "No se pudo eliminar el cupón");
      setPendingDelete(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <EntityActionsMenu
        onEdit={() => {
          setFieldErrors({});
          setOpenEdit(true);
        }}
        onDelete={() => setPendingDelete(true)}
      />

      <EntityFormModal
        open={openEdit}
        mode="edit"
        title="Editar cupón"
        loading={loading}
        onClose={() => setOpenEdit(false)}
        onSubmit={onSave}
        submitLabel="Editar cupón"
      >
        <CouponFormFields
          form={form}
          kinesios={kinesios}
          onChange={setForm}
          onToggleKinesio={toggleKinesio}
          fieldErrors={fieldErrors}
        />
      </EntityFormModal>

      <ConfirmDialog
        open={pendingDelete}
        title="Eliminar cupón"
        description={`Se eliminará "${coupon.code}". Si tiene historial, puede desactivarse automáticamente.`}
        confirmLabel="Eliminar cupón"
        onCancel={() => setPendingDelete(false)}
        onConfirm={onDelete}
        loading={loading}
      />
    </>
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
  kinesios: Array<{ id: string; name: string | null; email: string }>;
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
          onChange={(e) => onChange((p) => ({ ...p, code: e.target.value }))}
          required
        />
        {fieldErrors.code ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.code}</span> : null}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Tipo descuento</span>
          <DropdownSelect
            value={form.discountType}
            onChange={(value) => onChange((p) => ({ ...p, discountType: value as CouponForm["discountType"] }))}
            ariaLabel="Tipo de descuento"
            options={[
              { value: "PERCENTAGE", label: "Porcentaje" },
              { value: "FIXED_AMOUNT", label: "Monto fijo" },
            ]}
            className="mt-1"
            buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Valor descuento</span>
          <input
            className={fieldClass("discountValue")}
            type="number"
            min={1}
            value={form.discountValue}
            onChange={(e) => onChange((p) => ({ ...p, discountValue: Number(e.target.value) }))}
            required
          />
          {fieldErrors.discountValue ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.discountValue}</span> : null}
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Tipo comisión</span>
          <DropdownSelect
            value={form.commissionType}
            onChange={(value) => onChange((p) => ({ ...p, commissionType: value as CouponForm["commissionType"] }))}
            ariaLabel="Tipo de comisión"
            options={[
              { value: "PERCENTAGE", label: "Porcentaje" },
              { value: "FIXED_AMOUNT", label: "Monto fijo" },
            ]}
            className="mt-1"
            buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Valor comisión</span>
          <input
            className={fieldClass("commissionValue")}
            type="number"
            min={0}
            value={form.commissionValue}
            onChange={(e) => onChange((p) => ({ ...p, commissionValue: Number(e.target.value) }))}
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
            onChange={(e) => onChange((p) => ({ ...p, maxUses: Number(e.target.value) }))}
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
            onChange={(e) => onChange((p) => ({ ...p, expiresAt: e.target.value }))}
            required
          />
          {fieldErrors.expiresAt ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.expiresAt}</span> : null}
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3">
          <ToggleSwitch
            checked={form.isStackable}
            onChange={(checked) => onChange((p) => ({ ...p, isStackable: checked }))}
            ariaLabel="Cupón acumulable"
          />
          <span className="text-sm text-gray-700">Cupón acumulable</span>
        </div>
        <div className="flex items-center gap-3">
          <ToggleSwitch
            checked={form.isActive}
            onChange={(checked) => onChange((p) => ({ ...p, isActive: checked }))}
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
