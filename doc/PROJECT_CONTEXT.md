# PROJECT_CONTEXT

## Identidad
- Nombre del proyecto: starfeet-web (Plataforma Core)
- Repositorios:
  1. **starfeet-web (Core / VPS)**: `git@github.com:wadapiweb/starfeet-web.git` - Contiene la tienda, panel de kinesiólogos, admin y base de datos Postgres.
  2. **starfeet-landing (Landing / Cloud)**: `git@github.com:wadapiweb/starfeet-landing.git` - Landing page estática exportable a Hostinger Cloud.
- Stack detectado: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Prisma ORM + next-auth v5 + next-intl + Framer Motion + Zustand + Traefik

## Entornos
- **VPS-DEV**: `72.60.141.77`
  - Core dev objetivo: `https://dev-dashboard.starfeet.ar`, `https://dev-tienda.starfeet.ar`, `https://dev-kine.starfeet.ar`
  - Landing VPS dev: `https://dev1.starfeet.ar`
  - Modo esperado: `next dev`
- **Hostinger Cloud**:
  - Home/cloud dev: `https://dev.starfeet.ar`
  - Debe linkear hacia dominios DEV mientras se ordena VPS-DEV.
- **VPS-PROD futuro**: `76.13.121.160`
  - Staging y produccion se implementaran despues de ordenar DEV.
  - Dominios futuros: `staging-*` y `dashboard/tienda/kine`.

Plan activo:
- Ver `doc/DEV_ENVIRONMENT_REORGANIZATION_PLAN.md`.

## Comandos base (starfeet-web)
- Lint: `npm run lint`
- Build: `npm run build`
- Test: — (no configurado aún)
- Smoke: `scripts/smoke/smoke_minimal.sh`
- DB Migrate: `npx prisma migrate dev`
- DB Studio: `npx prisma studio`
- Seed: `npx prisma db seed`

## Notas operativas
- Enrutamiento: Controlado a través del Proxy Edge en `proxy.ts`, que reescribe subdominios a carpetas internas (`/tienda`, `/kinesio`, `/admin`).
- Cookies: Configuración de cookies de sesión wildcard (`domain: ".starfeet.ar"`) en `auth.ts` para compartir sesión entre subdominios.
- API de Productos: Endpoint público `/api/v1/public/products` habilitado con CORS para la landing.
- Compra rápida: Endpoint `/carrito/agregar` disponible para capturar el carrito desde la landing estática.
- ORM: Prisma — schema en `prisma/schema.prisma`
- Auth: next-auth v5 con Prisma Adapter — config en `auth.ts`
- i18n: next-intl — mensajes en `messages/` (idioma base: es)
