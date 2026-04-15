"use client";

import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { EntityActionsMenu } from "@/components/atoms/EntityActionsMenu";
import { EntityFormModal } from "@/components/atoms/EntityFormModal";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";

type ProductTypeValue = "STARFEET" | "SLIPPER" | "OTHER";

type ProductForm = {
  name: string;
  description: string;
  type: ProductTypeValue;
  priceArs: string;
  priceUsd: string;
  compareAtPriceArs: string;
  compareAtPriceUsd: string;
  imageUrlsText: string;
  isActive: boolean;
  stockS: string;
  stockM: string;
  stockL: string;
  lowStockThreshold: string;
};

type ProductFormErrors = Partial<
  Record<"name" | "priceArs" | "priceUsd" | "stockS" | "stockM" | "stockL" | "lowStockThreshold", string>
>;

type ProductSingleActionsProps = {
  product: {
    id: string;
    slug: string | null;
    name: string;
    description: string | null;
    type: ProductTypeValue;
    priceArs: number;
    priceUsd: number;
    compareAtPriceArs: number | null;
    compareAtPriceUsd: number | null;
    imageUrls: string[];
    isActive: boolean;
    inventories: Array<{ physicalSize: "S" | "M" | "L"; stock: number; lowStockThreshold: number }>;
  };
};

function fromProductToForm(product: ProductSingleActionsProps["product"]): ProductForm {
  return {
    name: product.name,
    description: product.description ?? "",
    type: product.type,
    priceArs: String(product.priceArs),
    priceUsd: String(product.priceUsd),
    compareAtPriceArs: product.compareAtPriceArs ? String(product.compareAtPriceArs) : "",
    compareAtPriceUsd: product.compareAtPriceUsd ? String(product.compareAtPriceUsd) : "",
    imageUrlsText: product.imageUrls.join("\n"),
    isActive: product.isActive,
    stockS: String(product.inventories.find((inv) => inv.physicalSize === "S")?.stock ?? 0),
    stockM: String(product.inventories.find((inv) => inv.physicalSize === "M")?.stock ?? 0),
    stockL: String(product.inventories.find((inv) => inv.physicalSize === "L")?.stock ?? 0),
    lowStockThreshold: String(product.inventories[0]?.lowStockThreshold ?? 5),
  };
}

function parseImageUrls(text: string) {
  return text
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean);
}

function toPayload(form: ProductForm) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    type: form.type,
    priceArs: Number(form.priceArs),
    priceUsd: Number(form.priceUsd),
    compareAtPriceArs: form.compareAtPriceArs ? Number(form.compareAtPriceArs) : null,
    compareAtPriceUsd: form.compareAtPriceUsd ? Number(form.compareAtPriceUsd) : null,
    imageUrls: parseImageUrls(form.imageUrlsText),
    isActive: form.isActive,
    inventories: [
      { physicalSize: "S", stock: Number(form.stockS), lowStockThreshold: Number(form.lowStockThreshold) },
      { physicalSize: "M", stock: Number(form.stockM), lowStockThreshold: Number(form.lowStockThreshold) },
      { physicalSize: "L", stock: Number(form.stockL), lowStockThreshold: Number(form.lowStockThreshold) },
    ],
  };
}

function validateProductForm(form: ProductForm): ProductFormErrors {
  const errors: ProductFormErrors = {};
  if (!form.name.trim()) errors.name = "El nombre es obligatorio.";
  if (!(Number(form.priceArs) > 0)) errors.priceArs = "Precio ARS debe ser mayor a 0.";
  if (!(Number(form.priceUsd) > 0)) errors.priceUsd = "Precio USD debe ser mayor a 0.";
  if (Number(form.stockS) < 0) errors.stockS = "No puede ser negativo.";
  if (Number(form.stockM) < 0) errors.stockM = "No puede ser negativo.";
  if (Number(form.stockL) < 0) errors.stockL = "No puede ser negativo.";
  if (Number(form.lowStockThreshold) < 0) errors.lowStockThreshold = "No puede ser negativo.";
  return errors;
}

export function ProductSingleActions({ product }: ProductSingleActionsProps) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProductFormErrors>({});
  const [form, setForm] = useState<ProductForm>(() => fromProductToForm(product));

  async function onSave() {
    const validationErrors = validateProductForm(form);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo editar el producto");
      }
      setOpenEdit(false);
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "No se pudo editar el producto");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo eliminar el producto");
      }
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "No se pudo eliminar el producto");
      setPendingDelete(false);
    } finally {
      setLoading(false);
    }
  }

  async function onUploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const formData = new FormData();
      formData.append("productId", product.slug ?? product.id);
      Array.from(files).forEach((file) => formData.append("files", file));

      const res = await fetch("/api/v1/admin/products/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error ?? "No se pudieron subir las imágenes");
      }

      const urls: string[] = Array.isArray(payload?.urls) ? payload.urls : [];
      if (urls.length === 0) {
        throw new Error("No se obtuvieron URLs de las imágenes");
      }

      setForm((prev) => {
        const current = parseImageUrls(prev.imageUrlsText);
        const merged = [...new Set([...current, ...urls])];
        return { ...prev, imageUrlsText: merged.join("\n") };
      });

      setUploadSuccess(`Imágenes subidas: ${urls.length}`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "No se pudieron subir las imágenes");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <EntityActionsMenu onEdit={() => setOpenEdit(true)} onDelete={() => setPendingDelete(true)} />

      <EntityFormModal
        open={openEdit}
        mode="edit"
        title="Editar producto"
        loading={loading || uploading}
        onClose={() => setOpenEdit(false)}
        onSubmit={onSave}
        submitLabel="Editar producto"
      >
        <ProductFormFields
          form={form}
          onChange={setForm}
          fieldErrors={fieldErrors}
          onUploadFiles={onUploadFiles}
          uploading={uploading}
          uploadError={uploadError}
          uploadSuccess={uploadSuccess}
        />
      </EntityFormModal>

      <ConfirmDialog
        open={pendingDelete}
        title="Eliminar producto"
        description={`Se eliminará "${product.name}". Si tiene historial, puede desactivarse automáticamente.`}
        confirmLabel="Eliminar producto"
        onCancel={() => setPendingDelete(false)}
        onConfirm={onDelete}
        loading={loading}
      />
    </>
  );
}

function ProductFormFields({
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

  return (
    <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Nombre</span>
        <input className={fieldClass("name")} value={form.name} onChange={(e) => onChange((p) => ({ ...p, name: e.target.value }))} />
        {fieldErrors.name ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.name}</span> : null}
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Descripción</span>
        <textarea className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" rows={3} value={form.description} onChange={(e) => onChange((p) => ({ ...p, description: e.target.value }))} />
      </label>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-gray-600">Tipo</span><select className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" value={form.type} onChange={(e) => onChange((p) => ({ ...p, type: e.target.value as ProductTypeValue }))}><option value="STARFEET">STARFEET</option><option value="SLIPPER">SLIPPER</option><option value="OTHER">OTHER</option></select></label>
        <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-gray-600">Precio ARS</span><input className={fieldClass("priceArs")} type="number" step="0.01" value={form.priceArs} onChange={(e) => onChange((p) => ({ ...p, priceArs: e.target.value }))} />{fieldErrors.priceArs ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.priceArs}</span> : null}</label>
        <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-gray-600">Precio USD</span><input className={fieldClass("priceUsd")} type="number" step="0.01" value={form.priceUsd} onChange={(e) => onChange((p) => ({ ...p, priceUsd: e.target.value }))} />{fieldErrors.priceUsd ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.priceUsd}</span> : null}</label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-gray-600">Comparativo ARS</span><input className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" type="number" step="0.01" value={form.compareAtPriceArs} onChange={(e) => onChange((p) => ({ ...p, compareAtPriceArs: e.target.value }))} /></label>
        <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-gray-600">Comparativo USD</span><input className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" type="number" step="0.01" value={form.compareAtPriceUsd} onChange={(e) => onChange((p) => ({ ...p, compareAtPriceUsd: e.target.value }))} /></label>
      </div>
      <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-gray-600">Image URLs (una por línea)</span><textarea className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" rows={3} value={form.imageUrlsText} onChange={(e) => onChange((p) => ({ ...p, imageUrlsText: e.target.value }))} /></label>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Subir imágenes al servidor (VPS)</p>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          multiple
          className="mt-2 block w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
          onChange={(e) => void onUploadFiles(e.target.files)}
          disabled={uploading}
        />
        <p className="mt-1 text-xs text-gray-500">Formatos: JPG, PNG, WEBP, AVIF. Máximo 8MB por archivo.</p>
        {uploadError ? <p className="mt-2 text-xs font-semibold text-red-700">{uploadError}</p> : null}
        {uploadSuccess ? <p className="mt-2 text-xs font-semibold text-green-700">{uploadSuccess}</p> : null}
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.isActive} onChange={(e) => onChange((p) => ({ ...p, isActive: e.target.checked }))} />Producto activo</label>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Control de stock por talle</p>
        <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="block"><span className="text-[11px] font-bold uppercase text-gray-500">Stock S</span><input className={fieldClass("stockS")} type="number" value={form.stockS} onChange={(e) => onChange((p) => ({ ...p, stockS: e.target.value }))} />{fieldErrors.stockS ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.stockS}</span> : null}</label>
          <label className="block"><span className="text-[11px] font-bold uppercase text-gray-500">Stock M</span><input className={fieldClass("stockM")} type="number" value={form.stockM} onChange={(e) => onChange((p) => ({ ...p, stockM: e.target.value }))} />{fieldErrors.stockM ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.stockM}</span> : null}</label>
          <label className="block"><span className="text-[11px] font-bold uppercase text-gray-500">Stock L</span><input className={fieldClass("stockL")} type="number" value={form.stockL} onChange={(e) => onChange((p) => ({ ...p, stockL: e.target.value }))} />{fieldErrors.stockL ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.stockL}</span> : null}</label>
          <label className="block"><span className="text-[11px] font-bold uppercase text-gray-500">Umbral bajo stock</span><input className={fieldClass("lowStockThreshold")} type="number" value={form.lowStockThreshold} onChange={(e) => onChange((p) => ({ ...p, lowStockThreshold: e.target.value }))} />{fieldErrors.lowStockThreshold ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.lowStockThreshold}</span> : null}</label>
        </div>
      </div>
    </form>
  );
}
