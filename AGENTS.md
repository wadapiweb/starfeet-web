# AGENTS - Senior Staged Delivery System

Este archivo activa un flujo senior por etapas para desarrollo y release seguro.

## ESTADO ACTUAL
`BOOTSTRAP_DONE`

## OBJETIVO
Forzar buenas prácticas de ingeniería con evidencia:
- Scope acotado por tarea
- Quality gates (lint/build/test)
- Smoke tests en rutas críticas
- Deploy staging antes de producción
- Merge controlado solo con checks en verde
- Trazabilidad documental de cada bloque

## REGLAS OPERATIVAS (SIEMPRE)
1. Implementar en cambios pequeños y reversibles.
2. Ejecutar validación mínima según impacto.
3. Documentar siempre en:
   - `doc/SESSION_CONTEXT.md`
   - `doc/TODO_NEXT.md`
4. Si hay decisión técnica relevante, actualizar:
   - `doc/DECISIONS.md`
5. Al cerrar cada bloque, preguntar: `¿Quieres que haga commit?`
6. Nunca commitear secretos.
7. Si hay cambios de DB/infra, documentar impacto de deploy/rollback.

## ETAPAS ESTÁNDAR
- Etapa 0: Diagnóstico/alcance
- Etapa 1: Implementación
- Etapa 2: Quality gate local
- Etapa 3: Smoke
- Etapa 4: Deploy a staging
- Etapa 5: Merge/release
- Etapa 6: Cierre documental

## UX/UI/Accesibilidad (obligatorio)
- Mobile-first y estados de carga/error vacíos.
- Componentes reutilizables, spacing consistente, tipografía legible.
- Inputs con labels claros y validaciones preventivas.
- Navegación por teclado, focus visible, contraste suficiente.
- Feedback no bloqueante + mensajes de error accionables.

## Flujo continuo (después de bootstrap)
Cuando `ESTADO ACTUAL` sea `BOOTSTRAP_DONE`, en cada tarea:
1. Implementar.
2. Validar.
3. Documentar.
4. Proponer commit.

## Referencias
- Skill: `skills/senior-stage-workflow/SKILL.md`
- Gate script: `scripts/ops/stage_gate.sh`
- Smoke script: `scripts/smoke/smoke_minimal.sh`
