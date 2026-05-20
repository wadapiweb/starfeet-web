"use client";

import Image from "next/image";
import { Dispatch, SetStateAction, useState } from "react";
import { DropdownSelect } from "@/components/atoms/DropdownSelect";
import { ToggleSwitch } from "@/components/atoms/ToggleSwitch";
import { getProductTypeLabel, type ProductTypeValue } from "@/lib/product-types";
import { normalizeSlugCandidate } from "@/lib/slug";

export type ProductSizeValue = "S" | "M" | "L";
export type { ProductTypeValue } from "@/lib/product-types";
export { getProductTypeLabel } from "@/lib/product-types";

export type ProductVariantForm = {
  id?: string;
  physicalSize: ProductSizeValue;
  color: string;
  stock: string;
  lowStockThreshold: string;
  isActive: boolean;
};

export type ProductForm = {
  slug: string;
  name: string;
  description: string;
  type: ProductTypeValue;
  priceArs: string;
  priceUsd: string;
  compareAtPriceArs: string;
  compareAtPriceUsd: string;
  imageUrls: string[];
  isActive: boolean;
  variants: ProductVariantForm[];
};

export type ProductVariantError = Partial<Record<"physicalSize" | "color" | "stock" | "lowStockThreshold", string>>;

export type ProductFormErrors = Partial<
  Record<"slug" | "name" | "priceArs" | "priceUsd", string>
> & { variants?: ProductVariantError[] };

export type ProductRecordLike = {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  type: ProductTypeValue;
  imageUrls: string[];
  priceArs: number;
  priceUsd: number;
  compareAtPriceArs: number | null;
  compareAtPriceUsd: number | null;
  isActive: boolean;
  inventories: Array<{
    id: string;
    sku: string;
    physicalSize: ProductSizeValue;
    color: string;
    stock: number;
    lowStockThreshold: number;
    isActive: boolean;
    sortOrder: number;
  }>;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function createVariantRow(partial?: Partial<ProductVariantForm>): ProductVariantForm {
  return {
    id: partial?.id,
    physicalSize: partial?.physicalSize ?? "S",
    color: partial?.color ?? "",
    stock: partial?.stock ?? "0",
    lowStockThreshold: partial?.lowStockThreshold ?? "5",
    isActive: partial?.isActive ?? true,
  };
}

export function createEmptyProductForm(): ProductForm {
  return {
    slug: "",
    name: "",
    description: "",
    type: "STARFEET",
    priceArs: "",
    priceUsd: "",
    compareAtPriceArs: "",
    compareAtPriceUsd: "",
    imageUrls: [],
    isActive: true,
    variants: [createVariantRow({ physicalSize: "S", color: "", stock: "0", lowStockThreshold: "5", isActive: true })],
  };
}

export function fromProductToForm(product: ProductRecordLike): ProductForm {
  const sortedInventories = [...product.inventories].sort((a, b) => a.sortOrder - b.sortOrder || a.physicalSize.localeCompare(b.physicalSize));
  return {
    slug: product.slug ?? "",
    name: product.name,
    description: product.description ?? "",
    type: product.type,
    priceArs: String(product.priceArs),
    priceUsd: String(product.priceUsd),
    compareAtPriceArs: product.compareAtPriceArs ? String(product.compareAtPriceArs) : "",
    compareAtPriceUsd: product.compareAtPriceUsd ? String(product.compareAtPriceUsd) : "",
    imageUrls: product.imageUrls.filter(Boolean),
    isActive: product.isActive,
    variants:
      sortedInventories.length > 0
        ? sortedInventories.map((inventory) =>
            createVariantRow({
              id: inventory.id,
              physicalSize: inventory.physicalSize,
              color: inventory.color,
              stock: String(inventory.stock),
              lowStockThreshold: String(inventory.lowStockThreshold),
              isActive: inventory.isActive,
            }),
          )
        : [createVariantRow()],
  };
}

export function buildProductPayload(form: ProductForm) {
  return {
    slug: form.slug.trim() || null,
    name: form.name.trim(),
    description: form.description.trim() || null,
    type: form.type,
    priceArs: Number(form.priceArs),
    priceUsd: Number(form.priceUsd),
    compareAtPriceArs: form.compareAtPriceArs ? Number(form.compareAtPriceArs) : null,
    compareAtPriceUsd: form.compareAtPriceUsd ? Number(form.compareAtPriceUsd) : null,
    imageUrls: form.imageUrls.filter(Boolean),
    isActive: form.isActive,
    variants: form.variants
      .filter((variant) => {
        const blankColor = variant.color.trim() === "";
        const blankStock = String(variant.stock).trim() === "" || Number(variant.stock) === 0;
        return !blankColor || !blankStock || !variant.isActive;
      })
      .map((variant, index) => ({
        id: variant.id ?? null,
        physicalSize: variant.physicalSize,
        color: variant.color.trim() || "Negro",
        stock: Number(variant.stock),
        lowStockThreshold: Number(variant.lowStockThreshold),
        isActive: variant.isActive,
        sortOrder: index,
      })),
  };
}

import { ProductFormSchema } from "@/lib/validation";

export function validateProductForm(form: ProductForm): ProductFormErrors {
  const result = ProductFormSchema.safeParse(form);
  if (result.success) {
    return {};
  }

  const errors: ProductFormErrors = {};
  const variantErrors: ProductVariantError[] = [];

  result.error.issues.forEach((err) => {
    const path = err.path;
    const key = err.message;
    let msg = "";

    // Map Zod keys to Spanish validation messages
    if (key === "required") msg = "El nombre es obligatorio.";
    else if (key === "pricePositive") msg = "El precio debe ser mayor a 0.";
    else if (key === "slugInvalid") msg = "Usá minúsculas, números y guiones. El sistema lo normaliza al guardar.";
    else if (key === "variantRequired") msg = "Agregá al menos una variante con talle, color y stock.";
    else if (key === "colorRequired") msg = "El color es obligatorio.";
    else if (key === "sizeRequired") msg = "El talle es obligatorio.";
    else if (key === "stockInvalid") msg = "Stock válido requerido.";
    else if (key === "thresholdInvalid") msg = "Umbral válido requerido.";
    else msg = key;

    if (path[0] === "variants") {
      if (path.length === 1) {
        errors.variants = [{ color: msg }];
      } else {
        const index = path[1] as number;
        const subField = path[2] as keyof ProductVariantError;
        if (!variantErrors[index]) {
          variantErrors[index] = {};
        }
        variantErrors[index][subField] = msg;
      }
    } else {
      const fieldKey = path[0] as "slug" | "name" | "priceArs" | "priceUsd";
      errors[fieldKey] = msg;
    }
  });

  if (variantErrors.length > 0) {
    errors.variants = variantErrors;
  }

  return errors;
}

export function buildProductUploadKey(form: Pick<ProductForm, "slug" | "name">) {
  return normalizeSlugCandidate(form.slug.trim() || form.name.trim() || "product");
}

export function resolveProductSlugPreview(form: Pick<ProductForm, "slug" | "name">) {
  return normalizeSlugCandidate(form.slug.trim() || form.name.trim());
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function VariantEditor({
  variant,
  index,
  onChange,
  onRemove,
  error,
}: {
  variant: ProductVariantForm;
  index: number;
  onChange: (next: ProductVariantForm) => void;
  onRemove: () => void;
  error?: ProductVariantError;
}) {
  const inputClass = (errVal?: string) => [
    "mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed",
    errVal
      ? "border-red-500 bg-red-50 focus:ring-red-500/30 dark:border-red-500 dark:bg-red-950/20 dark:focus:ring-red-500/20 text-red-900 dark:text-red-200"
      : "border-gray-300 bg-white focus:ring-starfeet-blue/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-sky-300/30",
  ].join(" ");

  return (
    <article className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Variante {index + 1}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Definí talle, color, stock y si la variante se vende o no.</p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleSwitch
            checked={variant.isActive}
            onChange={(checked) => onChange({ ...variant, isActive: checked })}
            ariaLabel={`Variante ${index + 1} activa`}
            label={variant.isActive ? "Activa" : "Inactiva"}
          />
          <button
            type="button"
            className="rounded-xl border border-gray-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
            onClick={onRemove}
          >
            Quitar
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Talle</span>
          <DropdownSelect
            value={variant.physicalSize}
            onChange={(value) => onChange({ ...variant, physicalSize: value as ProductSizeValue })}
            ariaLabel={`Talle variante ${index + 1}`}
            options={[
              { value: "S", label: "S" },
              { value: "M", label: "M" },
              { value: "L", label: "L" },
            ]}
            className="mt-1"
            buttonClassName="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-starfeet-blue/30 dark:focus:ring-sky-300/30"
          />
          {error?.physicalSize ? <span className="mt-1 block text-xs font-semibold text-red-700 dark:text-red-400">{error.physicalSize}</span> : null}
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Color</span>
          <input
            className={inputClass(error?.color)}
            value={variant.color}
            onChange={(e) => onChange({ ...variant, color: e.target.value })}
            placeholder="Negro"
            aria-invalid={!!error?.color}
          />
          {error?.color ? <span className="mt-1 block text-xs font-semibold text-red-700 dark:text-red-400">{error.color}</span> : null}
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Stock</span>
          <input
            className={inputClass(error?.stock)}
            type="number"
            min={0}
            value={variant.stock}
            onChange={(e) => onChange({ ...variant, stock: e.target.value })}
            aria-invalid={!!error?.stock}
          />
          {error?.stock ? <span className="mt-1 block text-xs font-semibold text-red-700 dark:text-red-400">{error.stock}</span> : null}
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Bajo stock</span>
          <input
            className={inputClass(error?.lowStockThreshold)}
            type="number"
            min={0}
            value={variant.lowStockThreshold}
            onChange={(e) => onChange({ ...variant, lowStockThreshold: e.target.value })}
            aria-invalid={!!error?.lowStockThreshold}
          />
          {error?.lowStockThreshold ? <span className="mt-1 block text-xs font-semibold text-red-700 dark:text-red-400">{error.lowStockThreshold}</span> : null}
        </label>
      </div>
    </article>
  );
}

function ImageReorderGrid({
  images,
  onChange,
}: {
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  return (
    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {images.map((url, index) => (
        <article
          key={`${url}-${index}`}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex === null || dragIndex === index) return;
            onChange(moveItem(images, dragIndex, index));
            setDragIndex(null);
          }}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="relative aspect-square bg-gray-100">
            <Image src={url} alt={`Imagen ${index + 1}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
          </div>
          <div className="flex items-center justify-between gap-2 px-2 py-2">
            <span className="truncate text-[11px] text-gray-500">{url}</span>
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
                onClick={() => index > 0 && onChange(moveItem(images, index, index - 1))}
                disabled={index === 0}
              >
                ↑
              </button>
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
                onClick={() => index < images.length - 1 && onChange(moveItem(images, index, index + 1))}
                disabled={index === images.length - 1}
              >
                ↓
              </button>
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
              >
                Quitar
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function ProductFormFields({
  form,
  onChange,
  fieldErrors,
  onUploadFiles,
  uploading,
  uploadError,
  uploadSuccess,
}: {
  form: ProductForm;
  onChange: Dispatch<SetStateAction<ProductForm>>;
  fieldErrors: ProductFormErrors;
  onUploadFiles: (files: FileList | null) => Promise<void>;
  uploading: boolean;
  uploadError: string | null;
  uploadSuccess: string | null;
}) {
  const fieldClass = (name: keyof ProductFormErrors) =>
    `mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ${
      fieldErrors[name]
        ? "border-red-500 bg-red-50 focus:ring-red-500/30 dark:border-red-500 dark:bg-red-950/20 dark:focus:ring-red-500/20 text-red-900 dark:text-red-200"
        : "border-gray-300 bg-white focus:ring-starfeet-blue/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-sky-300/30"
    }`;

  const slugPreview = resolveProductSlugPreview(form);
  const variantErrors = fieldErrors.variants ?? [];

  const addVariant = () => {
    onChange((prev) => ({
      ...prev,
      variants: [...prev.variants, createVariantRow({ physicalSize: "S" })],
    }));
  };

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Slug</span>
          <input
            className={fieldClass("slug")}
            value={form.slug}
            onChange={(e) => onChange((prev) => ({ ...prev, slug: e.target.value }))}
            placeholder="zapatilla-run-01"
            aria-invalid={!!fieldErrors.slug}
            aria-describedby={fieldErrors.slug ? "slug-error" : undefined}
          />
          <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">Si lo dejás vacío, se genera a partir del nombre.</p>
          {slugPreview ? <p className="mt-1 text-[11px] font-semibold text-starfeet-blue dark:text-sky-400">/producto/{slugPreview}</p> : null}
          {fieldErrors.slug ? <span id="slug-error" className="mt-1 block text-xs font-semibold text-red-700 dark:text-red-400">{fieldErrors.slug}</span> : null}
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Nombre</span>
          <input
            className={fieldClass("name")}
            value={form.name}
            onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))}
            required
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
          />
          {fieldErrors.name ? <span id="name-error" className="mt-1 block text-xs font-semibold text-red-700 dark:text-red-400">{fieldErrors.name}</span> : null}
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Descripción</span>
        <textarea
          className="mt-1 w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-starfeet-blue/30 dark:focus:ring-sky-300/30"
          rows={3}
          value={form.description}
          onChange={(e) => onChange((prev) => ({ ...prev, description: e.target.value }))}
        />
      </label>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Tipo</span>
          <DropdownSelect
            value={form.type}
            onChange={(value) => onChange((prev) => ({ ...prev, type: value as ProductTypeValue }))}
            ariaLabel="Tipo de producto"
            options={[
              { value: "STARFEET", label: getProductTypeLabel("STARFEET") },
              { value: "SLIPPER", label: getProductTypeLabel("SLIPPER") },
              { value: "OTHER", label: getProductTypeLabel("OTHER") },
            ]}
            className="mt-1"
            buttonClassName="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-starfeet-blue/30 dark:focus:ring-sky-300/30"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Precio ARS</span>
          <input
            className={fieldClass("priceArs")}
            type="number"
            min={0}
            step="0.01"
            value={form.priceArs}
            onChange={(e) => onChange((prev) => ({ ...prev, priceArs: e.target.value }))}
            required
            aria-invalid={!!fieldErrors.priceArs}
            aria-describedby={fieldErrors.priceArs ? "priceArs-error" : undefined}
          />
          {fieldErrors.priceArs ? <span id="priceArs-error" className="mt-1 block text-xs font-semibold text-red-700 dark:text-red-400">{fieldErrors.priceArs}</span> : null}
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Precio USD</span>
          <input
            className={fieldClass("priceUsd")}
            type="number"
            min={0}
            step="0.01"
            value={form.priceUsd}
            onChange={(e) => onChange((prev) => ({ ...prev, priceUsd: e.target.value }))}
            required
            aria-invalid={!!fieldErrors.priceUsd}
            aria-describedby={fieldErrors.priceUsd ? "priceUsd-error" : undefined}
          />
          {fieldErrors.priceUsd ? <span id="priceUsd-error" className="mt-1 block text-xs font-semibold text-red-700 dark:text-red-400">{fieldErrors.priceUsd}</span> : null}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Comparativo ARS</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-starfeet-blue/30 dark:focus:ring-sky-300/30"
            type="number"
            min={0}
            step="0.01"
            value={form.compareAtPriceArs}
            onChange={(e) => onChange((prev) => ({ ...prev, compareAtPriceArs: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Comparativo USD</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-starfeet-blue/30 dark:focus:ring-sky-300/30"
            type="number"
            min={0}
            step="0.01"
            value={form.compareAtPriceUsd}
            onChange={(e) => onChange((prev) => ({ ...prev, compareAtPriceUsd: e.target.value }))}
          />
        </label>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Imágenes del producto</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Arrastrá para reordenar. También podés subir archivos al servidor.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              multiple
              className="sr-only"
              onChange={(e) => {
                void onUploadFiles(e.target.files);
                e.currentTarget.value = "";
              }}
              disabled={uploading}
            />
            {uploading ? "Subiendo..." : "Subir imágenes"}
          </label>
        </div>
        {uploadError ? <p className="mt-2 text-xs font-semibold text-red-700 dark:text-red-400">{uploadError}</p> : null}
        {uploadSuccess ? <p className="mt-2 text-xs font-semibold text-green-700 dark:text-green-400">{uploadSuccess}</p> : null}
        {form.imageUrls.length > 0 ? (
          <ImageReorderGrid images={form.imageUrls} onChange={(next) => onChange((prev) => ({ ...prev, imageUrls: next }))} />
        ) : (
          <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">Todavía no hay imágenes cargadas.</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ToggleSwitch
          checked={form.isActive}
          onChange={(checked) => onChange((prev) => ({ ...prev, isActive: checked }))}
          ariaLabel="Producto activo"
        />
        <span className="text-sm text-gray-700 dark:text-slate-200">Producto activo</span>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">Variantes y stock</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Cada línea representa un talle + color con su stock y estado.</p>
          </div>
          <button
            type="button"
            className="rounded-xl bg-starfeet-blue dark:bg-sky-400 dark:text-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-starfeet-blue/95 dark:hover:bg-sky-300"
            onClick={addVariant}
          >
            Agregar variante
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {form.variants.map((variant, index) => (
            <VariantEditor
              key={variant.id ?? `${variant.physicalSize}-${index}`}
              variant={variant}
              index={index}
              onChange={(next) =>
                onChange((prev) => {
                  const variants = [...prev.variants];
                  variants[index] = next;
                  return { ...prev, variants };
                })
              }
              onRemove={() =>
                onChange((prev) => ({
                  ...prev,
                  variants: prev.variants.filter((_, i) => i !== index),
                }))
              }
              error={variantErrors[index]}
            />
          ))}
        </div>

        {fieldErrors.variants?.[0]?.color ? (
          <p className="mt-2 text-xs font-semibold text-red-700 dark:text-red-400">{fieldErrors.variants[0].color}</p>
        ) : null}
      </div>
    </form>
  );
}
