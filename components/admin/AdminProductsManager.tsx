"use client";

import Link from "next/link";
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";

type ProductTypeValue = "STARFEET" | "SLIPPER" | "OTHER";

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

export function AdminProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [createForm, setCreateForm] = useState<ProductForm>(initialForm);
  const [editForm, setEditForm] = useState<ProductForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ProductTypeValue>("all");

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
    if (!res.ok) {
      throw new Error(payload?.error ?? "No se pudieron cargar los productos");
    }

    setProducts(payload.products ?? []);
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    loadProducts().catch((e) => setError(e instanceof Error ? e.message : "Error inesperado"));
  }, [loadProducts]);

  async function onCreate() {
    if (!canCreate) return;

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

      setCreateForm(initialForm);
      setCreateOpen(false);
      setSuccess("Producto creado correctamente.");
      await loadProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function startEditing(product: Product) {
    setEditingId(product.id);
    setEditForm(fromProductToForm(product));
    setCreateOpen(false);
    setError(null);
    setSuccess(null);
  }

  async function saveEdit() {
    if (!editingId || !canEdit) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/admin/products/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(editForm)),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "No se pudo actualizar el producto");

      setEditingId(null);
      setEditForm(initialForm);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setProductPendingDelete(null);
      setLoading(false);
    }
  }

  const editingProduct = editingId ? products.find((product) => product.id === editingId) : null;

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <div>
          <h2 className="font-condensed text-3xl font-bold uppercase text-starfeet-blue">Productos</h2>
          <p className="text-sm text-gray-600">Gestión de catálogo con stock por talle.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreateOpen((prev) => !prev);
            setEditingId(null);
          }}
          className="cursor-pointer rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white"
        >
          {createOpen ? "Cerrar" : "Agregar producto"}
        </button>
      </header>

      {createOpen ? (
        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">Nuevo producto</h3>
          <ProductFormFields form={createForm} onChange={setCreateForm} />
          <button
            type="button"
            onClick={onCreate}
            disabled={loading || !canCreate}
            className="mt-4 cursor-pointer rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Crear producto"}
          </button>
        </article>
      ) : null}

      {editingId ? (
        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-condensed text-2xl font-bold uppercase text-starfeet-blue">
              Editar producto {editingProduct ? `· ${editingProduct.name}` : ""}
            </h3>
            <button
              type="button"
              className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setEditingId(null);
                setEditForm(initialForm);
              }}
            >
              Cancelar
            </button>
          </div>

          <ProductFormFields form={editForm} onChange={setEditForm} />

          <button
            type="button"
            onClick={saveEdit}
            disabled={loading || !canEdit}
            className="mt-4 cursor-pointer rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </article>
      ) : null}

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p> : null}

      <article className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
            placeholder="Buscar por nombre o slug"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <select
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | ProductTypeValue)}
          >
            <option value="all">Todos los tipos</option>
            <option value="STARFEET">STARFEET</option>
            <option value="SLIPPER">SLIPPER</option>
            <option value="OTHER">OTHER</option>
          </select>
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
                <th className="px-3 py-2 text-right">Acciones</th>
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
                    <td className="px-3 py-2 text-gray-800">{product.name}</td>
                    <td className="px-3 py-2 text-gray-600">{product.slug ?? "-"}</td>
                    <td className="px-3 py-2">{product.type}</td>
                    <td className="px-3 py-2">{Number(product.priceArs).toFixed(2)}</td>
                    <td className="px-3 py-2">{Number(product.priceUsd).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      {product.inventories.map((inv) => (
                        <p
                          key={inv.id}
                          className={`text-xs ${inv.stock <= inv.lowStockThreshold ? "font-bold text-amber-700" : "text-gray-700"}`}
                        >
                          {inv.physicalSize}: {inv.stock}
                        </p>
                      ))}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${product.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}
                      >
                        {product.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/tienda/producto/${product.slug ?? product.id}`}
                          className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-700 hover:bg-gray-100"
                          target="_blank"
                        >
                          Ver producto
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEditing(product)}
                          className="cursor-pointer rounded-lg border border-starfeet-blue/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-starfeet-blue hover:bg-starfeet-blue/5"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDeleteProduct(product)}
                          className="cursor-pointer rounded-lg border border-red-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

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
}: {
  form: ProductForm;
  onChange: Dispatch<SetStateAction<ProductForm>>;
}) {
  return (
    <form className="mt-4 space-y-3" onSubmit={(e) => e.preventDefault()}>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Nombre</span>
        <input
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          value={form.name}
          onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
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
          <select
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            value={form.type}
            onChange={(e) => onChange((prev) => ({ ...prev, type: e.target.value as ProductTypeValue }))}
          >
            <option value="STARFEET">STARFEET</option>
            <option value="SLIPPER">SLIPPER</option>
            <option value="OTHER">OTHER</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Precio ARS</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            type="number"
            min={0}
            step="0.01"
            value={form.priceArs}
            onChange={(e) => onChange((prev) => ({ ...prev, priceArs: e.target.value }))}
            required
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Precio USD</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            type="number"
            min={0}
            step="0.01"
            value={form.priceUsd}
            onChange={(e) => onChange((prev) => ({ ...prev, priceUsd: e.target.value }))}
            required
          />
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

      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => onChange((prev) => ({ ...prev, isActive: e.target.checked }))}
        />
        Producto activo
      </label>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Control de stock por talle</p>
        <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="block">
            <span className="text-[11px] font-bold uppercase text-gray-500">Stock S</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              type="number"
              min={0}
              value={form.stockS}
              onChange={(e) => onChange((prev) => ({ ...prev, stockS: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase text-gray-500">Stock M</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              type="number"
              min={0}
              value={form.stockM}
              onChange={(e) => onChange((prev) => ({ ...prev, stockM: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase text-gray-500">Stock L</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              type="number"
              min={0}
              value={form.stockL}
              onChange={(e) => onChange((prev) => ({ ...prev, stockL: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase text-gray-500">Umbral bajo stock</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              type="number"
              min={0}
              value={form.lowStockThreshold}
              onChange={(e) => onChange((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
            />
          </label>
        </div>
      </div>
    </form>
  );
}
