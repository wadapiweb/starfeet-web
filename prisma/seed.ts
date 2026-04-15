import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Iniciando seed...')

    // Limpiar BD (opcional/seguro)
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.productInventory.deleteMany()
    await prisma.product.deleteMany()
    await prisma.coupon.deleteMany()
    await prisma.user.deleteMany()

    // 1. Usuarios
    const hashedPassword = await bcrypt.hash('123456', 10)

    const admin = await prisma.user.create({
        data: {
            email: 'admin@starfeet.ar',
            name: 'Admin',
            password: hashedPassword,
            role: 'ADMIN',
        },
    })
    console.log('Admin creado:', admin.email)

    const kinesio = await prisma.user.create({
        data: {
            email: 'kinesio@prueba.com',
            name: 'Kinesiólogo',
            password: hashedPassword,
            role: 'KINESIOLOGO',
        },
    })
    console.log('Kinesiólogo creado:', kinesio.email)

    // 2. Cupones
    const coupon = await prisma.coupon.create({
        data: {
            code: 'PRUEBA-10',
            discountValue: 10,
            discountType: 'PERCENTAGE',
            userId: kinesio.id,
        },
    })
    console.log('Cupón creado:', coupon.code)

    // 3. Catálogo (Product)
    const starfeet = await prisma.product.create({
        data: {
            name: 'Starfeet Corrector',
            type: 'STARFEET',
            priceArs: 45000,
            priceUsd: 45,
            imageUrls: [],
        },
    })
    console.log('Producto creado:', starfeet.name)

    const slipper = await prisma.product.create({
        data: {
            name: 'Pantuflas Relax',
            type: 'SLIPPER',
            priceArs: 25000,
            priceUsd: 25,
            imageUrls: [],
        },
    })
    console.log('Producto creado:', slipper.name)

    // 4. Inventario (ProductInventory)
    // Para el Starfeet
    await prisma.productInventory.createMany({
        data: [
            { productId: starfeet.id, sku: 'STF-S', physicalSize: 'S', stock: 100 },
            { productId: starfeet.id, sku: 'STF-M', physicalSize: 'M', stock: 100 },
            { productId: starfeet.id, sku: 'STF-L', physicalSize: 'L', stock: 100 },
        ],
    })

    // Para las Pantuflas
    await prisma.productInventory.createMany({
        data: [
            { productId: slipper.id, sku: 'SLP-S', physicalSize: 'S', stock: 50 },
            { productId: slipper.id, sku: 'SLP-M', physicalSize: 'M', stock: 50 },
            { productId: slipper.id, sku: 'SLP-L', physicalSize: 'L', stock: 50 },
        ],
    })
    console.log('Inventario creado')

    console.log('Seed completado ✅')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
