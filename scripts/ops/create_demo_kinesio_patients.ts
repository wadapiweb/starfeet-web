import { Currency, Gender, OrderStatus, PhysicalSize, PrismaClient, ProductType, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateUniquePatientSlug } from "@/lib/slug";

const prisma = new PrismaClient();

const DEMO_PRODUCT_SLUG = "starfeet-demo-ventas";
const DEMO_USER_EMAIL = "cliente.demo.ventas@starfeet.ar";
const DEMO_COUPON_CODE = "KINESIO-10";

type DemoPatient = {
  email: string;
  name: string;
  phone: string;
  linkedUserEmail?: string;
  transactionId: string;
  orderStatus: OrderStatus;
  createdAt: Date;
  totalAmount: number;
  paymentProvider: string;
};

async function ensureClientUser() {
  const password = await bcrypt.hash("123456", 10);
  return prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {
      name: "Cliente Demo Ventas",
      role: "CLIENTE",
      isActive: true,
    },
    create: {
      email: DEMO_USER_EMAIL,
      slug: "cliente-demo-ventas",
      name: "Cliente Demo Ventas",
      role: "CLIENTE",
      isActive: true,
      password,
    },
  });
}

async function ensureProduct() {
  return prisma.product.upsert({
    where: { slug: DEMO_PRODUCT_SLUG },
    update: {
      name: "Starfeet Demo Ventas",
      description: "Producto de prueba para órdenes demo de pacientes y ventas.",
      type: ProductType.STARFEET,
      priceArs: 25000,
      priceUsd: 25,
      imageUrls: [],
      isActive: true,
    },
    create: {
      slug: DEMO_PRODUCT_SLUG,
      name: "Starfeet Demo Ventas",
      description: "Producto de prueba para órdenes demo de pacientes y ventas.",
      type: ProductType.STARFEET,
      priceArs: 25000,
      priceUsd: 25,
      imageUrls: [],
      isActive: true,
    },
    select: { id: true, name: true },
  });
}

function buildPatients(now: Date): DemoPatient[] {
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      email: DEMO_USER_EMAIL,
      name: "Cliente Demo Ventas",
      phone: "+54 11 5000 0000",
      linkedUserEmail: DEMO_USER_EMAIL,
      transactionId: "trx-demo-kinesio-patient-001",
      orderStatus: OrderStatus.PAID,
      createdAt: new Date(now.getTime() - day * 4),
      totalAmount: 28000,
      paymentProvider: "MERCADOPAGO",
    },
    {
      email: "paciente.inv-1@starfeet.ar",
      name: "Paciente Invitado 1",
      phone: "+54 11 6000 1001",
      transactionId: "trx-demo-kinesio-patient-002",
      orderStatus: OrderStatus.PAID,
      createdAt: new Date(now.getTime() - day * 3),
      totalAmount: 31500,
      paymentProvider: "TRANSFERENCIA",
    },
    {
      email: "paciente.inv-2@starfeet.ar",
      name: "Paciente Invitado 2",
      phone: "+54 11 6000 1002",
      transactionId: "trx-demo-kinesio-patient-003",
      orderStatus: OrderStatus.DELIVERED,
      createdAt: new Date(now.getTime() - day * 2),
      totalAmount: 29750,
      paymentProvider: "MERCADOPAGO",
    },
    {
      email: "paciente.inv-3@starfeet.ar",
      name: "Paciente Invitado 3",
      phone: "+54 11 6000 1003",
      transactionId: "trx-demo-kinesio-patient-004",
      orderStatus: OrderStatus.PAID,
      createdAt: new Date(now.getTime() - day),
      totalAmount: 34200,
      paymentProvider: "MERCADOPAGO",
    },
    {
      email: "paciente.inv-4@starfeet.ar",
      name: "Paciente Invitado 4",
      phone: "+54 11 6000 1004",
      transactionId: "trx-demo-kinesio-patient-005",
      orderStatus: OrderStatus.PAID,
      createdAt: now,
      totalAmount: 28900,
      paymentProvider: "TRANSFERENCIA",
    },
  ];
}

async function main() {
  await ensureClientUser();
  const product = await ensureProduct();

  const coupon = await prisma.coupon.findFirst({
    where: {
      code: DEMO_COUPON_CODE,
      isActive: true,
      assignments: { some: {} },
    },
    include: {
      assignments: {
        select: { kinesioUserId: true },
      },
    },
  });

  if (!coupon) {
    throw new Error(`No se encontró un cupón activo asignado con código ${DEMO_COUPON_CODE}`);
  }

  const patients = buildPatients(new Date());

  await prisma.$transaction(async (tx) => {
    await tx.order.deleteMany({
      where: {
        transactionId: { in: patients.map((patient) => patient.transactionId) },
      },
    });

    const createdOrders: Array<{ id: string; transactionId: string | null }> = [];

    for (const patientSeed of patients) {
      const linkedUser = patientSeed.linkedUserEmail
        ? await tx.user.findUnique({ where: { email: patientSeed.linkedUserEmail }, select: { id: true } })
        : null;

      if (patientSeed.linkedUserEmail && !linkedUser) {
        throw new Error(`No se encontró el usuario enlazado ${patientSeed.linkedUserEmail}`);
      }

      const slug = await generateUniquePatientSlug(patientSeed.name, patientSeed.email);
      const patient = await tx.patientProfile.upsert({
        where: { email: patientSeed.email },
        update: {
          name: patientSeed.name,
          phone: patientSeed.phone,
          linkedUserId: linkedUser?.id ?? null,
          source: linkedUser ? "WEB" : "INVITADO",
          lastOrderAt: patientSeed.createdAt,
        },
        create: {
          slug,
          email: patientSeed.email,
          name: patientSeed.name,
          phone: patientSeed.phone,
          linkedUserId: linkedUser?.id ?? null,
          source: linkedUser ? "WEB" : "INVITADO",
          firstOrderAt: patientSeed.createdAt,
          lastOrderAt: patientSeed.createdAt,
        },
      });

      const order = await tx.order.create({
        data: {
          status: patientSeed.orderStatus,
          currency: Currency.ARS,
          totalAmount: patientSeed.totalAmount,
          snapshotClientName: patientSeed.name,
          snapshotClientEmail: patientSeed.email,
          snapshotClientPhone: patientSeed.phone,
          paymentProvider: patientSeed.paymentProvider,
          transactionId: patientSeed.transactionId,
          userId: linkedUser?.id ?? null,
          patientId: patient.id,
          couponId: coupon.id,
          createdAt: patientSeed.createdAt,
          orderItems: {
            create: [
              {
                quantity: 1,
                unitPrice: patientSeed.totalAmount,
                userSelectedGender: Gender.UNISEX,
                userSelectedSize: "M",
                adminResolvedSize: PhysicalSize.M,
                productId: product.id,
              },
            ],
          },
        },
        select: { id: true, transactionId: true },
      });

      createdOrders.push(order);

      const discountAmount =
        coupon.discountType === "PERCENTAGE"
          ? (patientSeed.totalAmount * Number(coupon.discountValue)) / 100
          : Number(coupon.discountValue);
      const commissionTotal =
        coupon.commissionType === "PERCENTAGE"
          ? (patientSeed.totalAmount * Number(coupon.commissionValue)) / 100
          : Number(coupon.commissionValue);
      const commissionPerKinesio = coupon.assignments.length > 0 ? commissionTotal / coupon.assignments.length : 0;

      await tx.couponRedemption.create({
        data: {
          couponId: coupon.id,
          orderId: order.id,
          redeemedByUserId: linkedUser?.id ?? null,
          usedByEmail: patientSeed.email,
          discountSnapshot: new Prisma.Decimal(discountAmount.toFixed(2)),
          commissionSnapshot: new Prisma.Decimal(commissionTotal.toFixed(2)),
        },
      });

      if (coupon.assignments.length > 0 && commissionPerKinesio > 0) {
        await tx.commissionEntry.createMany({
          data: coupon.assignments.map((assignment) => ({
            kinesioUserId: assignment.kinesioUserId,
            orderId: order.id,
            couponId: coupon.id,
            amount: new Prisma.Decimal(commissionPerKinesio.toFixed(2)),
            status: "PENDING",
          })),
        });
      }

      for (const assignment of coupon.assignments) {
        await tx.patientKinesioLink.upsert({
          where: {
            kinesioUserId_patientId: {
              kinesioUserId: assignment.kinesioUserId,
              patientId: patient.id,
            },
          },
          update: {
            firstCouponId: coupon.id,
            firstOrderId: order.id,
          },
          create: {
            patientId: patient.id,
            kinesioUserId: assignment.kinesioUserId,
            firstCouponId: coupon.id,
            firstOrderId: order.id,
          },
        });
      }
    }

    const redeemedCount = await tx.couponRedemption.count({
      where: { couponId: coupon.id },
    });

    await tx.coupon.update({
      where: { id: coupon.id },
      data: {
        usageCount: redeemedCount,
      },
    });

    console.log("Pacientes demo creados o actualizados:");
    for (const patientSeed of patients) {
      console.log(`- ${patientSeed.email} | ${patientSeed.linkedUserEmail ? "usuario" : "invitado"}`);
    }
    console.log(`Cupón usado: ${coupon.code} | redenciones totales: ${redeemedCount}`);
    console.log("Órdenes demo:");
    for (const order of createdOrders) {
      console.log(`- ${order.transactionId} | ${order.id}`);
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
