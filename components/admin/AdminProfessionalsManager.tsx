"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Professional = {
  id: string;
  name: string | null;
  email: string;
  createdAt?: string;
};

type CreateProfessionalForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

const initialForm: CreateProfessionalForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

export function AdminProfessionalsManager() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [form, setForm] = useState<CreateProfessionalForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadProfessionals = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/v1/admin/kinesios", { cache: "no-store" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error ?? "No se pudieron cargar los profesionales");
    }
    setProfessionals(payload.professionals ?? payload.kinesios ?? []);
  }, []);

  useEffect(() => {
    loadProfessionals().catch((e) => setError(e instanceof Error ? e.message : "Error inesperado"));
  }, [loadProfessionals]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/v1/admin/kinesios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.toLowerCase().trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error ?? "No se pudo crear el profesional");
      }

      setSuccess("Profesional creado correctamente.");
      setForm(initialForm);
      await loadProfessionals();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1.9fr]">
      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-condensed text-3xl font-bold uppercase text-starfeet-blue">Agregar profesional</h2>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Nombre</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nombre del profesional"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Email</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="profesional@email.com"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Teléfono</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Opcional"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Contraseña inicial</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
              required
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-green-700">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Crear profesional"}
          </button>
        </form>
      </article>

      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-condensed text-3xl font-bold uppercase text-starfeet-blue">Profesionales activos</h2>
        <div className="mt-4 overflow-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.14em] text-gray-600">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Alta</th>
              </tr>
            </thead>
            <tbody>
              {professionals.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-sm text-gray-500">
                    No hay profesionales cargados.
                  </td>
                </tr>
              ) : (
                professionals.map((professional) => (
                  <tr key={professional.id} className="border-t border-gray-200">
                    <td className="px-3 py-2 text-gray-800">{professional.name ?? "Sin nombre"}</td>
                    <td className="px-3 py-2 text-gray-700">{professional.email}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {professional.createdAt
                        ? professional.createdAt.slice(0, 10)
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
