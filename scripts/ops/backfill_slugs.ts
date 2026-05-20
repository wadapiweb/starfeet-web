import { PrismaClient } from "@prisma/client";
import {
  generateUniqueCouponSlug,
  generateUniquePatientSlug,
  generateUniqueProductSlug,
  generateUniqueUserSlug,
} from "../../lib/slug";

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    where: { slug: null },
    select: { id: true, name: true, email: true },
  });

  for (const user of users) {
    const slug = await generateUniqueUserSlug(user.name, user.email, user.id);
    await prisma.user.update({ where: { id: user.id }, data: { slug } });
  }

  const products = await prisma.product.findMany({
    where: { slug: null },
    select: { id: true, name: true },
  });

  for (const product of products) {
    const slug = await generateUniqueProductSlug(product.name);
    await prisma.product.update({ where: { id: product.id }, data: { slug } });
  }

  const coupons = await prisma.coupon.findMany({
    where: { slug: null },
    select: { id: true, code: true },
  });

  for (const coupon of coupons) {
    const slug = await generateUniqueCouponSlug(coupon.code);
    await prisma.coupon.update({ where: { id: coupon.id }, data: { slug } });
  }

  const patients = await prisma.patientProfile.findMany({
    where: { slug: null },
    select: { id: true, name: true, email: true },
  });

  for (const patient of patients) {
    const slug = await generateUniquePatientSlug(patient.name, patient.email ?? patient.id);
    await prisma.patientProfile.update({ where: { id: patient.id }, data: { slug } });
  }

  const orders = await prisma.order.findMany({
    where: { slug: null },
    select: { id: true },
  });

  for (const order of orders) {
    await prisma.order.update({
      where: { id: order.id },
      data: { slug: `orden-${order.id}` },
    });
  }

  console.log("Backfill slugs completado", {
    users: users.length,
    products: products.length,
    coupons: coupons.length,
    patients: patients.length,
    orders: orders.length,
  });
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
