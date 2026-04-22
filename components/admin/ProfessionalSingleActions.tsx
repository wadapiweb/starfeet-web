"use client";

import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { EntityActionsMenu } from "@/components/atoms/EntityActionsMenu";
import { EntityFormModal } from "@/components/atoms/EntityFormModal";
import { ToggleSwitch } from "@/components/atoms/ToggleSwitch";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ProfessionalSingleActionsProps = {
  professional: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    isActive: boolean;
  };
};

type ProfessionalForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
};

type ProfessionalFormErrors = Partial<Record<"email" | "password", string>>;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validateForm(form: ProfessionalForm): ProfessionalFormErrors {
  const errors: ProfessionalFormErrors = {};
  if (!form.email.trim()) errors.email = "El email es obligatorio.";
  else if (!isValidEmail(form.email)) errors.email = "Formato de email inválido.";
  if (form.password.trim() && form.password.trim().length < 8) errors.password = "Debe tener al menos 8 caracteres.";
  return errors;
}

export function ProfessionalSingleActions({ professional }: ProfessionalSingleActionsProps) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ProfessionalFormErrors>({});
  const [form, setForm] = useState<ProfessionalForm>({
    name: professional.name ?? "",
    email: professional.email,
    phone: professional.phone ?? "",
    password: "",
    isActive: professional.isActive,
  });

  async function onSave() {
    const validationErrors = validateForm(form);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/kinesios/${professional.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || null,
          email: form.email.toLowerCase().trim(),
          phone: form.phone.trim() || null,
          isActive: form.isActive,
          ...(form.password.trim() ? { password: form.password } : {}),
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo editar el profesional");
      }
      setOpenEdit(false);
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "No se pudo editar el profesional");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/kinesios/${professional.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo eliminar el profesional");
      }
      router.push("/admin/professionals");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "No se pudo eliminar el profesional");
      setPendingDelete(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <EntityActionsMenu onEdit={() => setOpenEdit(true)} onDelete={() => setPendingDelete(true)} />

      <EntityFormModal
        open={openEdit}
        mode="edit"
        title="Editar profesional"
        loading={loading}
        onClose={() => setOpenEdit(false)}
        onSubmit={onSave}
        submitLabel="Editar profesional"
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-gray-600">Nombre</span><input className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
          <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-gray-600">Email</span><input className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${fieldErrors.email ? "border-red-500 bg-red-50" : "border-gray-300"}`} type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />{fieldErrors.email ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.email}</span> : null}</label>
          <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-gray-600">Teléfono</span><input className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></label>
          <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-gray-600">Nueva contraseña (opcional)</span><input className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${fieldErrors.password ? "border-red-500 bg-red-50" : "border-gray-300"}`} type="password" minLength={8} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />{fieldErrors.password ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.password}</span> : null}</label>
          <div className="flex items-center gap-3">
            <ToggleSwitch
              checked={form.isActive}
              onChange={(checked) => setForm((p) => ({ ...p, isActive: checked }))}
              ariaLabel="Profesional activo"
            />
            <span className="text-sm text-gray-700">Profesional activo</span>
          </div>
        </form>
      </EntityFormModal>

      <ConfirmDialog
        open={pendingDelete}
        title="Eliminar profesional"
        description={`Se desactivará "${professional.name ?? professional.email}" y perderá acceso al sistema.`}
        confirmLabel="Eliminar profesional"
        onCancel={() => setPendingDelete(false)}
        onConfirm={onDelete}
        loading={loading}
      />
    </>
  );
}
