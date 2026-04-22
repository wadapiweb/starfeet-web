"use client";

import {
  ADMIN_SETTING_CATEGORIES,
  ADMIN_SETTING_CATEGORIES_META,
  ADMIN_SETTING_DEFAULTS,
  ADMIN_SETTING_DEFINITIONS_BY_CATEGORY,
  type AdminSettingCategory,
  type AdminSettingDefinition,
  type AdminSettingValue,
  getActivePaymentProviders,
} from "@/lib/admin-settings";
import { useMemo, useState } from "react";
import { ToggleSwitch } from "@/components/atoms/ToggleSwitch";

type AdminSettingsState = Record<AdminSettingCategory, Record<string, AdminSettingValue>>;

type Props = {
  initialSettings: AdminSettingsState;
};

function providerLabel(provider: string) {
  switch (provider) {
    case "MERCADOPAGO":
      return "MercadoPago";
    case "TRANSFERENCIA":
      return "Transferencia";
    case "PAYPAL":
      return "PayPal";
    default:
      return provider;
  }
}

function SettingsField({
  definition,
  value,
  onChange,
}: {
  definition: AdminSettingDefinition;
  value: AdminSettingValue;
  onChange: (value: AdminSettingValue) => void;
}) {
  const inputBase =
    "mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-starfeet-blue focus:outline-none focus:ring-2 focus:ring-starfeet-blue/20";

  return (
    <label className="block rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="block text-sm font-bold text-gray-900">{definition.label}</span>
          <p className="mt-1 text-xs text-gray-500">{definition.description}</p>
        </div>
        {definition.kind === "boolean" ? (
          <ToggleSwitch
            checked={Boolean(value)}
            onChange={(checked) => onChange(checked)}
            ariaLabel={definition.label}
          />
        ) : null}
      </div>

      {definition.kind === "select" ? (
        <select
          className={inputBase}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        >
          {definition.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}

      {definition.kind === "text" || definition.kind === "email" ? (
        <input
          className={inputBase}
          type={definition.kind}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {definition.kind === "textarea" ? (
        <textarea
          className={inputBase}
          rows={4}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {definition.kind === "number" ? (
        <input
          className={inputBase}
          type="number"
          min={definition.min}
          max={definition.max}
          step={definition.step ?? 1}
          value={Number(value)}
          onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))}
        />
      ) : null}

      <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-500">
        <span>{definition.category}</span>
        <span>{definition.key}</span>
      </div>
    </label>
  );
}

export function AdminSettingsPanel({ initialSettings }: Props) {
  const [drafts, setDrafts] = useState<AdminSettingsState>(initialSettings);
  const [activeCategory, setActiveCategory] = useState<AdminSettingCategory>("general");
  const [savingCategory, setSavingCategory] = useState<AdminSettingCategory | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeDefinitions = ADMIN_SETTING_DEFINITIONS_BY_CATEGORY[activeCategory];
  const activeSettings = drafts[activeCategory];
  const activeDefaults = ADMIN_SETTING_DEFAULTS[activeCategory];

  const summary = useMemo(() => {
    const paymentProviders = getActivePaymentProviders(drafts.payments);
    return [
      {
        label: "Carrito",
        value: `${drafts.commerce.cartTtlMinutes} min`,
        note: "TTL activo de carrito y reapertura automática",
      },
      {
        label: "Stock",
        value: `${drafts.commerce.defaultLowStockThreshold} unidades`,
        note: "Umbral base para inventarios nuevos",
      },
      {
        label: "Pagos",
        value: paymentProviders.length ? paymentProviders.map(providerLabel).join(" / ") : "Sin pasarelas",
        note: `Predeterminado: ${providerLabel(String(drafts.payments.defaultPaymentProvider))}`,
      },
      {
        label: "Seguridad",
        value: `${drafts.security.minPasswordLength} caracteres`,
        note: `Guest checkout: ${drafts.commerce.guestCheckoutEnabled ? "activo" : "bloqueado"}`,
      },
    ];
  }, [drafts]);

  function updateField(category: AdminSettingCategory, key: string, value: AdminSettingValue) {
    setDrafts((current) => ({
      ...current,
      [category]: {
        ...current[category],
        [key]: value,
      },
    }));
  }

  function resetCategory(category: AdminSettingCategory) {
    setDrafts((current) => ({
      ...current,
      [category]: { ...ADMIN_SETTING_DEFAULTS[category] },
    }));
    setMessage(`Se restauró ${ADMIN_SETTING_CATEGORIES_META[category].title} a sus valores por defecto.`);
    setError(null);
  }

  async function saveCategory(category: AdminSettingCategory) {
    setSavingCategory(category);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/v1/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          values: drafts[category],
        }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error ?? "No se pudo guardar la configuración");
      }

      setDrafts((current) => ({
        ...current,
        [category]: json.settings ?? current[category],
      }));
      setMessage(`Configuración de ${ADMIN_SETTING_CATEGORIES_META[category].title} guardada.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSavingCategory(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">
          Configuración Global
        </h2>
        <p className="max-w-3xl text-sm text-gray-600">
          Los cambios se guardan por categoría y se aplican en checkout, inventario, seguridad y flujos de compra.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <article key={item.label} className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{item.label}</p>
            <p className="mt-2 font-condensed text-2xl font-black uppercase text-starfeet-blue">{item.value}</p>
            <p className="mt-2 text-xs text-gray-500">{item.note}</p>
          </article>
        ))}
      </section>

      <div
        role="tablist"
        aria-label="Categorías de configuración"
        className="flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white p-2"
      >
        {ADMIN_SETTING_CATEGORIES.map((category) => {
          const meta = ADMIN_SETTING_CATEGORIES_META[category];
          const active = activeCategory === category;

          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`settings-panel-${category}`}
              id={`settings-tab-${category}`}
              onClick={() => setActiveCategory(category)}
              className={`rounded-xl px-4 py-3 text-left transition ${
                active
                  ? "bg-starfeet-blue text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="block text-sm font-bold">{meta.title}</span>
              <span className="block text-[11px] opacity-80">{meta.description}</span>
            </button>
          );
        })}
      </div>

      {message ? (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section
        id={`settings-panel-${activeCategory}`}
        role="tabpanel"
        aria-labelledby={`settings-tab-${activeCategory}`}
        className="rounded-2xl border border-gray-200 bg-white p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-condensed text-2xl font-black uppercase tracking-tight text-starfeet-blue">
              {ADMIN_SETTING_CATEGORIES_META[activeCategory].title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{ADMIN_SETTING_CATEGORIES_META[activeCategory].description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => resetCategory(activeCategory)}
              className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50"
            >
              Restaurar
            </button>
            <button
              type="button"
              onClick={() => saveCategory(activeCategory)}
              disabled={savingCategory === activeCategory}
              className="rounded-xl bg-starfeet-blue px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingCategory === activeCategory ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {activeDefinitions.map((definition) => (
            <SettingsField
              key={definition.key}
              definition={definition}
              value={activeSettings[definition.key] ?? activeDefaults[definition.key]}
              onChange={(value) => updateField(activeCategory, definition.key, value)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
