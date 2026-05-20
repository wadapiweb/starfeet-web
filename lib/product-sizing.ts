export type ProductGender = "mujer" | "hombre";
export type ProductPhysicalSize = "S" | "M" | "L";
export type ProductSizingSlot = ProductPhysicalSize | "-";

export const PRODUCT_SIZING_NUMBERS = Array.from({ length: 11 }, (_, index) => 35 + index) as number[];

export type ProductSizingMatrix = Record<ProductGender, Record<string, ProductSizingSlot>>;

export function createDefaultProductSizingMatrix(): ProductSizingMatrix {
  return {
    mujer: {
      "35": "S",
      "36": "S",
      "37": "M",
      "38": "M",
      "39": "L",
      "40": "L",
      "41": "-",
      "42": "-",
      "43": "-",
      "44": "-",
      "45": "-",
    },
    hombre: {
      "35": "-",
      "36": "-",
      "37": "S",
      "38": "S",
      "39": "M",
      "40": "M",
      "41": "L",
      "42": "L",
      "43": "L",
      "44": "-",
      "45": "-",
    },
  };
}

export function parseProductSizingGenderMap(value: unknown): Record<string, ProductSizingSlot> | null {
  let record: Record<string, unknown> | null = null;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        record = parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  } else if (value && typeof value === "object") {
    record = value as Record<string, unknown>;
  }

  if (!record) return null;

  const candidate: Record<string, ProductSizingSlot> = {};

  for (const number of PRODUCT_SIZING_NUMBERS) {
    const raw = record[String(number)];
    if (raw === "S" || raw === "M" || raw === "L" || raw === "-") {
      candidate[String(number)] = raw;
    }
  }

  return candidate;
}

export function stringifyProductSizingMatrix(matrix: ProductSizingMatrix) {
  return JSON.stringify(matrix, null, 2);
}

export function getMappedPhysicalSize(
  matrix: ProductSizingMatrix,
  gender: ProductGender,
  number: number,
): ProductSizingSlot {
  return matrix[gender][String(number)] ?? "-";
}
