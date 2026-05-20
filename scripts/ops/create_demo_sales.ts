import { PrismaClient, Currency, OrderStatus, ProductType, PhysicalSize, Gender } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function ensureClientUser() {
  const password = await bcrypt.hash("123456", 10);
  return prisma.user.upsert({
    where: { email: "cliente.demo.ventas@starfeet.ar" },
    update: {
      name: "Cliente Demo Ventas",
      role: "CLIENTE",
      isActive: true,
    },
    create: {
      email: "cliente.demo.ventas@starfeet.ar",
      slug: "cliente-demo-ventas",
      name: "Cliente Demo Ventas",
      role: "CLIENTE",
      isActive: true,
      password,
    },
  });
}

async function ensureProduct() {
  const product = await prisma.product.upsert({
    where: { slug: "starfeet-demo-ventas" },
    update: {
      name: "Starfeet Demo Ventas",
      description: "Producto de prueba para órdenes demo de admin.",
      type: ProductType.STARFEET,
      priceArs: 25000,
      priceUsd: 25,
      imageUrls: [],
      isActive: true,
    },
    create: {
      slug: "starfeet-demo-ventas",
      name: "Starfeet Demo Ventas",
      description: "Producto de prueba para órdenes demo de admin.",
      type: ProductType.STARFEET,
      priceArs: 25000,
      priceUsd: 25,
      imageUrls: [],
      isActive: true,
    },
  });

  const inventory = await prisma.productInventory.upsert({
    where: { sku: "STF-DEMO-M" },
    update: {
      productId: product.id,
      physicalSize: PhysicalSize.M,
      stock: 100,
      lowStockThreshold: 5,
    },
    create: {
      sku: "STF-DEMO-M",
      productId: product.id,
      physicalSize: PhysicalSize.M,
      stock: 100,
      lowStockThreshold: 5,
    },
  });

  return { product, inventory };
}

async function ensurePatient() {
  const email = "cliente.demo.ventas@starfeet.ar";
  const existing = await prisma.patientProfile.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.patientProfile.create({
    data: {
      slug: "cliente-demo-ventas",
      email,
      name: "Cliente Demo Ventas",
      phone: "+54 11 5000 0000",
      source: "WEB",
    },
    select: { id: true },
  });
}

async function upsertOrder(params: {
  marker: string;
  status: OrderStatus;
  currency: Currency;
  totalAmount: number;
  paymentProvider: string | null;
  transactionId: string;
  userId: string;
  patientId: string;
  productId: string;
  inventoryId: string;
  createdAt: Date;
}) {
  const existing = await prisma.order.findFirst({
    where: { transactionId: params.transactionId },
    select: { id: true },
  });

  if (existing) {
    await prisma.orderItem.deleteMany({ where: { orderId: existing.id } });
    await prisma.order.update({
      where: { id: existing.id },
      data: {
        status: params.status,
        currency: params.currency,
        totalAmount: params.totalAmount,
        snapshotClientName: "Cliente Demo Ventas",
        snapshotClientEmail: "cliente.demo.ventas@starfeet.ar",
        snapshotClientPhone: `+54 11 5000 0000 (${params.marker})`,
        paymentProvider: params.paymentProvider,
        transactionId: params.transactionId,
        userId: params.userId,
        patientId: params.patientId,
        shippingDetails: {
          address: "Calle Demo 123",
          city: "Buenos Aires",
          country: "AR",
        },
        createdAt: params.createdAt,
        orderItems: {
          create: [
            {
              quantity: 1,
              unitPrice: params.totalAmount,
              userSelectedGender: Gender.UNISEX,
              userSelectedSize: "M",
              adminResolvedSize: PhysicalSize.M,
              productId: params.productId,
              inventoryId: params.inventoryId,
            },
          ],
        },
      },
    });
    return;
  }

  await prisma.order.create({
    data: {
      status: params.status,
      currency: params.currency,
      totalAmount: params.totalAmount,
      snapshotClientName: "Cliente Demo Ventas",
      snapshotClientEmail: "cliente.demo.ventas@starfeet.ar",
      snapshotClientPhone: `+54 11 5000 0000 (${params.marker})`,
      paymentProvider: params.paymentProvider,
      transactionId: params.transactionId,
      userId: params.userId,
      patientId: params.patientId,
      shippingDetails: {
        address: "Calle Demo 123",
        city: "Buenos Aires",
        country: "AR",
      },
      createdAt: params.createdAt,
      orderItems: {
        create: [
          {
            quantity: 1,
            unitPrice: params.totalAmount,
            userSelectedGender: Gender.UNISEX,
            userSelectedSize: "M",
            adminResolvedSize: PhysicalSize.M,
            productId: params.productId,
            inventoryId: params.inventoryId,
          },
        ],
      },
    },
  });
}

async function main() {
  const user = await ensureClientUser();
  const { product, inventory } = await ensureProduct();
  const patient = await ensurePatient();

  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;

  await upsertOrder({
    marker: "NO_PAGADA",
    status: OrderStatus.PENDING_PAYMENT,
    currency: Currency.ARS,
    totalAmount: 25000,
    paymentProvider: "MERCADOPAGO",
    transactionId: "trx-demo-pending-001",
    userId: user.id,
    patientId: patient.id,
    productId: product.id,
    inventoryId: inventory.id,
    createdAt: new Date(now.getTime() - oneDayMs * 2),
  });

  await upsertOrder({
    marker: "PAGADA",
    status: OrderStatus.PAID,
    currency: Currency.ARS,
    totalAmount: 26000,
    paymentProvider: "MERCADOPAGO",
    transactionId: "trx-demo-paid-001",
    userId: user.id,
    patientId: patient.id,
    productId: product.id,
    inventoryId: inventory.id,
    createdAt: new Date(now.getTime() - oneDayMs),
  });

  await upsertOrder({
    marker: "ENTREGADA",
    status: OrderStatus.DELIVERED,
    currency: Currency.ARS,
    totalAmount: 27000,
    paymentProvider: "TRANSFERENCIA",
    transactionId: "trx-demo-delivered-001",
    userId: user.id,
    patientId: patient.id,
    productId: product.id,
    inventoryId: inventory.id,
    createdAt: now,
  });

  const created = await prisma.order.findMany({
    where: {
      transactionId: {
        in: ["trx-demo-pending-001", "trx-demo-paid-001", "trx-demo-delivered-001"],
      },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true, totalAmount: true, transactionId: true, createdAt: true },
  });

  console.log("Ventas demo listas:");
  for (const order of created) {
    console.log(`- ${order.transactionId} | ${order.status} | ${order.id} | ARS ${Number(order.totalAmount)}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
