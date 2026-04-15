# TECH_BLUEPRINT_V1

## Fecha
- 2026-04-15

## Objetivo
- Definir arquitectura técnica v1 para implementar los dominios `home`, `ecommerce`, `admin`, `kinesio`, `cliente` con seguridad, accesibilidad y trazabilidad de negocio.

## Arquitectura por dominios (App Router)
- `app/(home)`:
- landing, storytelling, contenidos institucionales
- `app/(shop)`:
- catálogo, PDP, carrito, checkout, estado de compra
- `app/(cliente)`:
- perfil, historial de compras, detalle de orden, seguimiento
- `app/(kinesio)`:
- dashboard mobile-first, cupones asignados, pacientes relacionados, ganancias, liquidaciones
- `app/(admin)`:
- dashboard ejecutivo, cupones, ventas, envíos, leads, campañas, usuarios
- `app/api/*`:
- endpoints versionados por dominio (`/api/v1/admin/*`, `/api/v1/kinesio/*`, `/api/v1/cliente/*`, `/api/v1/shop/*`)

## Capas y módulos (SOLID)
- `modules/auth`:
- sesión, guardas RBAC, políticas de acceso
- `modules/users`:
- usuarios registrados, profesionales, activación
- `modules/patients`:
- entidad paciente/relación comercial-clínica
- `modules/coupons`:
- creación, asignación multi-kinesiólogo, reglas de uso/caducidad/acumulable
- `modules/cart`:
- carrito con TTL 2h y expiración
- `modules/orders`:
- checkout, órdenes, estados y snapshots
- `modules/payments`:
- Mercado Pago + transferencia
- `modules/shipping`:
- estados de envío y proveedor logístico
- `modules/commissions`:
- devengo por entrega, liquidación periódica
- `modules/crm`:
- leads, pipeline, timeline, campañas base
- `modules/notifications`:
- emails transaccionales y automatizaciones
- `modules/i18n`:
- traducciones y localización ARS/USD
- `modules/audit`:
- log de eventos críticos

## Modelo de datos v1 (delta sobre schema actual)
- Agregar relación N:M cupón-kinesiólogo:
- `CouponAssignment` (`couponId`, `kinesioUserId`, `assignedAt`, `assignedBy`)
- Agregar uso de cupón trazable:
- `CouponRedemption` (`couponId`, `orderId`, `usedByEmail`, `usedByUserId?`, `usedAt`, `discountSnapshot`, `commissionSnapshot`)
- Agregar paciente como entidad dedicada:
- `PatientProfile` (`email`, `name?`, `phone?`, `source`, `linkedUserId?`, `firstOrderAt`, `lastOrderAt`)
- Vincular paciente con kinesiólogo:
- `PatientKinesioLink` (`patientId`, `kinesioUserId`, `firstCouponId`, `firstOrderId`, `linkedAt`)
- Carrito:
- `Cart` (`status`, `expiresAt`, `lastActivityAt`, `currency`, `couponId?`, `customerEmail`)
- `CartItem` (`cartId`, `productId`, `inventoryId?`, `qty`, `unitPriceSnapshot`)
- Comisiones y liquidación:
- `CommissionEntry` (`orderId`, `couponId`, `kinesioUserId`, `amount`, `status`, `earnedAt`)
- `PayoutPeriod` (`periodStart`, `periodEnd`, `status`)
- `PayoutLine` (`payoutPeriodId`, `commissionEntryId`, `amount`)
- CRM:
- `Lead` + `LeadActivity` + `Campaign` + `CampaignRecipient`

## Contratos API v1 (mínimos)
- Admin:
- `POST /api/v1/admin/coupons`
- `POST /api/v1/admin/coupons/:id/assignments`
- `GET /api/v1/admin/sales`
- `GET /api/v1/admin/leads`
- `POST /api/v1/admin/campaigns`
- Kinesio:
- `GET /api/v1/kinesio/dashboard?from&to`
- `GET /api/v1/kinesio/coupons`
- `GET /api/v1/kinesio/patients`
- `GET /api/v1/kinesio/commissions`
- Cliente:
- `GET /api/v1/cliente/orders`
- `GET /api/v1/cliente/orders/:id`
- Shop:
- `POST /api/v1/shop/cart`
- `PATCH /api/v1/shop/cart/:id`
- `POST /api/v1/shop/cart/:id/apply-coupon`
- `POST /api/v1/shop/checkout`

## Reglas críticas de negocio
- Cupón:
- define usos máximos, acumulable y vencimiento 23:59 de la fecha configurada
- puede asignarse a múltiples kinesiólogos
- Carrito:
- expira a las 2h desde última actividad
- en checkout siempre se revalida vigencia de cupón y precios
- Comisión:
- se devenga al entregar orden
- se paga al cierre de período
- Invitado a cliente:
- consolidación por email verificado al registrarse

## Seguridad (no negociable)
- RBAC y ownership checks server-side en todas las acciones.
- Validación de entrada con schemas por endpoint.
- Auditoría de acciones críticas (cupones, roles, pagos, liquidaciones, campañas).
- Idempotencia en checkout/webhooks/pagos.
- Rate limiting en auth, checkout, apply-coupon y endpoints sensibles.
- Secretos en entorno, rotación y mínimo privilegio.

## Accesibilidad y UX
- WCAG 2.2 AA.
- Navegación por teclado y focus visible.
- Contraste y semántica.
- Estados de carga, vacíos y error en todos los flujos.
- Kinesio mobile-first; Admin desktop-first responsive.

## Design systems (arquitectura)
- `packages/ui-core`:
- tokens base, primitives, utilidades a11y
- `packages/ui-home`
- `packages/ui-commerce`
- `packages/ui-admin`
- `packages/ui-kinesio`
- `packages/ui-cliente`
- Regla:
- compartir solo primitives/tokens semánticos; no mezclar componentes de dominio sin wrapper.

## Plan de ejecución Etapa 1
- 1. Migraciones Prisma base (coupon N:M, patient, cart, commission).
- 2. Guardas RBAC + utilidades de autorización.
- 3. APIs v1 mínimas Admin/Kinesio/Shop/Cliente.
- 4. Scaffolding de rutas por dominio y layouts.
- 5. Base de design systems separados + documentación interna.
- 6. Quality gate local + smoke actualizado.
