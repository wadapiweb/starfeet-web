"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { GuaranteeItem } from "../atoms/GuaranteeItem";
import { clearCartSession, getStoredCartSession, saveCartSession } from "@/lib/cart-session.client";
import {
  PRODUCT_SIZING_NUMBERS,
  getMappedPhysicalSize,
  type ProductGender,
  type ProductPhysicalSize,
  type ProductSizingMatrix,
} from "@/lib/product-sizing";

type ProductDetailInventory = {
  id: string;
  physicalSize: ProductPhysicalSize;
  color: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  sortOrder: number;
};

export type ProductDetailProduct = {
  id: string;
  name: string;
  description: string | null;
  imageUrls: string[];
  priceArs: number;
  priceUsd: number;
  inventories: ProductDetailInventory[];
};

interface ProductDetailProps {
  product: ProductDetailProduct;
  sizing: ProductSizingMatrix;
  prefillEmail?: string;
}

type CartData = {
  id: string;
  items: Array<{
    id: string;
    quantity: number;
    inventoryId: string | null;
  }>;
};

const sizeOrder: ProductPhysicalSize[] = ["S", "M", "L"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  })
    .format(amount)
    .replace("ARS", "$");
}

export const ProductDetail = ({ product, sizing, prefillEmail = "" }: ProductDetailProps) => {
  const router = useRouter();
  const [selectedEmail, setSelectedEmail] = useState(prefillEmail);
  const [selectedGender, setSelectedGender] = useState<ProductGender>("hombre");
  const [selectedNumber, setSelectedNumber] = useState<number>(() => {
    const initialGender = "hombre" as ProductGender;
    for (const number of PRODUCT_SIZING_NUMBERS) {
      const mapped = getMappedPhysicalSize(sizing, initialGender, number);
      if (mapped === "-") continue;
      const inventory = [...product.inventories]
        .filter((item) => item.isActive && item.stock > 0 && item.physicalSize === mapped)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.color.localeCompare(b.color))[0];
      if (inventory) return number;
    }
    return PRODUCT_SIZING_NUMBERS[0];
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inventories = useMemo(
    () =>
      [...product.inventories].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.physicalSize.localeCompare(b.physicalSize) || a.color.localeCompare(b.color),
      ),
    [product.inventories],
  );

  const activeInventories = useMemo(
    () => inventories.filter((inventory) => inventory.isActive && inventory.stock > 0),
    [inventories],
  );

  const stockByPhysicalSize = useMemo(
    () =>
      sizeOrder.reduce<Record<ProductPhysicalSize, number>>(
        (acc, physicalSize) => {
          acc[physicalSize] = activeInventories
            .filter((inventory) => inventory.physicalSize === physicalSize)
            .reduce((sum, inventory) => sum + inventory.stock, 0);
          return acc;
        },
        { S: 0, M: 0, L: 0 },
      ),
    [activeInventories],
  );

  const selectedPhysicalSize = getMappedPhysicalSize(sizing, selectedGender, selectedNumber);
  const selectedInventory = useMemo(() => {
    if (selectedPhysicalSize === "-") return null;
    return activeInventories.find((inventory) => inventory.physicalSize === selectedPhysicalSize) ?? null;
  }, [activeInventories, selectedPhysicalSize]);

  const selectedNumberLabel = selectedNumber ? String(selectedNumber) : "";

  const price = Number(product.priceArs);
  const installmentAmount = price / 6;

  async function withErrorHandling<T>(fn: () => Promise<T>) {
    setError(null);
    setMessage(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      return null;
    }
  }

  async function createOrLoadCart(): Promise<CartData> {
    const stored = getStoredCartSession();
    if (stored?.cartId) {
      const res = await fetch(`/api/v1/shop/cart/${stored.cartId}`, { cache: "no-store" });
      if (res.ok) {
        return (await res.json()).cart as CartData;
      }
      clearCartSession();
    }

    if (!selectedEmail.trim()) {
      throw new Error("Ingresá un email para continuar.");
    }

    const res = await fetch("/api/v1/shop/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerEmail: selectedEmail.trim().toLowerCase(),
        currency: "ARS",
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? "No se pudo crear carrito");

    const created = json.cart as CartData;
    saveCartSession({ cartId: created.id, customerEmail: selectedEmail.trim().toLowerCase() });
    return created;
  }

  async function addToCart({ buyNow }: { buyNow: boolean }) {
    return withErrorHandling(async () => {
      setLoading(true);

      if (!selectedEmail.trim()) {
        throw new Error("Ingresá un email para continuar.");
      }
      if (!selectedInventory || !selectedInventory.isActive || selectedInventory.stock <= 0 || selectedPhysicalSize === "-") {
        throw new Error("Seleccioná un talle disponible.");
      }

      const cart = await createOrLoadCart();
      const res = await fetch(`/api/v1/shop/cart/${cart.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_item",
          productId: product.id,
          inventoryId: selectedInventory.id,
          gender: selectedGender === "mujer" ? "FEMALE" : "MALE",
          size: selectedNumberLabel,
          quantity: 1,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "No se pudo agregar el producto");

      saveCartSession({ cartId: cart.id, customerEmail: selectedEmail.trim().toLowerCase() });
      setMessage("Producto agregado al carrito.");

      if (buyNow) {
        router.push("/tienda/checkout");
      }

      return json;
    }).finally(() => setLoading(false));
  }

  return (
    <div className="grid grid-cols-1 gap-12 px-6 py-12 lg:mx-auto lg:max-w-7xl lg:grid-cols-12">
      <div className="lg:col-span-7 flex flex-col gap-6 md:flex-row">
        <div className="order-2 flex gap-4 overflow-x-auto pb-2 md:order-1 md:flex-col md:overflow-visible md:pb-0">
          {product.imageUrls.length === 0 ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-[10px] uppercase text-gray-400">
              Sin imágenes
            </div>
          ) : (
            product.imageUrls.slice(0, 4).map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setCurrentImageIndex(index)}
                className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl p-1 transition-all ${currentImageIndex === index ? "ring-2 ring-starfeet-blue" : "ring-1 ring-gray-100"
                  }`}
              >
                <div className="relative h-full w-full overflow-hidden rounded-xl">
                  <Image src={image} alt={`${product.name} thumbnail ${index + 1}`} fill className="object-cover" />
                </div>
              </button>
            ))
          )}
        </div>

        <div className="order-1 flex h-fit flex-1 items-start justify-center overflow-hidden rounded-2xl border border-gray-100 p-1 ring-1 ring-gray-100 md:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative w-full overflow-hidden rounded-xl bg-white"
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={product.imageUrls[currentImageIndex] || "/images/placeholder.webp"}
                  alt={product.name}
                  fill
                  className="object-contain object-top p-4"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="lg:col-span-5 flex flex-col pt-4">
        <h1 className="mb-2 font-condensed text-4xl font-black uppercase leading-none tracking-tight text-starfeet-blue md:text-5xl">
          {product.name}
        </h1>

        <div className="mb-8 h-1 w-full bg-starfeet-lime" />

        <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600">Email para carrito</span>
            <input
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              placeholder="cliente@email.com"
              inputMode="email"
            />
          </label>
        </div>

        <div className="mb-8">
          <div className="mb-2 flex items-baseline gap-2">
            <span className="font-sans text-4xl font-bold text-starfeet-blue">{formatCurrency(price)}</span>
          </div>
          <div className="flex items-center gap-2 text-starfeet-blue">
            <div className="flex h-5 w-5 items-center justify-center rounded border border-starfeet-blue">
              <span className="text-[10px] font-bold">💳</span>
            </div>
            <p className="font-sans text-sm font-medium">
              Hasta 6 cuotas sin interés de <span className="font-bold">{formatCurrency(installmentAmount)}</span>
            </p>
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-4 flex items-center gap-4">
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-starfeet-lime">Género</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedGender("mujer");
                  const nextNumber = PRODUCT_SIZING_NUMBERS.find((number) => {
                    const mapped = getMappedPhysicalSize(sizing, "mujer", number);
                    return mapped !== "-" && stockByPhysicalSize[mapped] > 0;
                  });
                  if (nextNumber) setSelectedNumber(nextNumber);
                }}
                className={`text-[10px] font-bold uppercase transition-all ${selectedGender === "mujer" ? "border-b border-starfeet-blue text-starfeet-blue" : "text-gray-400"
                  }`}
              >
                Mujer
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedGender("hombre");
                  const nextNumber = PRODUCT_SIZING_NUMBERS.find((number) => {
                    const mapped = getMappedPhysicalSize(sizing, "hombre", number);
                    return mapped !== "-" && stockByPhysicalSize[mapped] > 0;
                  });
                  if (nextNumber) setSelectedNumber(nextNumber);
                }}
                className={`text-[10px] font-bold uppercase transition-all ${selectedGender === "hombre" ? "border-b border-starfeet-blue text-starfeet-blue" : "text-gray-400"
                  }`}
              >
                Hombre
              </button>
            </div>
          </div>

          <div className="grid w-fit grid-cols-5 justify-items-start gap-1">
            {PRODUCT_SIZING_NUMBERS.map((number) => {
              const mappedSize = getMappedPhysicalSize(sizing, selectedGender, number);
              if (mappedSize === "-") {
                return null;
              }

              const hasStock = stockByPhysicalSize[mappedSize] > 0;
              const selected = selectedNumber === number;

              return (
                <button
                  key={number}
                  type="button"
                  disabled={!hasStock}
                  onClick={() => hasStock && setSelectedNumber(number)}
                  className={`flex aspect-square h-10 w-10 items-center justify-center rounded-md border text-center transition-all disabled:cursor-not-allowed ${selected
                      ? "border-starfeet-blue bg-starfeet-blue text-white"
                      : hasStock
                        ? "border-gray-200 bg-white text-gray-700 hover:border-starfeet-blue/30"
                        : "border-gray-200 bg-gray-100 text-gray-400"
                    }`}
                >
                  <span className="text-[10px] font-black leading-none">{number}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => addToCart({ buyNow: true })}
            disabled={loading || activeInventories.length === 0}
            className="flex-1 rounded-xl bg-starfeet-blue py-4 font-condensed text-lg font-black uppercase text-white transition-all hover:bg-starfeet-lime hover:text-starfeet-blue disabled:cursor-not-allowed disabled:opacity-50"
          >
            Comprar ahora
          </button>
          <button
            type="button"
            onClick={() => addToCart({ buyNow: false })}
            disabled={loading || activeInventories.length === 0}
            className="flex-1 rounded-xl bg-[#8BA2CC] py-4 font-condensed text-lg font-black uppercase text-white transition-all hover:bg-starfeet-blue disabled:cursor-not-allowed disabled:opacity-50"
          >
            Agregar al carrito
          </button>
        </div>

        <p className="mb-8 font-sans text-sm font-bold text-starfeet-blue">
          llevate un par más con <span className="bg-starfeet-blue px-1 text-starfeet-lime">20% de descuento</span> en el segundo par
        </p>

        <div className="flex flex-col gap-6">
          <GuaranteeItem title="¡Devolvelo GRATIS!" description="Si no te gustó o no te convence, podés devolverlo cuando quieras." />
          <GuaranteeItem title="Comprá y cancelá cuando quieras." />
          <GuaranteeItem
            title="GARANTÍA EXTENDIDA DE RESULTADOS:"
            description="Si en 6 meses no conseguís los resultados que esperás, te devolvemos el 100% del valor de tus Starfeet* *no incluye envío ni flaflus Ver TyC Legales"
          />
        </div>

        {message ? <p className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p> : null}
        {error ? <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      </div>
    </div>
  );
};
