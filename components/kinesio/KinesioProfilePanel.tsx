"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  slug: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: string;
};

export function KinesioProfilePanel() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/kinesio/profile", { cache: "no-store" });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error ?? "No se pudo cargar el perfil");
        const user = payload.user as Profile;
        setProfile(user);
        setForm({
          name: user.name ?? "",
          phone: user.phone ?? "",
          currentPassword: "",
          newPassword: "",
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error inesperado");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/v1/kinesio/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo actualizar el perfil");
      setProfile(payload.user as Profile);
      setForm((current) => ({ ...current, currentPassword: "", newPassword: "" }));
      setMessage("Perfil actualizado correctamente.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Estado" value={profile?.isActive ? "Activo" : "Inactivo"} loading={loading} />
        <MetricCard label="Rol" value={profile?.role ?? "KINESIOLOGO"} loading={loading} />
        <MetricCard label="Alta" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("es-AR") : "N/A"} loading={loading} />
      </section>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5">
        <div>
          <h2 className="font-condensed text-2xl font-black uppercase tracking-tight text-starfeet-blue">Datos del perfil</h2>
          <p className="mt-1 text-sm text-gray-600">Actualizá tu nombre y teléfono. El email no se modifica desde acá.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field
            label="Nombre"
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            placeholder="Tu nombre visible"
          />
          <Field
            label="Teléfono"
            value={form.phone}
            onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
            placeholder="+54 9 ..."
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field
            label="Contraseña actual"
            value={form.currentPassword}
            onChange={(value) => setForm((current) => ({ ...current, currentPassword: value }))}
            placeholder="Opcional si no cambiás contraseña"
            type="password"
          />
          <Field
            label="Nueva contraseña"
            value={form.newPassword}
            onChange={(value) => setForm((current) => ({ ...current, newPassword: value }))}
            placeholder="Dejar vacío si no cambia"
            type="password"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

function MetricCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-2 font-condensed text-2xl font-black text-starfeet-blue">{loading ? "..." : value}</p>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "password";
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-starfeet-blue/50 focus:ring-2 focus:ring-starfeet-blue/15"
      />
    </label>
  );
}
