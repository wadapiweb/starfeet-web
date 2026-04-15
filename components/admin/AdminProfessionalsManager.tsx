"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";

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
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ProfessionalForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProfessionalForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [professionalPendingDelete, setProfessionalPendingDelete] = useState<Professional | null>(null);

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

  async function onCreate(event: FormEvent) {
    event.preventDefault();
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

      setSuccess("Profesional creado correctamente.");
      setCreateForm(initialForm);
      setCreateOpen(false);
      await loadProfessionals();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function startEditing(professional: Professional) {
    setEditingId(professional.id);
    setCreateOpen(false);
    setEditForm({
      name: professional.name ?? "",
      email: professional.email,
      phone: professional.phone ?? "",
      password: "",
      isActive: professional.isActive ?? true,
    });
    setError(null);
    setSuccess(null);
  }

  async function onSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId || !canEdit) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/v1/admin/kinesios/${editingId}`, {
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

      setSuccess("Profesional actualizado correctamente.");
      setEditingId(null);
      setEditForm(initialForm);
      await loadProfessionals();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function requestDeleteProfessional(professional: Professional) {
    setProfessionalPendingDelete(professional);
  }

  async function confirmDeleteProfessional() {
    if (!professionalPendingDelete) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/admin/kinesios/${professionalPendingDelete.id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo eliminar el profesional");

      setSuccess("Profesional eliminado correctamente.");
      await loadProfessionals();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setProfessionalPendingDelete(null);
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <div>
          <h2 className="font-condensed text-3xl font-bold uppercase text-starfeet-blue">Profesionales</h2>
          <p className="text-sm text-gray-600">Alta y administración de kinesiología.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreateOpen((prev) => !prev);
            setEditingId(null);
          }}
          className="cursor-pointer rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white"
        >
          {createOpen ? "Cerrar" : "Agregar profesional"}
        </button>
      </header>

      {createOpen ? (
        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">Nuevo profesional</h3>
          <form className="mt-4 space-y-4" onSubmit={onCreate}>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Nombre</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del profesional"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Email</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="profesional@email.com"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Teléfono</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                value={createForm.phone}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Opcional"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Contraseña inicial</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                type="password"
                minLength={8}
                value={createForm.password}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading || !canCreate}
              className="cursor-pointer rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Crear profesional"}
            </button>
          </form>
        </article>
      ) : null}

      {editingId ? (
        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">Editar profesional</h3>
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

          <form className="mt-4 space-y-4" onSubmit={onSaveEdit}>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Nombre</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Email</span>
                <input
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Teléfono</span>
                <input
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Nueva contraseña (opcional)
              </span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                type="password"
                minLength={8}
                value={editForm.password}
                onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Dejar vacío para no cambiar"
              />
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Profesional activo
            </label>

            <button
              type="submit"
              disabled={loading || !canEdit}
              className="cursor-pointer rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </article>
      ) : null}

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
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {professionals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-sm text-gray-500">
                    No hay profesionales cargados.
                  </td>
                </tr>
              ) : (
                professionals.map((professional) => (
                  <tr key={professional.id} className="border-t border-gray-200">
                    <td className="px-3 py-2 text-gray-800">{professional.name ?? "Sin nombre"}</td>
                    <td className="px-3 py-2 text-gray-700">{professional.email}</td>
                    <td className="px-3 py-2 text-gray-600">{professional.slug ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {professional.createdAt ? professional.createdAt.slice(0, 10) : "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/professionals/${professional.slug ?? professional.id}`}
                          className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-gray-700 hover:bg-gray-100"
                        >
                          Ver
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEditing(professional)}
                          className="cursor-pointer rounded-lg border border-starfeet-blue/30 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-starfeet-blue hover:bg-starfeet-blue/5"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDeleteProfessional(professional)}
                          className="cursor-pointer rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50"
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
        open={Boolean(professionalPendingDelete)}
        title="Eliminar profesional"
        description={
          professionalPendingDelete
            ? `Se desactivará "${professionalPendingDelete.name ?? professionalPendingDelete.email}" y perderá acceso al sistema.`
            : ""
        }
        confirmLabel="Eliminar profesional"
        onCancel={() => setProfessionalPendingDelete(null)}
        onConfirm={confirmDeleteProfessional}
        loading={loading}
      />
    </section>
  );
}
