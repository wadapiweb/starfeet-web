import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, ApiError } from "@/lib/authz";
import { jsonError } from "@/lib/api";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Params) {
  try {
    const user = await requireRole(["KINESIOLOGO"]);
    const { id } = await context.params;

    const link = await prisma.patientKinesioLink.findUnique({
      where: {
        kinesioUserId_patientId: {
          kinesioUserId: user.id,
          patientId: id,
        },
      },
    });

    if (!link) {
      throw new ApiError(403, "No tenés acceso a este paciente");
    }

    const patient = await prisma.patientProfile.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            orderItems: {
              include: {
                product: { select: { id: true, name: true, type: true } },
              },
            },
            coupon: { select: { code: true, discountType: true, discountValue: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!patient) {
      throw new ApiError(404, "Paciente no encontrado");
    }

    return NextResponse.json({ patient });
  } catch (error) {
    return jsonError(error);
  }
}
