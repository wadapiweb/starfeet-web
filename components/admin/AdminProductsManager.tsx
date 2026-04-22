"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { EntityActionsMenu } from "@/components/atoms/EntityActionsMenu";
import { EntityFormModal } from "@/components/atoms/EntityFormModal";
import { DropdownSelect } from "@/components/atoms/DropdownSelect";
import { ToggleSwitch } from "@/components/atoms/ToggleSwitch";

type ProductTypeValue = "STARFEET" | "SLIPPER" | "OTHER";
type ModalMode = "create" | "view" | "edit";

type Product = {
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
    physicalSize: "S" | "M" | "L";
    stock: number;
    lowStockThreshold: number;
  }>;
};

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

const initialForm: ProductForm = {
  name: "",
  description: "",
  type: "STARFEET",
  priceArs: "",
  priceUsd: "",
  compareAtPriceArs: "",
  compareAtPriceUsd: "",
  imageUrlsText: "",
  isActive: true,
  stockS: "0",
  stockM: "0",
  stockL: "0",
  lowStockThreshold: "5",
};

function parseImageUrls(text: string) {
  return text
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean);
}

function fromProductToForm(product: Product): ProductForm {
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

export function AdminProductsManager({ initialEdit = null }: { initialEdit?: string | null }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [createForm, setCreateForm] = useState<ProductForm>(initialForm);
  const [editForm, setEditForm] = useState<ProductForm>(initialForm);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ProductTypeValue>("all");
  const [initialEditHandled, setInitialEditHandled] = useState(false);
  const [createErrors, setCreateErrors] = useState<ProductFormErrors>({});
  const [editErrors, setEditErrors] = useState<ProductFormErrors>({});

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const canCreate = useMemo(() => {
    return Boolean(createForm.name.trim() && Number(createForm.priceArs) > 0 && Number(createForm.priceUsd) > 0);
  }, [createForm]);

  const canEdit = useMemo(() => {
    return Boolean(editForm.name.trim() && Number(editForm.priceArs) > 0 && Number(editForm.priceUsd) > 0);
  }, [editForm]);

  const loadProducts = useCallback(async () => {
    setError(null);
    const searchParams = new URLSearchParams();
    if (search.trim()) searchParams.set("search", search.trim());
    if (statusFilter !== "all") searchParams.set("status", statusFilter);
    if (typeFilter !== "all") searchParams.set("type", typeFilter);

    const res = await fetch(`/api/v1/admin/products?${searchParams.toString()}`, { cache: "no-store" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload?.error ?? "No se pudieron cargar los productos");
    setProducts(payload.products ?? []);
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    loadProducts().catch((e) => setError(e instanceof Error ? e.message : "Error inesperado"));
  }, [loadProducts]);

  useEffect(() => {
    if (!initialEdit || initialEditHandled || products.length === 0) return;
    const target = products.find((product) => product.slug === initialEdit || product.id === initialEdit);
    if (!target) {
      setInitialEditHandled(true);
      return;
    }
    openEditModal(target);
    setInitialEditHandled(true);
  }, [initialEdit, initialEditHandled, products]);

  function openCreateModal() {
    setCreateForm(initialForm);
    setCreateErrors({});
    setSelectedProductId(null);
    setModalMode("create");
  }

  function openEditModal(product: Product) {
    setSelectedProductId(product.id);
    setEditForm(fromProductToForm(product));
    setEditErrors({});
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedProductId(null);
  }

  async function onCreate() {
    const validationErrors = validateProductForm(createForm);
    setCreateErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0 || !canCreate) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/v1/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(createForm)),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo crear el producto");

      closeModal();
      setCreateForm(initialForm);
      setSuccess("Producto creado correctamente.");
      await loadProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function onSaveEdit() {
    const validationErrors = validateProductForm(editForm);
    setEditErrors(validationErrors);
    if (!selectedProduct || Object.keys(validationErrors).length > 0 || !canEdit) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/admin/products/${selectedProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(editForm)),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo actualizar el producto");

      closeModal();
      setSuccess("Producto actualizado correctamente.");
      await loadProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function requestDeleteProduct(product: Product) {
    setProductPendingDelete(product);
  }

  async function confirmDeleteProduct() {
    if (!productPendingDelete) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/admin/products/${productPendingDelete.id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo eliminar el producto");

      const mode = payload?.mode === "deactivated" ? "desactivado por seguridad" : "eliminado";
      setSuccess(`Producto ${mode} correctamente.`);
      await loadProducts();
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setProductPendingDelete(null);
      setLoading(false);
    }
  }

  const modalTitle =
    modalMode === "create"
      ? "Agregar producto"
      : modalMode === "edit"
        ? "Editar producto"
        : "Ver producto";

  const modalActions =
    selectedProduct && modalMode ? (
      <EntityActionsMenu
        onView={() => router.push(`/admin/products/${selectedProduct.slug ?? selectedProduct.id}`)}
        onEdit={() => openEditModal(selectedProduct)}
        onDelete={() => requestDeleteProduct(selectedProduct)}
        viewAsUserHref={`/tienda/producto/${selectedProduct.slug ?? selectedProduct.id}`}
      />
    ) : undefined;

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <div>
          <h2 className="font-condensed text-3xl font-bold uppercase text-starfeet-blue">Productos</h2>
          <p className="text-sm text-gray-600">Gestión de catálogo con stock por talle.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="cursor-pointer rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white"
        >
          Agregar producto
        </button>
      </header>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p> : null}

      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block">
            <span className="sr-only">Buscar productos</span>
            <input
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
              placeholder="Buscar por nombre o slug"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="sr-only">Filtrar por estado</span>
            <DropdownSelect
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}
              ariaLabel="Filtrar por estado"
              options={[
                { value: "all", label: "Todos" },
                { value: "active", label: "Activos" },
                { value: "inactive", label: "Inactivos" },
              ]}
              buttonClassName="rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="sr-only">Filtrar por tipo</span>
            <DropdownSelect
              value={typeFilter}
              onChange={(value) => setTypeFilter(value as "all" | ProductTypeValue)}
              ariaLabel="Filtrar por tipo"
              options={[
                { value: "all", label: "Todos los tipos" },
                { value: "STARFEET", label: "STARFEET" },
                { value: "SLIPPER", label: "SLIPPER" },
                { value: "OTHER", label: "OTHER" },
              ]}
              buttonClassName="rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-4 overflow-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.14em] text-gray-600">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">ARS</th>
                <th className="px-3 py-2">USD</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2 text-right">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-gray-500">Sin productos.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-t border-gray-200">
                    <td className="px-3 py-2 text-gray-800">
                      <Link
                        href={`/admin/products/${product.slug ?? product.id}`}
                        className="cursor-pointer font-semibold text-starfeet-blue hover:underline"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{product.slug ?? "-"}</td>
                    <td className="px-3 py-2">{product.type}</td>
                    <td className="px-3 py-2">{Number(product.priceArs).toFixed(2)}</td>
                    <td className="px-3 py-2">{Number(product.priceUsd).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      {product.inventories.map((inv) => (
                        <p key={inv.id} className={`text-xs ${inv.stock <= inv.lowStockThreshold ? "font-bold text-amber-700" : "text-gray-700"}`}>
                          {inv.physicalSize}: {inv.stock}
                        </p>
                      ))}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${product.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                        {product.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <EntityActionsMenu
                          onView={() => router.push(`/admin/products/${product.slug ?? product.id}`)}
                          onEdit={() => openEditModal(product)}
                          onDelete={() => requestDeleteProduct(product)}
                          viewAsUserHref={`/tienda/producto/${product.slug ?? product.id}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <EntityFormModal
        open={Boolean(modalMode)}
        mode={modalMode ?? "view"}
        title={modalTitle}
        loading={loading}
        headerActions={modalActions}
        onClose={closeModal}
        onSubmit={modalMode === "create" ? onCreate : modalMode === "edit" ? onSaveEdit : undefined}
        submitLabel={modalMode === "create" ? "Crear producto" : "Editar producto"}
      >
        <ProductFormFields
          form={modalMode === "create" ? createForm : editForm}
          onChange={modalMode === "create" ? setCreateForm : setEditForm}
          fieldErrors={modalMode === "create" ? createErrors : editErrors}
        />
      </EntityFormModal>

      <ConfirmDialog
        open={Boolean(productPendingDelete)}
        title="Eliminar producto"
        description={
          productPendingDelete
            ? `Se eliminará "${productPendingDelete.name}". Si tiene relaciones históricas, se desactivará automáticamente.`
            : ""
        }
        confirmLabel="Eliminar producto"
        onCancel={() => setProductPendingDelete(null)}
        onConfirm={confirmDeleteProduct}
        loading={loading}
      />
    </section>
  );
}

function ProductFormFields({
  form,
  onChange,
  fieldErrors,
}: {
  form: ProductForm;
  onChange: Dispatch<SetStateAction<ProductForm>>;
  fieldErrors: ProductFormErrors;
}) {
  const fieldClass = (name: keyof ProductFormErrors) =>
    `mt-1 w-full rounded-xl border px-3 py-2 text-sm ${
      fieldErrors[name] ? "border-red-500 bg-red-50" : "border-gray-300"
    }`;

  return (
    <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Nombre</span>
        <input className={fieldClass("name")} value={form.name} onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))} required />
        {fieldErrors.name ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.name}</span> : null}
      </label>

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
              { value: "STARFEET", label: "STARFEET" },
              { value: "SLIPPER", label: "SLIPPER" },
              { value: "OTHER", label: "OTHER" },
            ]}
            className="mt-1"
            buttonClassName="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Precio ARS</span>
          <input className={fieldClass("priceArs")} type="number" min={0} step="0.01" value={form.priceArs} onChange={(e) => onChange((prev) => ({ ...prev, priceArs: e.target.value }))} required />
          {fieldErrors.priceArs ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.priceArs}</span> : null}
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Precio USD</span>
          <input className={fieldClass("priceUsd")} type="number" min={0} step="0.01" value={form.priceUsd} onChange={(e) => onChange((prev) => ({ ...prev, priceUsd: e.target.value }))} required />
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

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Image URLs (una por línea)</span>
        <textarea
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          rows={3}
          value={form.imageUrlsText}
          onChange={(e) => onChange((prev) => ({ ...prev, imageUrlsText: e.target.value }))}
        />
      </label>

      <div className="flex items-center gap-3">
        <ToggleSwitch
          checked={form.isActive}
          onChange={(checked) => onChange((prev) => ({ ...prev, isActive: checked }))}
          ariaLabel="Producto activo"
        />
        <span className="text-sm text-gray-700">Producto activo</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Control de stock por talle</p>
        <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="block">
            <span className="text-[11px] font-bold uppercase text-gray-500">Stock S</span>
            <input className={fieldClass("stockS")} type="number" min={0} value={form.stockS} onChange={(e) => onChange((prev) => ({ ...prev, stockS: e.target.value }))} />
            {fieldErrors.stockS ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.stockS}</span> : null}
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase text-gray-500">Stock M</span>
            <input className={fieldClass("stockM")} type="number" min={0} value={form.stockM} onChange={(e) => onChange((prev) => ({ ...prev, stockM: e.target.value }))} />
            {fieldErrors.stockM ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.stockM}</span> : null}
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase text-gray-500">Stock L</span>
            <input className={fieldClass("stockL")} type="number" min={0} value={form.stockL} onChange={(e) => onChange((prev) => ({ ...prev, stockL: e.target.value }))} />
            {fieldErrors.stockL ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.stockL}</span> : null}
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase text-gray-500">Umbral bajo stock</span>
            <input className={fieldClass("lowStockThreshold")} type="number" min={0} value={form.lowStockThreshold} onChange={(e) => onChange((prev) => ({ ...prev, lowStockThreshold: e.target.value }))} />
            {fieldErrors.lowStockThreshold ? <span className="mt-1 block text-xs font-semibold text-red-700">{fieldErrors.lowStockThreshold}</span> : null}
          </label>
        </div>
      </div>
    </form>
  );
}
