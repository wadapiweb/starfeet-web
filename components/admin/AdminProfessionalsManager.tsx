"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { EntityActionsMenu } from "@/components/atoms/EntityActionsMenu";
import { EntityFormModal } from "@/components/atoms/EntityFormModal";

type ModalMode = "create" | "view" | "edit";

type Professional = {
  id: string;
  slug?: string | null;
  name: string | null;
  email: string;
  phone?: string | null;
  isActive?: boolean;
  createdAt?: string;
};

type ProfessionalForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
};

const initialForm: ProfessionalForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  isActive: true,
};

export function AdminProfessionalsManager() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [createForm, setCreateForm] = useState<ProfessionalForm>(initialForm);
  const [editForm, setEditForm] = useState<ProfessionalForm>(initialForm);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selected = useMemo(
    () => professionals.find((professional) => professional.id === selectedId) ?? null,
    [professionals, selectedId],
  );

  const canCreate = useMemo(() => {
    return Boolean(createForm.email.trim() && createForm.password.trim().length >= 8);
  }, [createForm]);

  const canEdit = useMemo(() => {
    return Boolean(editForm.email.trim() && (editForm.password.length === 0 || editForm.password.length >= 8));
  }, [editForm]);

  const loadProfessionals = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/v1/admin/kinesios", { cache: "no-store" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload?.error ?? "No se pudieron cargar los profesionales");
    setProfessionals(payload.professionals ?? payload.kinesios ?? []);
  }, []);

  useEffect(() => {
    loadProfessionals().catch((e) => setError(e instanceof Error ? e.message : "Error inesperado"));
  }, [loadProfessionals]);

  function openCreateModal() {
    setCreateForm(initialForm);
    setSelectedId(null);
    setModalMode("create");
  }

  function openViewModal(professional: Professional) {
    setSelectedId(professional.id);
    setEditForm({
      name: professional.name ?? "",
      email: professional.email,
      phone: professional.phone ?? "",
      password: "",
      isActive: professional.isActive ?? true,
    });
    setModalMode("view");
  }

  function openEditModal(professional: Professional) {
    openViewModal(professional);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedId(null);
  }

  async function onCreate(event?: FormEvent) {
    event?.preventDefault();
    if (!canCreate) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/v1/admin/kinesios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.toLowerCase().trim(),
          phone: createForm.phone.trim(),
          password: createForm.password,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo crear el profesional");

      closeModal();
      setSuccess("Profesional creado correctamente.");
      await loadProfessionals();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function onSaveEdit(event?: FormEvent) {
    event?.preventDefault();
    if (!selected || !canEdit) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/admin/kinesios/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim() || null,
          email: editForm.email.toLowerCase().trim(),
          phone: editForm.phone.trim() || null,
          isActive: editForm.isActive,
          ...(editForm.password.trim().length > 0 ? { password: editForm.password } : {}),
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo editar el profesional");

      closeModal();
      setSuccess("Profesional actualizado correctamente.");
      await loadProfessionals();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function requestDelete(professional: Professional) {
    setPendingDelete(professional);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/admin/kinesios/${pendingDelete.id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo eliminar el profesional");

      closeModal();
      setSuccess("Profesional eliminado correctamente.");
      await loadProfessionals();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setPendingDelete(null);
      setLoading(false);
    }
  }

  const modalTitle =
    modalMode === "create"
      ? "Agregar profesional"
      : modalMode === "edit"
        ? "Editar profesional"
        : "Ver profesional";

  const headerActions =
    selected && modalMode ? (
      <EntityActionsMenu
        onView={() => openViewModal(selected)}
        onEdit={() => openEditModal(selected)}
        onDelete={() => requestDelete(selected)}
      />
    ) : undefined;

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <div>
          <h2 className="font-condensed text-3xl font-bold uppercase text-starfeet-blue">Profesionales</h2>
          <p className="text-sm text-gray-600">Alta y administración de kinesiología.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="cursor-pointer rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white"
        >
          Agregar profesional
        </button>
      </header>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p> : null}

      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="overflow-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.14em] text-gray-600">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2">Alta</th>
                <th className="px-3 py-2">Detalle</th>
                <th className="px-3 py-2 text-right">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {professionals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-sm text-gray-500">No hay profesionales cargados.</td>
                </tr>
              ) : (
                professionals.map((professional) => (
                  <tr key={professional.id} className="border-t border-gray-200">
                    <td className="px-3 py-2 text-gray-800">
                      <button
                        type="button"
                        onClick={() => openViewModal(professional)}
                        className="cursor-pointer text-left font-semibold text-starfeet-blue hover:underline"
                      >
                        {professional.name ?? "Sin nombre"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{professional.email}</td>
                    <td className="px-3 py-2 text-gray-600">{professional.slug ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-600">{professional.createdAt ? professional.createdAt.slice(0, 10) : "-"}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/professionals/${professional.slug ?? professional.id}`}
                        className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-700 hover:bg-gray-100"
                      >
                        Ver métricas
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex">
                        <EntityActionsMenu
                          onView={() => openViewModal(professional)}
                          onEdit={() => openEditModal(professional)}
                          onDelete={() => requestDelete(professional)}
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
        submitLabel={modalMode === "create" ? "Crear profesional" : "Editar profesional"}
      >
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Nombre</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              value={modalMode === "create" ? createForm.name : editForm.name}
              onChange={(e) =>
                modalMode === "create"
                  ? setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  : setEditForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Nombre del profesional"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Email</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              type="email"
              value={modalMode === "create" ? createForm.email : editForm.email}
              onChange={(e) =>
                modalMode === "create"
                  ? setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                  : setEditForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="profesional@email.com"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Teléfono</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              value={modalMode === "create" ? createForm.phone : editForm.phone}
              onChange={(e) =>
                modalMode === "create"
                  ? setCreateForm((prev) => ({ ...prev, phone: e.target.value }))
                  : setEditForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="Opcional"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
              {modalMode === "create" ? "Contraseña inicial" : "Nueva contraseña (opcional)"}
            </span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              type="password"
              minLength={8}
              value={modalMode === "create" ? createForm.password : editForm.password}
              onChange={(e) =>
                modalMode === "create"
                  ? setCreateForm((prev) => ({ ...prev, password: e.target.value }))
                  : setEditForm((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder={modalMode === "create" ? "Mínimo 8 caracteres" : "Dejar vacío para no cambiar"}
            />
          </label>

          {modalMode !== "create" ? (
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Profesional activo
            </label>
          ) : null}
        </form>
      </EntityFormModal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Eliminar profesional"
        description={
          pendingDelete
            ? `Se desactivará "${pendingDelete.name ?? pendingDelete.email}" y perderá acceso al sistema.`
            : ""
        }
        confirmLabel="Eliminar profesional"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={loading}
      />
    </section>
  );
}
