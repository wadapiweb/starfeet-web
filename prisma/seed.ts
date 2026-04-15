import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  await prisma.campaignRecipient.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.commissionEntry.deleteMany();
  await prisma.payoutPeriod.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.patientKinesioLink.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productInventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.couponAssignment.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("123456", 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const admin = await prisma.user.create({
    data: {
      slug: "admin",
      email: "admin@starfeet.ar",
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const kinesioA = await prisma.user.create({
    data: {
      slug: "kinesiologo-uno",
      email: "kinesio1@starfeet.ar",
      name: "Kinesiólogo Uno",
      password: hashedPassword,
      role: "KINESIOLOGO",
    },
  });

  const kinesioB = await prisma.user.create({
    data: {
      slug: "kinesiologo-dos",
      email: "kinesio2@starfeet.ar",
      name: "Kinesiólogo Dos",
      password: hashedPassword,
      role: "KINESIOLOGO",
    },
  });

  const coupon = await prisma.coupon.create({
    data: {
      slug: "kinesio-10",
      code: "KINESIO-10",
      discountValue: 10,
      discountType: "PERCENTAGE",
      maxUses: 100,
      isStackable: false,
      expiresAt,
      commissionType: "PERCENTAGE",
      commissionValue: 5,
      createdById: admin.id,
      assignments: {
        create: [
          { kinesioUserId: kinesioA.id, assignedById: admin.id },
          { kinesioUserId: kinesioB.id, assignedById: admin.id },
        ],
      },
    },
  });

  const starfeet = await prisma.product.create({
    data: {
      slug: "starfeet-corrector",
      name: "Starfeet Corrector",
      type: "STARFEET",
      priceArs: 45000,
      priceUsd: 45,
      imageUrls: [],
    },
  });

  const slipper = await prisma.product.create({
    data: {
      slug: "pantuflas-relax",
      name: "Pantuflas Relax",
      type: "SLIPPER",
      priceArs: 25000,
      priceUsd: 25,
      imageUrls: [],
    },
  });

  await prisma.productInventory.createMany({
    data: [
      { productId: starfeet.id, sku: "STF-S", physicalSize: "S", stock: 100 },
      { productId: starfeet.id, sku: "STF-M", physicalSize: "M", stock: 100 },
      { productId: starfeet.id, sku: "STF-L", physicalSize: "L", stock: 100 },
      { productId: slipper.id, sku: "SLP-S", physicalSize: "S", stock: 50 },
      { productId: slipper.id, sku: "SLP-M", physicalSize: "M", stock: 50 },
      { productId: slipper.id, sku: "SLP-L", physicalSize: "L", stock: 50 },
    ],
  });

  await prisma.lead.create({
    data: {
      name: "Lead Demo",
      email: "lead@example.com",
      source: "WEB",
      status: "NEW_LEAD",
      ownerId: admin.id,
      interest: "Starfeet Corrector",
    },
  });

  console.log("Seed completado ✅");
  console.log("Admin:", admin.email);
  console.log("Coupon:", coupon.code);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
