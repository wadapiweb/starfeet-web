import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ApiError, SessionUser } from "@/lib/authz";
import { generateCode, getAccessCodeExpiry, hashAccessCode } from "@/lib/access-codes";
import { sendMail } from "@/lib/mailer";
import { persistSecurityEvent } from "@/lib/security/persistent-audit";

export const ADMIN_USER_PAGE_SIZE_DEFAULT = 20;
export const ADMIN_USER_PAGE_SIZE_MAX = 100;

export type AdminUserStatusFilter = "all" | "active" | "inactive" | "blocked";
export type AdminUserPurchasesFilter = "all" | "yes" | "no";
export type AdminUserSort = "createdAt" | "lastLoginAt" | "email" | "orders";
export type SortDirection = "asc" | "desc";

export type AdminUsersQuery = {
  q?: string;
  role?: Role | "all";
  status?: AdminUserStatusFilter;
  purchases?: AdminUserPurchasesFilter;
  sort?: AdminUserSort;
  dir?: SortDirection;
  page?: number;
  pageSize?: number;
};

export type AdminUserPatchInput = {
  name?: string | null;
  phone?: string | null;
  documentNumber?: string | null;
  role?: Role;
  isActive?: boolean;
};

type AdminAuditInput = {
  admin: SessionUser;
  action: string;
  targetUserId: string;
  targetRole?: Role | null;
  reason?: string;
  metadata?: Record<string, unknown>;
};

function auditAdminUserEvent({ admin, action, targetUserId, targetRole, reason, metadata }: AdminAuditInput) {
  persistSecurityEvent({
    action,
    outcome: "success",
    actorUserId: admin.id,
    actorRole: admin.role,
    resourceType: "User",
    resourceId: targetUserId,
    reason,
    metadata: {
      targetRole,
      ...metadata,
    },
  });
}

function normalizePage(value: number | undefined) {
  return Math.max(1, Number.isFinite(value ?? 1) ? Number(value ?? 1) : 1);
}

function normalizePageSize(value: number | undefined) {
  const size = Number.isFinite(value ?? ADMIN_USER_PAGE_SIZE_DEFAULT)
    ? Number(value ?? ADMIN_USER_PAGE_SIZE_DEFAULT)
    : ADMIN_USER_PAGE_SIZE_DEFAULT;
  return Math.min(ADMIN_USER_PAGE_SIZE_MAX, Math.max(1, size));
}

function buildUserWhere(query: AdminUsersQuery): Prisma.UserWhereInput {
  const now = new Date();
  const where: Prisma.UserWhereInput = {};
  const and: Prisma.UserWhereInput[] = [];
  const search = query.q?.trim();

  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { documentNumber: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (query.role && query.role !== "all") {
    where.role = query.role;
  }

  if (query.status === "active") {
    and.push({
      isActive: true,
      OR: [{ lockoutUntil: null }, { lockoutUntil: { lte: now } }],
    });
  } else if (query.status === "inactive") {
    where.isActive = false;
  } else if (query.status === "blocked") {
    where.lockoutUntil = { gt: now };
  }

  if (query.purchases === "yes") {
    where.orders = { some: {} };
  } else if (query.purchases === "no") {
    where.orders = { none: {} };
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

function buildOrderBy(sort: AdminUserSort = "createdAt", dir: SortDirection = "desc"): Prisma.UserOrderByWithRelationInput {
  if (sort === "orders") {
    return { orders: { _count: dir } };
  }

  return { [sort]: dir };
}

export async function listAdminUsers(query: AdminUsersQuery) {
  const page = normalizePage(query.page);
  const pageSize = normalizePageSize(query.pageSize);
  const where = buildUserWhere(query);

  let total = 0;
  let users: Array<{
    id: string;
    slug: string | null;
    name: string | null;
    email: string;
    phone: string | null;
    documentNumber: string | null;
    role: Role;
    isActive: boolean;
    lockoutUntil: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    _count: { orders: number };
  }> = [];

  try {
    [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: buildOrderBy(query.sort, query.dir),
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          name: true,
          email: true,
          phone: true,
          documentNumber: true,
          role: true,
          isActive: true,
          lockoutUntil: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
    ]);
  } catch (error) {
    if (query.role === "MARKETING" && isUnsupportedRoleEnumValueError(error)) {
      return emptyAdminUsersPage(page, pageSize);
    }
    throw error;
  }

  const userIds = users.map((user) => user.id);
  const totals = userIds.length
    ? await safeSchemaQuery(
        () =>
          prisma.order.groupBy({
            by: ["userId", "currency"],
            where: { userId: { in: userIds } },
            _sum: { totalAmount: true },
          }),
        [],
      )
    : [];

  const totalsByUser = totals.reduce<Record<string, Record<string, number>>>((acc, item) => {
    if (!item.userId) return acc;
    acc[item.userId] = {
      ...(acc[item.userId] ?? {}),
      [item.currency]: Number(item._sum.totalAmount ?? 0),
    };
    return acc;
  }, {});

  return {
    users: users.map((user) => ({
      ...user,
      status: resolveUserStatus(user),
      totalSpentByCurrency: totalsByUser[user.id] ?? {},
    })),
    pagination: {
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

function emptyAdminUsersPage(page: number, pageSize: number) {
  return {
    users: [],
    pagination: {
      total: 0,
      page,
      pageSize,
      pages: 1,
    },
  };
}

export function resolveUserStatus(user: { isActive: boolean; lockoutUntil: Date | null }) {
  if (!user.isActive) return "inactive";
  if (user.lockoutUntil && user.lockoutUntil.getTime() > Date.now()) return "blocked";
  return "active";
}

export async function getAdminUserDetail(slugOrId: string) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ id: slugOrId }, { slug: slugOrId }] },
    select: {
      id: true,
      slug: true,
      name: true,
      email: true,
      phone: true,
      documentNumber: true,
      role: true,
      isActive: true,
      failedLoginAttempts: true,
      lockoutUntil: true,
      lastFailedLoginAt: true,
      lastLoginAt: true,
      passwordChangedAt: true,
      sessionVersion: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          accounts: true,
          sessions: true,
          orders: true,
          assignedCoupons: true,
          commissionEntries: true,
          kinesioLinks: true,
          createdCampaigns: true,
          ownedLeads: true,
        },
      },
    },
  });

  if (!user) return null;

  const [
    loginEvents,
    auditEvents,
    orderTotals,
    recentOrders,
    kinesioStats,
    marketingStats,
  ] = await Promise.all([
    prisma.securityAuditEvent.findMany({
      where: {
        actorUserId: user.id,
        action: { in: ["AUTH_LOGIN_SUCCESS", "AUTH_LOGIN_FAILED", "AUTH_RATE_LIMIT_BLOCKED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.securityAuditEvent.findMany({
      where: {
        OR: [{ actorUserId: user.id }, { resourceType: "User", resourceId: user.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 18,
    }),
    safeSchemaQuery(
      () =>
        prisma.order.groupBy({
          by: ["currency"],
          where: { userId: user.id },
          _sum: { totalAmount: true },
          _count: { _all: true },
        }),
      [],
    ),
    safeSchemaQuery(
      () =>
        prisma.order.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            status: true,
            currency: true,
            totalAmount: true,
            createdAt: true,
            _count: { select: { orderItems: true } },
          },
        }),
      [],
    ),
    getKinesioActivity(user.id, user.role),
    getMarketingActivity(user.id, user.role),
  ]);

  return {
    user: {
      ...user,
      status: resolveUserStatus(user),
    },
    loginEvents,
    auditEvents,
    clientActivity: {
      totalsByCurrency: orderTotals.map((item) => ({
        currency: item.currency,
        orders: item._count._all,
        total: Number(item._sum.totalAmount ?? 0),
      })),
      recentOrders,
    },
    kinesioActivity: kinesioStats,
    marketingActivity: marketingStats,
  };
}

async function getKinesioActivity(userId: string, role: Role) {
  if (role !== "KINESIOLOGO") return null;

  const [assignedCoupons, patients, commissions, pendingCommissions, recentCoupons, recentCommissions] =
    await Promise.all([
      prisma.couponAssignment.count({ where: { kinesioUserId: userId } }),
      prisma.patientKinesioLink.count({ where: { kinesioUserId: userId } }),
      prisma.commissionEntry.aggregate({
        where: { kinesioUserId: userId },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.commissionEntry.aggregate({
        where: { kinesioUserId: userId, status: { in: ["PENDING", "VALIDATED"] } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.couponAssignment.findMany({
        where: { kinesioUserId: userId },
        orderBy: { assignedAt: "desc" },
        take: 6,
        select: {
          assignedAt: true,
          coupon: { select: { id: true, slug: true, code: true, isActive: true, usageCount: true, maxUses: true } },
        },
      }),
      prisma.commissionEntry.findMany({
        where: { kinesioUserId: userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          order: { select: { id: true, currency: true, totalAmount: true } },
          coupon: { select: { code: true } },
        },
      }),
    ]);

  return {
    assignedCoupons,
    patients,
    commissionsCount: commissions._count._all,
    commissionsTotal: Number(commissions._sum.amount ?? 0),
    pendingCommissionsCount: pendingCommissions._count._all,
    pendingCommissionsTotal: Number(pendingCommissions._sum.amount ?? 0),
    recentCoupons,
    recentCommissions,
  };
}

async function getMarketingActivity(userId: string, role: Role) {
  if (role !== "MARKETING" && role !== "ADMIN") return null;

  const [campaigns, leads, recentCampaigns] = await Promise.all([
    prisma.campaign.count({ where: { createdById: userId } }),
    prisma.lead.count({ where: { ownerId: userId } }),
    prisma.campaign.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, status: true, subject: true, createdAt: true, sentAt: true },
    }),
  ]);

  return { campaigns, leads, recentCampaigns };
}

async function safeSchemaQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    if (isMissingSchemaObjectError(error)) {
      return fallback;
    }
    throw error;
  }
}

function isMissingSchemaObjectError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

function isUnsupportedRoleEnumValueError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientUnknownRequestError &&
    error.message.includes("invalid input value for enum") &&
    error.message.includes("MARKETING")
  );
}

async function assertUserCanBeChanged(admin: SessionUser, targetId: string, nextRole?: Role, nextIsActive?: boolean) {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, isActive: true, email: true },
  });

  if (!target) throw new ApiError(404, "Usuario no encontrado");

  const roleWouldChange = nextRole !== undefined && nextRole !== target.role;
  const activeWouldChange = nextIsActive !== undefined && nextIsActive !== target.isActive;

  if (admin.id === targetId && ((roleWouldChange && nextRole !== "ADMIN") || (activeWouldChange && nextIsActive === false))) {
    throw new ApiError(400, "No puedes quitarte tu propio acceso administrativo");
  }

  const wouldRemoveActiveAdmin =
    target.role === "ADMIN" &&
    target.isActive &&
    ((roleWouldChange && nextRole !== "ADMIN") || (activeWouldChange && nextIsActive === false));

  if (wouldRemoveActiveAdmin) {
    const activeAdmins = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
    if (activeAdmins <= 1) {
      throw new ApiError(400, "No se puede modificar al último administrador activo");
    }
  }

  return target;
}

export async function patchAdminUser(admin: SessionUser, targetId: string, input: AdminUserPatchInput) {
  const target = await assertUserCanBeChanged(admin, targetId, input.role, input.isActive);
  const data: Prisma.UserUpdateInput = {};
  const changed: Record<string, unknown> = {};

  if (input.name !== undefined) {
    data.name = input.name?.trim() || null;
    changed.name = data.name;
  }
  if (input.phone !== undefined) {
    data.phone = input.phone?.trim() || null;
    changed.phone = data.phone;
  }
  if (input.documentNumber !== undefined) {
    data.documentNumber = input.documentNumber?.trim() || null;
    changed.documentNumber = data.documentNumber;
  }
  if (input.role !== undefined && input.role !== target.role) {
    data.role = input.role;
    data.sessionVersion = { increment: 1 };
    changed.role = { from: target.role, to: input.role };
  }
  if (input.isActive !== undefined && input.isActive !== target.isActive) {
    data.isActive = input.isActive;
    data.sessionVersion = { increment: 1 };
    changed.isActive = { from: target.isActive, to: input.isActive };
  }

  if (Object.keys(data).length === 0) {
    return prisma.user.findUniqueOrThrow({ where: { id: targetId } });
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data,
    select: {
      id: true,
      slug: true,
      name: true,
      email: true,
      phone: true,
      documentNumber: true,
      role: true,
      isActive: true,
      lockoutUntil: true,
      lastLoginAt: true,
      updatedAt: true,
    },
  });

  auditAdminUserEvent({
    admin,
    action: "ADMIN_USER_UPDATED",
    targetUserId: targetId,
    targetRole: updated.role,
    metadata: { changed },
  });

  return updated;
}

export async function sendAdminPasswordReset(admin: SessionUser, targetId: string) {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, email: true, role: true, isActive: true },
  });
  if (!target) throw new ApiError(404, "Usuario no encontrado");
  if (!target.isActive) throw new ApiError(400, "No se puede enviar reset a un usuario inactivo");

  const code = generateCode();
  const codeHash = hashAccessCode(target.email, code, "PASSWORD_RESET");
  const expiresAt = getAccessCodeExpiry();

  await prisma.$transaction([
    prisma.accessCode.updateMany({
      where: {
        email: target.email,
        type: "PASSWORD_RESET",
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    }),
    prisma.accessCode.create({
      data: {
        email: target.email,
        userId: target.id,
        type: "PASSWORD_RESET",
        codeHash,
        expiresAt,
      },
    }),
  ]);

  const sent = await sendMail({
    to: target.email,
    subject: "Recuperación de contraseña - Starfeet",
    html: `<p>Un administrador solicitó un reset de contraseña para tu cuenta.</p><p>Tu código es <strong>${code}</strong>.</p><p>Expira en 15 minutos.</p>`,
  });

  auditAdminUserEvent({
    admin,
    action: "ADMIN_USER_PASSWORD_RESET_SENT",
    targetUserId: target.id,
    targetRole: target.role,
    metadata: { sent: sent.sent },
  });

  return {
    ok: true,
    sent: sent.sent,
    ...(sent.sent ? {} : process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
  };
}

export async function setAdminUserPassword(admin: SessionUser, targetId: string, password: string) {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true },
  });
  if (!target) throw new ApiError(404, "Usuario no encontrado");

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: targetId },
    data: {
      password: hashed,
      passwordChangedAt: new Date(),
      failedLoginAttempts: 0,
      lockoutUntil: null,
      sessionVersion: { increment: 1 },
    },
  });

  auditAdminUserEvent({
    admin,
    action: "ADMIN_USER_PASSWORD_CHANGED",
    targetUserId: target.id,
    targetRole: target.role,
  });

  return { ok: true };
}

export async function unlockAdminUser(admin: SessionUser, targetId: string) {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true },
  });
  if (!target) throw new ApiError(404, "Usuario no encontrado");

  await prisma.user.update({
    where: { id: targetId },
    data: {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastFailedLoginAt: null,
    },
  });

  auditAdminUserEvent({
    admin,
    action: "ADMIN_USER_UNLOCKED",
    targetUserId: target.id,
    targetRole: target.role,
  });

  return { ok: true };
}

export async function revokeAdminUserSessions(admin: SessionUser, targetId: string) {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true },
  });
  if (!target) throw new ApiError(404, "Usuario no encontrado");

  await prisma.user.update({
    where: { id: targetId },
    data: { sessionVersion: { increment: 1 } },
  });

  auditAdminUserEvent({
    admin,
    action: "ADMIN_USER_SESSIONS_REVOKED",
    targetUserId: target.id,
    targetRole: target.role,
  });

  return { ok: true };
}
