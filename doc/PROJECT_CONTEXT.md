# PROJECT_CONTEXT

## Identidad
- Nombre del proyecto: starfeet-web
- Stack detectado: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Prisma ORM + next-auth v5 + next-intl + Framer Motion + Zustand
- Inicializado: 2026-04-15

## Entornos
- Dev: http://localhost:3000 (DEV-Starfeet-WEB-Dev · Docker en /opt/docker/starfeet-web)
- Staging: —
- Prod: —

## Comandos base
- Lint: `npm run lint`
- Build: `npm run build`
- Test: — (no configurado aún)
- Smoke: `scripts/smoke/smoke_minimal.sh`
- DB Migrate: `npx prisma migrate dev`
- DB Studio: `npx prisma studio`
- Seed: `npx prisma db seed`

## Notas operativas
- Sin backend separado: API Routes en Next.js (App Router)
- ORM: Prisma — schema en `prisma/schema.prisma`
- Auth: next-auth v5 con Prisma Adapter — config en `auth.ts`
- i18n: next-intl — mensajes en `messages/` (idioma base: es)
- Sin separación frontend/backend en directorios — todo en root
- El script `stage_gate.sh` NO detectará `frontend/package.json` ni `backend/package.json`, usar modo directo desde root
