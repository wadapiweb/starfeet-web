# REQUIREMENTS_DISCOVERY

## Fecha
- 2026-04-15

## Visión del producto
- Plataforma Starfeet con 5 dominios diferenciados:
- Home (marca/comunicación)
- E-commerce (venta online completa)
- Admin (operación de negocio, CRM, finanzas, usuarios)
- Kinesiólogo (gestión de cupones, pacientes, ganancias y performance)
- Cliente (portal de compras y seguimiento; contempla comprador invitado)

## Requerimientos funcionales validados
- Separación de sistemas de diseño por dominio: Home, E-commerce, Admin y Kinesio.
- El cliente puede:
- comprar como invitado
- crear cuenta
- ver historial de compras en su portal si está registrado
- Admin crea cupones configurables por:
- tipo de descuento (`PERCENTAGE` o `FIXED_AMOUNT`)
- caducidad
- cantidad máxima de usos por cupón
- acumulable (toggle)
- regla de comisión/ganancia para kinesiólogo
- Un cupón puede estar asignado a múltiples kinesiólogos.
- Un kinesiólogo puede tener múltiples cupones activos/inactivos.
- Kinesiólogo visualiza:
- Estado de cupones (usado/no usado/expirado)
- Quién lo usó
- Ganancia asociada
- Dashboard con filtros por rango de fechas y pacientes
- Ganancia visible al estado de entrega; liquidación al cierre de período.
- Estados de liquidación requeridos: `PENDING`, `VALIDATED`, `PAID`, `REJECTED`.
- Admin visualiza y gestiona:
- Ventas
- Cupones
- Envíos
- Mails
- Leads
- CRM comercial
- Finanzas
- Administración de usuarios profesionales
- Cliente visualiza:
- sus compras
- estado de pedidos y envíos
- datos de cuenta (si registrado)
- E-commerce profesional completo (catálogo, checkout, pagos, postventa, etc.).
- Medios de pago iniciales:
- Mercado Pago
- Transferencia
- Operador logístico tentativo: Jipink (a confirmar integración).
- Emailing transaccional + marketing:
- bienvenida
- recuperación de cuenta
- orden creada
- pago aprobado
- envío
- cupón usado
- campañas y automatizaciones básicas (carrito abandonado y campañas tipo Perfit)
- Monedas iniciales:
- ARS
- USD
- Internacionalización (i18n) requerida.
- Implementación con buenas prácticas de UX/UI, arquitectura senior, SOLID y componentes atomizados.

## Arquitectura de diseño (objetivo)
- `design-system-home`: orientado a branding/storytelling.
- `design-system-commerce`: orientado a conversión y compra.
- `design-system-admin`: orientado a productividad y densidad de información.
- `design-system-kinesio`: orientado a lectura clínica/comercial y trazabilidad de pacientes/cupones.
- `design-system-cliente`: orientado a autoservicio, trazabilidad de pedidos y claridad de estado.
- Base común mínima de tokens compartidos (escala tipográfica, spacing, semantic colors, estados, accesibilidad) con extensiones por dominio.
- Criterios UX/UI validados:
- Admin y Kinesio comparten lenguaje visual base.
- Kinesio prioriza mobile-first.
- E-commerce puede ser cercano al Home, pero desacoplado.

## Enfoque de implementación por etapas
- Etapa 0: Discovery funcional y reglas de negocio (cerrar definiciones con preguntas).
- Etapa 1: Arquitectura base
- módulos por dominio
- RBAC y permisos
- contratos de datos
- Etapa 2: Design systems separados + librería atomizada
- tokens
- atoms/molecules/organisms por dominio
- documentación visual
- Etapa 3: E-commerce core
- catálogo
- PDP
- carrito
- checkout
- órdenes
- Etapa 4: Módulo Admin v1
- cupones
- usuarios
- ventas
- envíos
- Etapa 5: Módulo Kinesio v1
- cupones asignados
- estado de uso
- ganancias
- dashboard con filtros
- Etapa 6: CRM + automatizaciones + reporting financiero
- Etapa 7: Hardening
- tests
- observabilidad
- seguridad
- performance
- Etapa 8: Staging + release controlado

## Matriz RBAC inicial (validada)
- ADMIN: acceso total a todos los módulos.
- KINESIOLOGO: acceso solo a información de clientes relacionados por uso de cupón propio/asignado.
- CLIENTE: acceso a su información y compras propias.
- COMPRADOR_INVITADO: puede comprar sin cuenta; seguimiento por email y datos de orden.

## Seguridad y accesibilidad (obligatorio)
- Seguridad:
- RBAC estricto server-side en cada endpoint y acción.
- validación de input en server (schema validation)
- auditoría de eventos críticos (cupones, pagos, liquidaciones, roles)
- protección CSRF/XSS/SQLi/SSRF según superficie
- rate limiting y controles anti-abuso en auth/cupones/checkout
- secretos fuera de código, rotación y mínimos privilegios
- Accesibilidad:
- cumplimiento WCAG 2.2 AA como baseline
- navegación por teclado completa
- focus visible consistente
- contraste suficiente
- labels, errores accionables y estados vacíos/carga/error
- semántica correcta y soporte de lectores de pantalla

## Pendientes de definición técnica
- Ninguno crítico para iniciar Etapa 1.

## Definiciones técnicas cerradas
- Paciente: entidad dedicada de dominio (no solo `enum` en `User`).
- Carrito:
- TTL de 2 horas desde última actividad.
- Si el cupón vence antes de confirmar pago, se invalida el descuento al revalidar checkout.
- Si el carrito expira, se libera reserva lógica y se obliga recalcular totales/promociones.
- Unificación invitado → cliente registrado:
- Al registrarse con el mismo email, se asocia historial de órdenes y eventos previos.
- Requiere flujo de verificación de email para evitar secuestro de historial.

## CRM v1 (definido)
- Pipeline comercial inicial:
- `NEW_LEAD`
- `CONTACTED`
- `QUALIFIED`
- `PROPOSAL_SENT`
- `WON`
- `LOST`
- Campos mínimos de lead:
- nombre
- email
- teléfono
- fuente (web, campaña, referido, manual)
- interés (producto/categoría)
- responsable interno
- estado pipeline
- notas
- fecha de alta
- última actividad
- Automatizaciones mínimas:
- recordatorio de seguimiento para leads sin actividad > 48h
- evento de carrito abandonado para buyer invitado o logueado
- campaña básica por segmento (estado pipeline + fuente)
- Trazabilidad:
- timeline de eventos por lead
- relación con órdenes cuando convierte a compra
