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

export function validateProductForm(form: ProductForm): ProductFormErrors {
  const errors: ProductFormErrors = {};
  const normalizedSlug = normalizeSlugCandidate(form.slug.trim());
  if (form.slug.trim() && !SLUG_PATTERN.test(normalizedSlug)) {
    errors.slug = "Usá minúsculas, números y guiones. El sistema lo normaliza al guardar.";
  }
  if (!form.name.trim()) errors.name = "El nombre es obligatorio.";
  if (!(Number(form.priceArs) > 0)) errors.priceArs = "Precio ARS debe ser mayor a 0.";
  if (!(Number(form.priceUsd) > 0)) errors.priceUsd = "Precio USD debe ser mayor a 0.";

  const variantErrors: ProductVariantError[] = [];
  let hasValidVariant = false;
  form.variants.forEach((variant, index) => {
    const rowErrors: ProductVariantError = {};
    const isBlank = !variant.color.trim() && String(variant.stock).trim() === "" && Number(variant.stock) === 0;
    if (isBlank) {
      variantErrors[index] = rowErrors;
      return;
    }
    hasValidVariant = true;
    if (!variant.color.trim()) rowErrors.color = "El color es obligatorio.";
    if (!variant.physicalSize) rowErrors.physicalSize = "El talle es obligatorio.";
    if (String(variant.stock).trim() === "" || Number(variant.stock) < 0) rowErrors.stock = "Stock válido requerido.";
    if (String(variant.lowStockThreshold).trim() === "" || Number(variant.lowStockThreshold) < 0) {
      rowErrors.lowStockThreshold = "Umbral válido requerido.";
    }
    variantErrors[index] = rowErrors;
  });

  if (!hasValidVariant) {
    errors.variants = [{ color: "Agregá al menos una variante con talle, color y stock." }];
  } else if (variantErrors.some((row) => Object.keys(row).length > 0)) {
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
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Variante {index + 1}</p>
          <p className="mt-1 text-xs text-gray-500">Definí talle, color, stock y si la variante se vende o no.</p>
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
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            onClick={onRemove}
          >
            Quitar
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Talle</span>
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
            buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
          {error?.physicalSize ? <span className="mt-1 block text-xs font-semibold text-red-700">{error.physicalSize}</span> : null}
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Color</span>
          <input
            className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${error?.color ? "border-red-500 bg-red-50" : "border-gray-300"}`}
            value={variant.color}
            onChange={(e) => onChange({ ...variant, color: e.target.value })}
            placeholder="Negro"
          />
          {error?.color ? <span className="mt-1 block text-xs font-semibold text-red-700">{error.color}</span> : null}
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Stock</span>
          <input
            className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${error?.stock ? "border-red-500 bg-red-50" : "border-gray-300"}`}
            type="number"
            min={0}
            value={variant.stock}
            onChange={(e) => onChange({ ...variant, stock: e.target.value })}
          />
          {error?.stock ? <span className="mt-1 block text-xs font-semibold text-red-700">{error.stock}</span> : null}
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Bajo stock</span>
          <input
            className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${error?.lowStockThreshold ? "border-red-500 bg-red-50" : "border-gray-300"}`}
            type="number"
            min={0}
            value={variant.lowStockThreshold}
            onChange={(e) => onChange({ ...variant, lowStockThreshold: e.target.value })}
          />
          {error?.lowStockThreshold ? <span className="mt-1 block text-xs font-semibold text-red-700">{error.lowStockThreshold}</span> : null}
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
    `mt-1 w-full rounded-xl border px-3 py-2 text-sm ${
      fieldErrors[name] ? "border-red-500 bg-red-50" : "border-gray-300"
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
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Slug</span>
          <input
            className={fieldClass("slug")}
            value={form.slug}
            onChange={(e) => onChange((prev) => ({ ...prev, slug: e.target.value }))}
            placeholder="zapatilla-run-01"
          />
          <p className="mt-1 text-[11px] text-gray-500">Si lo dejás vacío, se genera a partir del nombre.</p>
          {slugPreview ? <p className="mt-1 text-[11px] font-semibold text-starfeet-blue">/producto/{slugPreview}</p> : null}
          {fieldErrors.slug ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.slug}</span> : null}
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Nombre</span>
          <input
            className={fieldClass("name")}
            value={form.name}
            onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          {fieldErrors.name ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.name}</span> : null}
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Descripción</span>
        <textarea
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          rows={3}
          value={form.description}
          onChange={(e) => onChange((prev) => ({ ...prev, description: e.target.value }))}
        />
      </label>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Tipo</span>
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
            buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Precio ARS</span>
          <input
            className={fieldClass("priceArs")}
            type="number"
            min={0}
            step="0.01"
            value={form.priceArs}
            onChange={(e) => onChange((prev) => ({ ...prev, priceArs: e.target.value }))}
            required
          />
          {fieldErrors.priceArs ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.priceArs}</span> : null}
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Precio USD</span>
          <input
            className={fieldClass("priceUsd")}
            type="number"
            min={0}
            step="0.01"
            value={form.priceUsd}
            onChange={(e) => onChange((prev) => ({ ...prev, priceUsd: e.target.value }))}
            required
          />
          {fieldErrors.priceUsd ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.priceUsd}</span> : null}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Comparativo ARS</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            type="number"
            min={0}
            step="0.01"
            value={form.compareAtPriceArs}
            onChange={(e) => onChange((prev) => ({ ...prev, compareAtPriceArs: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Comparativo USD</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            type="number"
            min={0}
            step="0.01"
            value={form.compareAtPriceUsd}
            onChange={(e) => onChange((prev) => ({ ...prev, compareAtPriceUsd: e.target.value }))}
          />
        </label>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Imágenes del producto</p>
            <p className="mt-1 text-xs text-gray-500">Arrastrá para reordenar. También podés subir archivos al servidor.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
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
        {uploadError ? <p className="mt-2 text-xs font-semibold text-red-700">{uploadError}</p> : null}
        {uploadSuccess ? <p className="mt-2 text-xs font-semibold text-green-700">{uploadSuccess}</p> : null}
        {form.imageUrls.length > 0 ? (
          <ImageReorderGrid images={form.imageUrls} onChange={(next) => onChange((prev) => ({ ...prev, imageUrls: next }))} />
        ) : (
          <p className="mt-3 text-xs text-gray-500">Todavía no hay imágenes cargadas.</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ToggleSwitch
          checked={form.isActive}
          onChange={(checked) => onChange((prev) => ({ ...prev, isActive: checked }))}
          ariaLabel="Producto activo"
        />
        <span className="text-sm text-gray-700">Producto activo</span>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Variantes y stock</p>
            <p className="mt-1 text-xs text-gray-500">Cada línea representa un talle + color con su stock y estado.</p>
          </div>
          <button
            type="button"
            className="rounded-xl bg-starfeet-blue px-3 py-2 text-xs font-bold text-white"
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
          <p className="mt-2 text-xs font-semibold text-red-700">{fieldErrors.variants[0].color}</p>
        ) : null}
      </div>
    </form>
  );
}
