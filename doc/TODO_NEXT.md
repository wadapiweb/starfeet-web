# TODO_NEXT

## Etapas
- [ ] Etapa 0 Diagnóstico
- [ ] Etapa 1 Implementación
- [ ] Etapa 2 Quality gate
- [ ] Etapa 3 Smoke
- [ ] Etapa 4 Staging
- [ ] Etapa 5 Merge/Release
- [ ] Etapa 6 Cierre documental

## Backlog inmediato
- [X] Etapa 1: Proponer y validar blueprint técnico (módulos, carpetas, bounded contexts y ownership).
- [X] Etapa 1: Diseñar migración Prisma para cupones multi-kinesiólogo y entidad paciente.
- [X] Etapa 1: Diseñar modelo de carrito con TTL 2h + revalidación de cupón en checkout.
- [X] Etapa 1: Definir contratos API v1 para Admin, Kinesio, Cliente y E-commerce.
- [ ] Etapa 1: Definir arquitectura de design systems separados + tokens compartidos.
- [X] Etapa 1: Definir guardas RBAC server-side por módulo.
- [X] Etapa 1: Definir plan de implementación incremental por vertical funcional (cupones, órdenes, dashboard).
- [X] Resolver build local corrigiendo dependencias faltantes del entorno.
- [ ] Normalizar warnings de deprecación de Prisma config.
- [X] Implementar UI funcional de cada vertical: Cliente (órdenes).
- [X] Completar vertical Admin: edición/desactivación/revocación de cupones + filtros avanzados.
- [X] Completar vertical Kinesio: detalle de paciente, exportables y vista de liquidaciones por período.
- [ ] Completar vertical Shop: control de stock en checkout, selector de talle/variantes y estados de pago reales.
- [ ] Normalizar operación de cupón: edición de caducidad y comisiones desde UI admin.
- [ ] Mejorar precisión de liquidación: reglas de período contable y cierre/pago con workflow explícito.
- [X] Completar vertical Auth: login/registro/recupero con UX robusta y accesible.
- [X] Integrar flujo invitado por email para consulta de compras sin cuenta.
- [X] Integrar cuentas Google + credenciales sobre mismo email (linking controlado).
- [ ] Endurecer seguridad Auth: rate limiting en endpoints de códigos y auditoría de intentos.
- [ ] Implementar verificación formal de email y políticas de contraseña fuerte.
