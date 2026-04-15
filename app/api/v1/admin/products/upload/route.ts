import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { ApiError, requireRole } from "@/lib/authz";
import { jsonError } from "@/lib/api";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function resolveUploadRoot() {
  return process.env.PRODUCT_UPLOAD_DIR?.trim() || path.join(process.cwd(), "public", "uploads", "products");
}

function sanitizeSegment(input: string) {
  const normalized = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return normalized || "product";
}

function extensionByMime(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/avif") return "avif";
  return "bin";
}

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);

    const formData = await request.formData();
    const productId = String(formData.get("productId") ?? "").trim();

    if (!productId) {
      throw new ApiError(400, "productId requerido");
    }

    const files = formData.getAll("files").filter((value): value is File => value instanceof File);
    if (files.length === 0) {
      throw new ApiError(400, "No se recibieron archivos");
    }

    const folderSegment = sanitizeSegment(productId);
    const rootDir = resolveUploadRoot();
    const targetDir = path.join(rootDir, folderSegment);
    await mkdir(targetDir, { recursive: true });

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        throw new ApiError(400, `Formato no permitido: ${file.type || "desconocido"}`);
      }

      if (file.size <= 0) {
        throw new ApiError(400, `Archivo vacío: ${file.name}`);
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new ApiError(400, `Archivo excede 8MB: ${file.name}`);
      }

      const extension = extensionByMime(file.type);
      const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
      const destinationPath = path.join(targetDir, fileName);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(destinationPath, buffer);

      uploadedUrls.push(`/uploads/products/${folderSegment}/${fileName}`);
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
