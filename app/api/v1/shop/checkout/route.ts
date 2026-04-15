import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJson, jsonError } from "@/lib/api";
import { ApiError } from "@/lib/authz";
import { isCartExpired } from "@/lib/cart";
import { auth } from "@/auth";

type CheckoutBody = {
  cartId: string;
  clientName?: string;
  clientPhone?: string;
  paymentProvider?: string;
};

export async function POST(request: Request) {
  try {
    const body = await parseJson<CheckoutBody>(request);
    if (!body.cartId) {
      throw new ApiError(400, "cartId es obligatorio");
    }

    const session = await auth();

    const cart = await prisma.cart.findUnique({
      where: { id: body.cartId },
      include: {
        items: true,
        coupon: true,
      },
    });

    if (!cart) {
      throw new ApiError(404, "Carrito no encontrado");
    }
    if (cart.status !== "ACTIVE" || isCartExpired(cart.expiresAt)) {
      throw new ApiError(409, "Carrito expirado o inactivo");
    }
    if (cart.items.length === 0) {
      throw new ApiError(400, "El carrito está vacío");
    }

    let discountAmount = 0;
    if (cart.coupon) {
      if (!cart.coupon.isActive || cart.coupon.expiresAt.getTime() <= Date.now()) {
        throw new ApiError(409, "El cupón aplicado ya no es válido");
      }
      if (cart.coupon.usageCount >= cart.coupon.maxUses) {
        throw new ApiError(409, "El cupón aplicado no tiene usos disponibles");
      }
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );

    if (cart.coupon) {
      if (cart.coupon.discountType === "PERCENTAGE") {
        discountAmount = (subtotal * cart.coupon.discountValue) / 100;
      } else {
        discountAmount = cart.coupon.discountValue;
      }
      discountAmount = Math.min(discountAmount, subtotal);
    }

    const total = subtotal - discountAmount;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          status: "INITIATED",
          currency: cart.currency,
          totalAmount: total,
          snapshotClientName: body.clientName,
          snapshotClientEmail: cart.customerEmail,
          snapshotClientPhone: body.clientPhone,
          paymentProvider: body.paymentProvider,
          userId: session?.user?.id ?? null,
          couponId: cart.couponId,
          orderItems: {
            create: cart.items.map((item) => ({
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              userSelectedGender: "UNISEX",
              userSelectedSize: "N/A",
              productId: item.productId,
              inventoryId: item.inventoryId,
            })),
          },
        },
        include: { orderItems: true },
      });

      if (cart.coupon) {
        const assignments = await tx.couponAssignment.findMany({
          where: { couponId: cart.coupon.id },
          select: { kinesioUserId: true },
        });

        await tx.coupon.update({
          where: { id: cart.coupon.id },
          data: { usageCount: { increment: 1 } },
        });

        let commissionTotal = 0;
        if (cart.coupon.commissionType === "PERCENTAGE") {
          commissionTotal = (total * cart.coupon.commissionValue) / 100;
        } else {
          commissionTotal = cart.coupon.commissionValue;
        }
        commissionTotal = Math.max(0, commissionTotal);
        const commissionPerKinesio =
          assignments.length > 0 ? commissionTotal / assignments.length : 0;

        await tx.couponRedemption.create({
          data: {
            couponId: cart.coupon.id,
            orderId: order.id,
            redeemedByUserId: session?.user?.id ?? null,
            usedByEmail: cart.customerEmail,
            discountSnapshot: discountAmount,
            commissionSnapshot: commissionTotal,
          },
        });

        if (assignments.length > 0 && commissionPerKinesio > 0) {
          await tx.commissionEntry.createMany({
            data: assignments.map((assignment) => ({
              orderId: order.id,
              couponId: cart.coupon!.id,
              kinesioUserId: assignment.kinesioUserId,
              amount: commissionPerKinesio,
              status: "PENDING",
            })),
          });
        }
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: {
          status: "CONVERTED",
          lastActivityAt: new Date(),
        },
      });

      return order;
    });

    return NextResponse.json({ order: result }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
