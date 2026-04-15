# SESSION_CONTEXT

## Proyecto
- Nombre: starfeet-web
- Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Prisma ORM + next-auth v5 + next-intl + Framer Motion + Zustand

## Estado de sesión
- Fecha: 2026-04-15
- Rama activa: main
- Objetivo del bloque: Instalación y configuración del Senior Staged Delivery Workflow.

## Cambios implementados
- [X] Copiado del template `workflow_1.zip` al root del proyecto.
- [X] `doc/PROJECT_CONTEXT.md` — variables `{{}}` reemplazadas con datos reales del proyecto.
- [X] `doc/PROJECT_BOOTSTRAP_REPORT.md` — completado con stack, estructura y riesgos reales.
- [X] `scripts/ops/stage_gate.sh` — adaptado para monolito Next.js (sin frontend/ ni backend/).
- [X] `scripts/smoke/smoke_minimal.sh` — personalizado con rutas reales de la app (homepage, auth/session, login).
- [X] `.github/workflows/stage0-quality-gate.yml` — adaptado para CI monolítico con Prisma validate.
- [X] Permisos de ejecución aplicados a todos los scripts.
- [X] `doc/REQUIREMENTS_DISCOVERY.md` — documentado alcance funcional multi-dominio (home/ecommerce/admin/kinesio), criterios de arquitectura y plan por etapas.
- [X] Discovery funcional actualizado con decisiones de negocio del owner:
- roles finales (`ADMIN`, `KINESIOLOGO`, `CLIENTE`, comprador invitado)
- reglas de cupones (usos, acumulable, caducidad, multi-kinesiólogo)
- reglas de comisión/liquidación
- pagos (Mercado Pago + transferencia), envíos (Jipink tentativo), emailing y CRM base
- prioridad mobile-first para entorno kinesio
- criterios de seguridad y accesibilidad como no negociables
- [X] Definiciones cerradas:
- paciente como entidad dedicada
- carrito con TTL de 2 horas y revalidación de cupón en checkout
- unificación de historial invitado→cliente registrado por email verificado
- alcance CRM v1 definido (pipeline, campos y automatizaciones mínimas)
- [X] `doc/TECH_BLUEPRINT_V1.md` creado con arquitectura v1:
- dominios/rutas
- módulos SOLID
- delta de modelo de datos
- contratos API mínimos
- reglas de seguridad/a11y
- plan de ejecución de Etapa 1
- [X] Etapa 1 (bloque técnico inicial) implementada:
- `prisma/schema.prisma` refactorizado con:
- cupones multi-kinesiólogo (`CouponAssignment`)
- redenciones (`CouponRedemption`)
- paciente dedicado (`PatientProfile`, `PatientKinesioLink`)
- carrito con TTL (`Cart`, `CartItem`)
- comisiones/liquidación (`CommissionEntry`, `PayoutPeriod`)
- CRM v1 (`Lead`, `LeadActivity`, `Campaign`, `CampaignRecipient`)
- `prisma.config.ts` agregado para compatibilidad Prisma 7
- `prisma/seed.ts` actualizado al nuevo dominio
- helpers server-side agregados:
- `lib/authz.ts`
- `lib/api.ts`
- `lib/cart.ts`
- API v1 scaffolding inicial agregado:
- `admin/coupons` + `admin/coupons/:id/assignments`
- `kinesio/coupons` + `kinesio/dashboard`
- `cliente/orders`
- `shop/cart`, `shop/cart/:id`, `shop/cart/:id/apply-coupon`, `shop/checkout`
- [X] Ajustes de estabilidad del bloque:
- compatibilidad de tipado `next-auth` + Prisma Adapter
- limpieza de warnings de lint heredados
- regeneración de Prisma Client en v6.19.2
- fallback de Home cuando DB no está disponible en build/prerender
- [X] Scaffolding de dominios UI implementado:
- rutas base con guardas de rol: `/admin`, `/kinesio`, `/cliente`
- rutas públicas institucionales: `/tienda`, `/tecnologia`, `/nosotros`
- catálogo de `/tienda` conectado con fallback sin DB en build
- [X] Vertical funcional inicial implementado en Admin:
- endpoint `GET /api/v1/admin/kinesios` para asignaciones
- UI `AdminCouponsManager` en `/admin` con:
- listado de cupones
- formulario de creación de cupón
- asignación múltiple de kinesiólogos
- [X] Corrección de visibilidad del sitio en entorno dev:
- mitigación de crash Turbopack en contenedor con `next dev --webpack`
- limpieza de `.next` + reinicio de `starfeet-web`
- validación de respuesta real por dominio `dev.starfeet.ar` (HTTP 200)
- [X] Vertical funcional inicial implementado en Kinesio:
- endpoint `GET /api/v1/kinesio/patients`
- endpoint `GET /api/v1/kinesio/commissions`
- UI mobile-first `KinesioDashboard` en `/kinesio` conectada a:
- métricas por fecha
- cupones asignados
- pacientes vinculados
- comisiones recientes y estado de liquidación

## Validaciones ejecutadas
- [X] lint (sin errores)
- [X] build
- [ ] test
- [X] prisma validate
- [ ] smoke

## Impacto de deploy
- DB/migrations: N/A (cambios solo de infraestructura de proceso)
- Infra/env: Se añaden archivos de workflow, scripts y doc — sin impacto en runtime
- Rollback: `git revert` o eliminar los directorios añadidos

## Riesgos residuales
- [ ] Configurar variables/secrets en GitHub Actions antes de activar el CI
- [ ] Personalizar rutas del smoke test con endpoints reales de la app
- [ ] Activar branch protection en `main` en GitHub
- [ ] Implementar técnicamente decisiones de Etapa 0 en schema, API y UI
- [ ] warnings de deprecación Prisma config (`package.json#prisma`) a normalizar en siguiente bloque
- [ ] falta conectar flujo checkout -> comisiones con lógica de negocio completa (devengo/liquidación real)
- [ ] dashboards y módulos restantes aún en modo scaffold parcial (cliente/shop/admin extendido)
- [ ] falta wiring end-to-end de checkout real con comisiones y dashboard kinesio conectado a datos reales
