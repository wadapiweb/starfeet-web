# PROJECT_CONTEXT

## Identidad
- Nombre del proyecto: starfeet-web (Plataforma Core)
- Repositorios:
  1. **starfeet-web (Core / VPS)**: `git@github.com:wadapiweb/starfeet-web.git` - Contiene la tienda, panel de kinesiólogos, admin y base de datos Postgres.
  2. **starfeet-landing (Landing / Cloud)**: `git@github.com:wadapiweb/starfeet-landing.git` - Landing page estática exportable a Hostinger Cloud.
- Stack detectado: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Prisma ORM + next-auth v5 + next-intl + Framer Motion + Zustand + Traefik

## Entornos (Desarrollo actual)
- **Landing (Main Domain)**: `https://starfeet.ar` -> Hostinger Cloud
- **Plataforma (Subdominios)** -> Docker/Traefik VPS:
  - E-commerce: `https://tienda.starfeet.ar`
  - Portal Kinesiología: `https://kine.starfeet.ar`
  - Panel Admin: `https://dashboard.starfeet.ar`

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
