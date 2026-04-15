# PROJECT_BOOTSTRAP_REPORT

## 0. Metadata
- Proyecto: starfeet-web
- Stack detectado: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Prisma ORM + next-auth v5 + next-intl + Framer Motion + Zustand
- Fecha de bootstrap: 2026-04-15

## 1. Arquitectura y stack
- Frontend: Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + Framer Motion + Zustand
- Backend: API Routes en Next.js (mismo proceso — sin servidor separado)
- Auth: next-auth v5 con Prisma Adapter (`auth.ts`)
- DB/Cache: Prisma ORM — schema en `prisma/schema.prisma`; cache en `/cache`
- i18n: next-intl — idioma base `es`, mensajes en `messages/`
- Infra: Docker Compose en `/opt/docker/starfeet-web/docker-compose.yml`

## 2. Estructura de directorios relevante
```
/
├── app/           ← App Router (páginas, layouts, API Routes)
├── components/    ← Componentes organizados por Atomic Design
├── lib/           ← Utilidades y helpers
├── prisma/        ← Schema y seeds de base de datos
├── public/        ← Assets estáticos
├── cache/         ← Caché de aplicación
├── auth.ts        ← Configuración de next-auth v5
├── next.config.ts ← Configuración de Next.js
├── tailwind.config.ts
└── tsconfig.json
```

## 3. Entornos
- Dev: Docker local en /opt/docker/starfeet-web · `npm run dev` → puerto 3000
- Staging: No configurado aún
- Prod: No configurado aún

## 4. Estrategia de deploy
- Flujo: Senior Staged Delivery (Etapas 0-6) via AGENTS.md
- Rollback: Reversión de commits en Git + `prisma migrate reset` si hay migraciones

## 5. Estrategia de testing
- Lint/build: `npm run lint` + `npm run build` (gestionado por `scripts/ops/stage_gate.sh`)
- Smoke: `scripts/smoke/smoke_minimal.sh` (a personalizar con rutas reales de la app)
- Tests unitarios/integración: No configurados aún — deuda técnica

## 6. Riesgos actuales
- [X] Sin separación frontend/backend: `stage_gate.sh` usa detección por `frontend/package.json` — se debe usar desde root
- [X] Sin tests unitarios/integración configurados
- [X] Sin entornos de staging/prod definidos aún
- [ ] Revisar variables de entorno en `.env` para completar smoke tests con credenciales reales

## 7. Deuda técnica inicial
- [ ] Configurar test runner (vitest o jest)
- [ ] Definir entorno staging
- [ ] Personalizar `smoke_minimal.sh` con rutas reales de la app
- [ ] Configurar GitHub Actions variables/secrets

## 8. Backlog inicial
1. Personalizar `scripts/smoke/smoke_minimal.sh` con rutas reales
2. Adaptar `stage_gate.sh` para proyecto monolítico (sin frontend/ ni backend/)
3. Configurar GitHub Actions con secrets reales
4. Activar branch protection en `main`
5. Configurar entorno staging
