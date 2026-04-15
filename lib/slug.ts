import prisma from "@/lib/prisma";

function normalizeBaseSlug(input: string): string {
  const clean = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return clean || "item";
}

function buildUserSlugBase(name: string | null | undefined, email: string): string {
  if (name && name.trim().length > 0) {
    return normalizeBaseSlug(name);
  }
  const localPart = email.split("@")[0] ?? email;
  return normalizeBaseSlug(localPart);
}

function buildSlugBaseFromLabel(label: string) {
  return normalizeBaseSlug(label);
}

async function reserveUniqueSlug(
  exists: (slug: string) => Promise<boolean>,
  base: string,
  excludeId?: string,
): Promise<string> {
  let candidate = base;
  let suffix = 2;

  while (true) {
    const taken = await exists(candidate);
    if (!taken) {
      return candidate;
    }
    candidate = `${base}-${suffix}`;
    suffix += 1;
    if (candidate.length > 80) {
      candidate = `${base.slice(0, 70)}-${suffix}`;
    }

    if (excludeId) {
      const owner = await prisma.user.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!owner || owner.id === excludeId) {
        return candidate;
      }
    }
  }
}

export async function generateUniqueUserSlug(name: string | null | undefined, email: string, excludeId?: string) {
  const base = buildUserSlugBase(name, email);
  return reserveUniqueSlug(
    async (slug) => {
      const found = await prisma.user.findUnique({ where: { slug }, select: { id: true } });
      if (!found) return false;
      if (excludeId && found.id === excludeId) return false;
      return true;
    },
    base,
    excludeId,
  );
}

export async function ensureUserSlug(userId: string, name: string | null | undefined, email: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { slug: true },
  });

  if (!existing || existing.slug) {
    return existing?.slug ?? null;
  }

  const slug = await generateUniqueUserSlug(name, email, userId);
  await prisma.user.update({
    where: { id: userId },
    data: { slug },
  });

  return slug;
}

export async function generateUniqueCouponSlug(code: string) {
  const base = buildSlugBaseFromLabel(code);
  return reserveUniqueSlug(
    async (slug) => {
      const found = await prisma.coupon.findUnique({ where: { slug }, select: { id: true } });
      return Boolean(found);
    },
    base,
  );
}

export async function generateUniqueProductSlug(name: string) {
  const base = buildSlugBaseFromLabel(name);
  return reserveUniqueSlug(
    async (slug) => {
      const found = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
      return Boolean(found);
    },
    base,
  );
}

export async function generateUniquePatientSlug(name: string | null | undefined, email: string) {
  const base = buildUserSlugBase(name, email);
  return reserveUniqueSlug(
    async (slug) => {
      const found = await prisma.patientProfile.findUnique({ where: { slug }, select: { id: true } });
      return Boolean(found);
    },
    base,
  );
}
