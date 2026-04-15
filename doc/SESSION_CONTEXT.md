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

## Validaciones ejecutadas
- [ ] lint
- [ ] build
- [ ] test
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
