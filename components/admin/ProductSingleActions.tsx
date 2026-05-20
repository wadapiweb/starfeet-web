"use client";

import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { EntityActionsMenu } from "@/components/atoms/EntityActionsMenu";
import { EntityFormModal } from "@/components/atoms/EntityFormModal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ProductForm as ProductEditorForm,
  ProductFormErrors as ProductEditorFormErrors,
  ProductFormFields as ProductEditorFormFields,
  ProductTypeValue,
  buildProductPayload as buildEditorProductPayload,
  buildProductUploadKey as buildEditorProductUploadKey,
  fromProductToForm as fromEditorProductToForm,
  validateProductForm as validateEditorProductForm,
} from "@/components/admin/ProductFormFields";

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
    inventories: Array<{
      id: string;
      sku: string;
      physicalSize: "S" | "M" | "L";
      color: string;
      stock: number;
      lowStockThreshold: number;
      isActive: boolean;
      sortOrder: number;
    }>;
  };
};

export function ProductSingleActions({ product }: ProductSingleActionsProps) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProductEditorFormErrors>({});
  const [form, setForm] = useState<ProductEditorForm>(() => fromEditorProductToForm(product));

  useEffect(() => {
    setForm(fromEditorProductToForm(product));
  }, [product]);

  async function onSave() {
    const validationErrors = validateEditorProductForm(form);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildEditorProductPayload(form)),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo editar el producto");
      const updatedSlug = payload?.product?.slug ?? (form.slug.trim() || "");
      setOpenEdit(false);
      if (updatedSlug && updatedSlug !== (product.slug ?? product.id)) {
        router.push(`/admin/products/${updatedSlug}`);
      } else {
        router.refresh();
      }
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
      formData.append("productId", buildEditorProductUploadKey(form));
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
        const merged = [...new Set([...prev.imageUrls, ...urls])];
        return { ...prev, imageUrls: merged };
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
    <EntityActionsMenu
      onEdit={() => {
        setUploadError(null);
        setUploadSuccess(null);
        setOpenEdit(true);
      }}
      onDelete={() => setPendingDelete(true)}
    />

      <EntityFormModal
        open={openEdit}
        mode="edit"
        title="Editar producto"
        loading={loading || uploading}
        onClose={() => setOpenEdit(false)}
        onSubmit={onSave}
        submitLabel="Editar producto"
      >
        <ProductEditorFormFields
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
