import { auth } from "../auth";
import { Role } from "@prisma/client";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type SessionUser = {
  id: string;
  email?: string | null;
  role: Role;
  isActive: boolean;
};

export async function requireSessionUser(): Promise<SessionUser> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    throw new ApiError(401, "No autenticado");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Usuario inactivo");
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role as Role,
    isActive: user.isActive,
  };
}

export async function requireRole(allowed: Role[]): Promise<SessionUser> {
  const user = await requireSessionUser();

  if (!allowed.includes(user.role)) {
    throw new ApiError(403, "Sin permisos para esta acción");
  }

  return user;
}
