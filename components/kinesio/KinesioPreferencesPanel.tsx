"use client";

import { useEffect, useState } from "react";

import { DropdownSelect } from "@/components/atoms/DropdownSelect";
import { ToggleSwitch } from "@/components/atoms/ToggleSwitch";

type KinesioSettings = {
  dashboardRangeDays: number;
  tableDensity: "comfortable" | "compact";
  showQuickTips: boolean;
  autoRefreshMinutes: number;
};

const rangeOptions = [
  { label: "7 días", value: "7" },
  { label: "15 días", value: "15" },
  { label: "30 días", value: "30" },
  { label: "60 días", value: "60" },
  { label: "90 días", value: "90" },
];

const densityOptions = [
  { label: "Cómodo", value: "comfortable", description: "Más aire y separación entre bloques." },
  { label: "Compacto", value: "compact", description: "Más información visible por pantalla." },
];

const refreshOptions = [
  { label: "Sin auto refresco", value: "0" },
  { label: "Cada 5 min", value: "5" },
  { label: "Cada 15 min", value: "15" },
  { label: "Cada 30 min", value: "30" },
];

export function KinesioPreferencesPanel() {
  const [settings, setSettings] = useState<KinesioSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/kinesio/settings", { cache: "no-store" });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error ?? "No se pudo cargar la configuración");
        setSettings(payload.settings as KinesioSettings);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error inesperado");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const update = <K extends keyof KinesioSettings>(key: K, value: KinesioSettings[K]) => {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/kinesio/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error ?? "No se pudieron guardar los cambios");
      setSettings(payload.settings as KinesioSettings);
      setMessage("Preferencias guardadas.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5">
        <div>
          <h2 className="font-condensed text-2xl font-black uppercase tracking-tight text-starfeet-blue">Preferencias</h2>
          <p className="mt-1 text-sm text-gray-600">Estas opciones afectan la lectura del panel y el comportamiento por defecto.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Rango por defecto</span>
            <DropdownSelect
              value={String(settings?.dashboardRangeDays ?? 30)}
              onChange={(value) => update("dashboardRangeDays", Number(value))}
              ariaLabel="Rango por defecto"
              placeholder="Seleccionar rango"
              options={rangeOptions}
              disabled={loading}
              className="mt-1"
              buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Densidad visual</span>
            <DropdownSelect
              value={settings?.tableDensity ?? "comfortable"}
              onChange={(value) => update("tableDensity", value as "comfortable" | "compact")}
              ariaLabel="Densidad visual"
              placeholder="Seleccionar densidad"
              options={densityOptions}
              disabled={loading}
              className="mt-1"
              buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Auto refresco</span>
            <DropdownSelect
              value={String(settings?.autoRefreshMinutes ?? 0)}
              onChange={(value) => update("autoRefreshMinutes", Number(value))}
              ariaLabel="Auto refresco"
              placeholder="Sin auto refresco"
              options={refreshOptions}
              disabled={loading}
              className="mt-1"
              buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="rounded-2xl border border-gray-200 bg-white p-3">
            <ToggleSwitch
              checked={settings?.showQuickTips ?? true}
              onChange={(checked) => update("showQuickTips", checked)}
              ariaLabel="Mostrar tips rápidos"
              label="Mostrar tips rápidos"
              description="Incluye ayudas contextuales en pantallas clave."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar preferencias"}
        </button>
      </form>
    </div>
  );
}

