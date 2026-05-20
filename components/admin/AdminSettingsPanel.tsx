"use client";

import { DropdownSelect } from "@/components/atoms/DropdownSelect";
import { ToggleSwitch } from "@/components/atoms/ToggleSwitch";
import {
  ADMIN_SETTING_CATEGORIES,
  ADMIN_SETTING_CATEGORIES_META,
  ADMIN_SETTING_DEFAULTS,
  ADMIN_SETTING_DEFINITIONS_BY_CATEGORY,
  type AdminSettingCategory,
  type AdminSettingDefinition,
  type AdminSettingValue,
} from "@/lib/admin-settings";
import {
  createDefaultProductSizingMatrix,
  PRODUCT_SIZING_NUMBERS,
  parseProductSizingGenderMap,
  type ProductGender,
  type ProductSizingMatrix,
  type ProductSizingSlot,
} from "@/lib/product-sizing";
import { useState } from "react";

type AdminSettingsState = Record<AdminSettingCategory, Record<string, AdminSettingValue>>;

type Props = {
  initialSettings: AdminSettingsState;
};

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
          <ToggleSwitch checked={Boolean(value)} onChange={(checked) => onChange(checked)} ariaLabel={definition.label} />
        ) : null}
      </div>

      {definition.kind === "select" ? (
        <DropdownSelect
          value={String(value)}
          options={definition.options ?? []}
          onChange={onChange}
          ariaLabel={definition.label}
          className="mt-1"
          buttonClassName={inputBase}
          menuClassName="border-gray-200"
        />
      ) : null}

      {(definition.kind === "text" || definition.kind === "email") ? (
        <input
          className={inputBase}
          type={definition.kind}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {definition.kind === "textarea" ? (
        <textarea className={inputBase} rows={4} value={String(value)} onChange={(event) => onChange(event.target.value)} />
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

function TabIcon({ category, active }: { category: AdminSettingCategory; active: boolean }) {
  const className = `h-4 w-4 shrink-0 ${active ? "text-white" : "text-gray-500"}`;

  switch (category) {
    case "general":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M4 7h16M4 12h10M4 17h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "appearance":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M21 12.5A8.5 8.5 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "commerce":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M6 6h15l-1.5 8h-11L6 6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M6 6 5 3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="9" cy="19" r="1.5" fill="currentColor" />
          <circle cx="18" cy="19" r="1.5" fill="currentColor" />
        </svg>
      );
    case "sizing":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M4 7h16M7 7v10M17 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "payments":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
          <path d="M7 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "notifications":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M15 17H9m7-4V9a4 4 0 1 0-8 0v4l-2 2v1h14v-1l-2-2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "security":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9.5 12.5 11 14l3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

function SizingMatrixEditor({
  value,
  onChange,
}: {
  value: AdminSettingsState["sizing"];
  onChange: (next: AdminSettingsState["sizing"]) => void;
}) {
  const [activeGender, setActiveGender] = useState<ProductGender>("mujer");
  const parsedMatrix: ProductSizingMatrix = {
    mujer: parseProductSizingGenderMap(String(value.womenSizeMapJson)) ?? createDefaultProductSizingMatrix().mujer,
    hombre: parseProductSizingGenderMap(String(value.menSizeMapJson)) ?? createDefaultProductSizingMatrix().hombre,
  };

  function updateCell(gender: ProductGender, number: number, slot: ProductSizingSlot) {
    const nextMatrix: ProductSizingMatrix = {
      mujer: { ...parsedMatrix.mujer },
      hombre: { ...parsedMatrix.hombre },
    };
    nextMatrix[gender][String(number)] = slot;
    onChange({
      ...value,
      womenSizeMapJson: JSON.stringify(nextMatrix.mujer, null, 2),
      menSizeMapJson: JSON.stringify(nextMatrix.hombre, null, 2),
    });
  }

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2">
        {(["mujer", "hombre"] as const).map((gender) => {
          const active = activeGender === gender;
          return (
            <button
              key={gender}
              type="button"
              onClick={() => setActiveGender(gender)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                active ? "bg-starfeet-blue text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"
              }`}
            >
              {gender === "mujer" ? "Mujer" : "Hombre"}
            </button>
          );
        })}
      </div>

      <div className="mt-4 overflow-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-[0.14em] text-gray-600">
            <tr>
              <th className="px-3 py-2">Número</th>
              <th className="px-3 py-2">Talle</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCT_SIZING_NUMBERS.map((number) => {
              const selectedValue = parsedMatrix[activeGender][String(number)] ?? "-";
              return (
                <tr key={`${activeGender}-${number}`} className="border-t border-gray-200">
                  <td className="px-3 py-2 font-bold text-starfeet-blue">{number}</td>
                  <td className="px-3 py-2">
                    <DropdownSelect
                      value={selectedValue}
                      onChange={(next) => updateCell(activeGender, number, next as ProductSizingSlot)}
                      ariaLabel={`Talle ${number} ${activeGender}`}
                      options={[
                        { value: "S", label: "S" },
                        { value: "M", label: "M" },
                        { value: "L", label: "L" },
                        { value: "-", label: "- Sin talla" },
                      ]}
                      buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Usa `-` cuando ese número no existe para esa tabla. El front sólo mostrará los números que tengan un talle asignado.
      </p>
    </div>
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

      {message ? <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div
        role="tablist"
        aria-label="Categorías de configuración"
        className="flex gap-2 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2"
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
              className={`flex min-w-44 items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                active
                  ? "border-starfeet-blue bg-starfeet-blue text-white"
                  : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <TabIcon category={category} active={active} />
              <span className="min-w-0">
                <span className="block text-sm font-bold">{meta.title}</span>
                <span className={`block text-[11px] ${active ? "text-white/80" : "text-gray-500"}`}>{meta.description}</span>
              </span>
            </button>
          );
        })}
      </div>

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

        {activeCategory === "appearance" ? (
          <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-bold uppercase tracking-wider text-gray-700">Aplicación visual</p>
            <p className="mt-1">
              Este ajuste controla el tema del backoffice. Claro prioriza contraste sobre fondos blancos; oscuro reduce fatiga visual
              en jornadas largas.
            </p>
          </div>
        ) : null}

        {activeCategory === "sizing" ? (
          <SizingMatrixEditor
            value={activeSettings as AdminSettingsState["sizing"]}
            onChange={(next) => {
              setDrafts((current) => ({
                ...current,
                sizing: next,
              }));
            }}
          />
        ) : (
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
        )}
      </section>
    </div>
  );
}
