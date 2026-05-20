import { z } from "zod";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "required" })
    .email({ message: "invalidEmail" }),
  password: z
    .string()
    .min(1, { message: "required" })
    .min(6, { message: "minPassword" }),
});

export const ProductVariantSchema = z.object({
  id: z.string().optional(),
  physicalSize: z.enum(["S", "M", "L"], {
    message: "sizeRequired",
  }),
  color: z.string().min(1, { message: "colorRequired" }),
  stock: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0, { message: "stockInvalid" }),
  lowStockThreshold: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0, { message: "thresholdInvalid" }),
  isActive: z.boolean(),
});

export const ProductFormSchema = z.object({
  slug: z
    .string()
    .refine((val) => val.trim() === "" || SLUG_PATTERN.test(val.trim()), {
      message: "slugInvalid",
    }),
  name: z.string().min(1, { message: "required" }),
  description: z.string().optional(),
  type: z.enum(["STARFEET", "SLIPPER", "OTHER"]),
  priceArs: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, { message: "pricePositive" }),
  priceUsd: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, { message: "pricePositive" }),
  compareAtPriceArs: z
    .union([z.string(), z.number(), z.null(), z.literal("")])
    .optional(),
  compareAtPriceUsd: z
    .union([z.string(), z.number(), z.null(), z.literal("")])
    .optional(),
  imageUrls: z.array(z.string()),
  isActive: z.boolean(),
  variants: z
    .array(ProductVariantSchema)
    .refine((vars) => vars.some((v) => v.isActive && v.color.trim() !== ""), {
      message: "variantRequired",
    }),
});
