# DECISIONS

## 2026-05-13 — Segregación de responsabilidades en componentes Organism (Hero y Manifesto)

### Decisión
Extraer la sección de scrollytelling a pantalla completa contenida dentro del componente `Hero` hacia un nuevo organismo independiente llamado `Manifesto`.

### Motivo
- **Diseño Atómico:** Un organismo debe representar un módulo funcional cohesivo con responsabilidad única.
- **Mantenibilidad:** La lógica compleja de monitoreo de scroll global (`useScroll`) y animaciones en cascada contaminaban al componente Hero principal.
- **Semántica HTML:** Representan dos secciones de contenido completamente diferenciadas para la experiencia del usuario final.

### Consecuencia
- El componente `Hero` queda estrictamente acotado al primer viewport (impacto inicial, CTA e imagen principal).
- El componente `Manifesto` encapsula de manera aislada y tipada su propia lógica de revelado con Framer Motion, respetando de forma formal las *Rules of Hooks* en el renderizado de caracteres.
- Se habilita la reutilización independiente de la sección Manifesto en otras páginas (ej. `nosotros` / `tecnologia`) sin acoplamiento.

## 2026-04-21 — Settings admin como fuente real de configuración

### Decisión
Implementar `/admin/settings` como editor por tabs con persistencia en `SystemSetting` y defaults codificados para fallback seguro.

### Motivo
- El panel anterior era estático y no controlaba reglas de negocio.
- Se necesitaba una superficie operativa para configurar carrito, stock, cupones, seguridad y pasarelas sin tocar código.

### Consecuencia
- Las reglas reales de negocio ahora leen configuración persistida cuando corresponde.
- El frontend server-side puede caer a defaults si la base no responde durante build o prerender.
- Los cambios en settings deben validarse en DB y documentarse junto al deploy.

## 2026-04-15 — Estrategia de branches Git (dev / staging / prod)

### Decisión
Tres ramas estables con flujo lineal:
```
dev → staging → prod
```
- `dev`: Desarrollo activo. Corre en este VPS (DEV-Starfeet-WEB-Dev) con `npm run dev` (hot reload, source maps, error overlay).
- `staging`: Pre-producción. Misma imagen que prod pero con datos de prueba.
- `prod`: Producción real. Solo recibe merges desde staging con gates verdes.

### Motivo
- Aislar cambios en desarrollo del código estable.
- Gate obligatorio en `staging` antes de tocar `prod`.
- Permite smoke tests reales en staging sin riesgo.

### Consecuencia
- Todo trabajo nuevo se hace en `dev` (o en feature branches cortadas desde `dev`).
- No se hace push directo a `staging` ni `prod` — solo via PR/merge.
- El servidor actual (DEV-Starfeet-WEB-Dev) siempre apunta a la rama `dev`.

---

## 2026-04-15 — Docker Compose en modo dev

### Decisión
El `docker-compose.yml` existente usa `npm run dev` (Next.js dev server) y monta el código fuente como volumen (`.:/app`). Se mantiene esta configuración para la rama `dev`.

### Motivo
- Hot reload sin rebuild de imagen en cada cambio.
- `NODE_ENV` controlado por `.env` en el servidor.

### Consecuencia
- Para staging/prod se necesitará un `docker-compose.prod.yml` separado con `npm run build && npm run start`.
- El `.env` de este servidor debe tener `NODE_ENV=development`.

---

## 2026-04-15 — Separación de design systems por dominio

### Decisión
Trabajar con design systems separados por contexto de uso:
`home`, `ecommerce`, `admin`, `kinesio`, con una base mínima de tokens compartidos.

### Motivo
- Cada dominio tiene objetivos UX distintos:
- Home: branding/storytelling.
- E-commerce: conversión y compra.
- Admin: productividad operativa.
- Kinesio: trazabilidad de cupones/pacientes y lectura de métricas.

### Consecuencia
- Se evitará forzar un único sistema visual para contextos incompatibles.
- La arquitectura de componentes será atomizada y versionable por dominio.
- Queda pendiente definir governance de tokens compartidos y criterios de reutilización cruzada.

---

## 2026-04-15 — Modelado de “paciente” (recomendación técnica)

### Decisión
No usar solamente un `enum` para modelar paciente como estado de usuario. Se recomienda entidad dedicada de relación clínica/comercial (`PatientProfile` o equivalente) vinculada a ordenes y cupones.

### Motivo
- Un `enum` en `User` no cubre bien compradores invitados.
- Un usuario puede cambiar de comportamiento en el tiempo (cliente regular, paciente por cupón, comprador sin cupón).
- Se necesita trazabilidad fina para dashboard kinesio, ganancias y auditoría.
- Permite historial consistente sin sobrecargar la entidad `User`.

### Consecuencia
- Mantener `User` para identidad/autenticación.
- Crear entidad de dominio para paciente/relación con kinesiólogo-cupón-orden.
- Soportar visitantes por email sin forzar registro previo.

---

## 2026-04-15 — Política de carrito y vigencia de cupón

### Decisión
- TTL del carrito: 2 horas desde la última actividad.
- Revalidación obligatoria de cupón en checkout/pago.

### Motivo
- Evitar inconsistencias de precio y abuso por carritos inactivos.
- Alinear vigencia de descuento con reglas de negocio.

### Consecuencia
- Si el carrito expira: recalcular totales, promociones y disponibilidad.
- Si el cupón vence antes de confirmar pago: no aplica descuento.

---

## 2026-04-15 — Unificación de comprador invitado a cliente registrado

### Decisión
Al registrarse con el mismo email, se unifica historial de compras/eventos del invitado con la nueva cuenta.

### Motivo
- Mantener continuidad de experiencia del cliente.
- Evitar pérdida de trazabilidad comercial.

### Consecuencia
- Requiere validación/confirmación de email antes de consolidar historial.
- Los dashboards deben contemplar eventos pre y post registro.

---

## 2026-04-15 — Alcance CRM v1

### Decisión
CRM v1 con pipeline simple, campos mínimos de lead, timeline de actividad y automatizaciones básicas.

### Motivo
- Obtener capacidad operativa comercial temprana sin sobrediseño.
- Permitir reporting inicial y campañas segmentadas desde fase temprana.

### Consecuencia
- Pipeline inicial: `NEW_LEAD`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `WON`, `LOST`.
- Automatizaciones iniciales: follow-up >48h sin actividad y carrito abandonado.

---

## 2026-04-15 — Compatibilidad Prisma 7 en tooling local

### Decisión
Agregar `prisma.config.ts` y remover `url` del bloque `datasource` en `schema.prisma`.

### Motivo
- El entorno actual usa Prisma CLI 7.x, que requiere configurar datasource en `prisma.config.ts`.
- Sin este ajuste, `npx prisma validate` falla y rompe quality gates locales.

### Consecuencia
- `prisma validate` vuelve a funcionar.
- La URL de conexión queda centralizada en `prisma.config.ts` usando `DATABASE_URL`.

---

## 2026-04-15 — Build sin DB obligatoria en Home

### Decisión
La home maneja fallback de catálogo vacío si la base no está disponible durante build/prerender.

### Motivo
- Evitar que `next build` falle en entornos de CI o stage sin conectividad directa a DB.
- Mantener pipeline de calidad estable mientras se define estrategia de datos para prerender.

### Consecuencia
- El build no se bloquea por indisponibilidad temporal de base de datos.
- Queda pendiente definir estrategia final (ISR, cache o fetch desacoplado) para producción.

---

## 2026-04-15 — Modo dev estable en contenedor (`--webpack`)

### Decisión
Ejecutar `next dev --webpack` en el script `dev` para entorno Docker de desarrollo.

### Motivo
- Se observaron fallos recurrentes de Turbopack en volumen persistido de `.next` dentro del contenedor.
- El síntoma operativo fue “sitio no visible” por crash de runtime del servidor dev.

### Consecuencia
- Mayor estabilidad de desarrollo local en VPS/contenedor.
- Se mantiene deuda técnica de revisar retorno a Turbopack cuando el bug esté resuelto.

---

## 2026-04-15 — Comisión en cupones con múltiples kinesiólogos

### Decisión
En checkout, cuando un cupón tiene múltiples kinesiólogos asignados, la comisión total del cupón se reparte en partes iguales entre los kinesiólogos asignados.

### Motivo
- El cupón puede tener múltiples profesionales.
- Se requiere trazabilidad de comisión desde el primer MVP sin bloquear la operación.

### Consecuencia
- Se crean múltiples `CommissionEntry` por orden (una por kinesiólogo asignado).
- Queda pendiente una estrategia de atribución más sofisticada (ej. código/ref de profesional específico) en etapas futuras.

---

## 2026-04-15 — Trazabilidad de paciente en checkout

### Decisión
Cada checkout realiza upsert de `PatientProfile`, vincula la orden al paciente y crea links `PatientKinesioLink` cuando hay cupón con asignaciones.

### Motivo
- Necesidad de dashboards kinesio con detalle real de pacientes y órdenes.
- Necesidad de exportables y reporting de liquidación con evidencia de relación paciente-profesional.

### Consecuencia
- Las órdenes quedan relacionadas a paciente incluso en flujo invitado.
- Se habilita detalle por paciente en portal Kinesio sin depender de registro obligatorio previo.

---

## 2026-04-15 — Unificación Google + credenciales por email

### Decisión
Permitir linking automático de cuenta OAuth Google con cuenta existente por el mismo email (`allowDangerousEmailAccountLinking: true`) y completar integración desde registro cuando existe usuario Google sin password.

### Motivo
- Experiencia de usuario consistente evitando cuentas duplicadas.
- Requisito funcional: mismo email debe operar como una sola identidad.
- Google entrega email verificado, reduciendo riesgo en linking por email.

### Consecuencia
- Un usuario puede entrar con Google o con email/contraseña sobre la misma cuenta.
- Se exige reforzar en próximos bloques: rate limiting, auditoría y monitoreo de intentos de auth.

---

## 2026-04-15 — Acceso de invitado por código temporal

### Decisión
Implementar acceso de invitado con código temporal por email y sesión efímera en cookie firmada HTTP-only para consultar compras sin registro.

### Motivo
- Requisito de negocio: comprador invitado debe poder revisar sus órdenes.
- Evitar exposición de órdenes por email sin verificación.

### Consecuencia
- Nuevo modelo `AccessCode` reutilizable por tipo (`PASSWORD_RESET`, `GUEST_ACCESS`).
- Flujo en dos pasos: solicitud de código + verificación + consulta de órdenes.

---

## 2026-04-15 — Hardening Auth v1 con rate limiting y auditoría estructurada

### Decisión
Aplicar rate limiting server-side en login de credenciales y flujos de códigos (recupero/invitado), junto con auditoría estructurada de eventos de seguridad en servidor.

### Motivo
- Reducir superficie de brute-force y abuso de endpoints de verificación.
- Tener trazabilidad inicial para investigación operativa de incidentes.

### Consecuencia

---

## 2026-04-15 — Política de eliminación segura en admin (fallback a desactivación)

### Decisión
En `productos` y `cupones`, intentar eliminación física y, ante restricciones relacionales, aplicar fallback automático a desactivación lógica (`isActive=false`). En `profesionales`, usar desactivación lógica por defecto.

### Motivo
- Preservar integridad histórica de ventas/comisiones cuando existen relaciones activas.
- Mantener UX operativa de “eliminar” sin romper trazabilidad ni generar errores duros en runtime.

### Consecuencia
- Las acciones de eliminar en admin siempre responden con éxito operativo (eliminado o desactivado).
- El frontend informa explícitamente el resultado para transparencia operativa.
- Se limita por ventana temporal en memoria de proceso (válido para instancia única actual).
- En siguiente etapa se migrará a almacenamiento distribuido para escalado horizontal.

---

## 2026-04-15 — Habilitación explícita de `allowedDevOrigins` para entorno dev

### Decisión
Configurar `allowedDevOrigins` en `next.config.ts` incluyendo `dev.starfeet.ar` y orígenes locales para compatibilidad con controles CSRF/cross-site de Next 16 en desarrollo.

### Motivo
- Evitar bloqueos por chequeos cross-origin en recursos `/_next/*` bajo dominio de desarrollo.
- Reducir falsos positivos operativos durante pruebas de login/sesión.

### Consecuencia
- La configuración de dev queda explícita y versionada.
- Persiste análisis pendiente de algunos requests `no-cors` bloqueados de origen no controlado.

---

## 2026-04-15 — Warmup automático de rutas auth en `npm run dev`

### Decisión
Cambiar el arranque dev a un script shell que levanta Next y pre-calienta rutas críticas (`/login`, `/api/auth/session`) para reducir timeout inicial detrás de proxy.

### Motivo
- El primer acceso en frío provocaba compilación pesada y podían aparecer errores de gateway percibidos por usuario.
- Necesidad de mantener flujo de login estable en ambiente de desarrollo.

### Consecuencia
- `npm run dev` ahora ejecuta `scripts/ops/dev-with-warmup.sh`.
- El script se mantiene POSIX (`sh`) para compatibilidad con imagen `node:alpine`.

---

## 2026-04-15 — Backoffice Shell reusable para Admin y Kinesio

### Decisión
Crear un shell de backoffice reutilizable con `Sidebar + Header propio + Session Card + Logout`, parametrizable por dominio vía configuración de navegación.

### Motivo
- Evitar layouts duplicados y acoplamiento por página.
- Escalar módulos admin/kinesio con consistencia visual y de arquitectura.

### Consecuencia
- Admin y Kinesio comparten infraestructura de layout, diferenciándose por `navItems` y metadata.
- Próximo paso: convertir ítems de navegación en subrutas reales para aprovechar totalmente el shell.

---

## 2026-04-15 — Guardas de rol en layouts por dominio

### Decisión
Mover la autorización de `admin` y `kinesio` desde páginas sueltas hacia `layout.tsx` de cada dominio, encapsulando seguridad y shell de navegación en un único punto.

### Motivo
- Elimina duplicación de checks de sesión/rol.
- Permite escalar subrutas sin repetir lógica de autorización y layout.

### Consecuencia
- Todas las subrutas de cada dominio heredan automáticamente guardas y estructura visual.
- Se simplifica la creación de nuevos módulos en cada panel.

---

## 2026-04-15 — Backoffice con layout inmersivo (sidebar full-height + header operativo)

### Decisión
Adoptar para `admin` y `kinesio` un layout inmersivo de plataforma: sidebar fijo izquierda a altura completa y header operativo sticky con herramientas de productividad (search, notifications, session).

### Motivo
- Alinear experiencia con estándares de SaaS/backoffice escalable.
- Mejorar velocidad de navegación y foco operativo en tareas frecuentes.

### Consecuencia
- Las rutas de plataforma quedan desacopladas de la navbar pública del sitio.
- Se habilita evolución modular de utilidades globales de backoffice (buscador unificado, notificaciones, quick actions).

---

## 2026-04-15 — Slugs canónicos para URLs de dominio

### Decisión
Incorporar campo `slug` único en entidades core (`User`, `Product`, `Coupon`, `PatientProfile`, `Order`) y comenzar migración de rutas a slug con fallback temporal por `id`.

### Motivo
- Evitar URLs opacas basadas en IDs técnicos.
- Mejorar legibilidad, trazabilidad funcional y SEO en superficies públicas.
- Permitir enlaces estables entre panel admin, ecommerce y futuras integraciones.

### Consecuencia
- Las altas nuevas generan slug automáticamente.
- Se requiere `backfill` de datos históricos y sincronización de esquema por entorno (`prisma db push` en el estado actual sin migraciones versionadas).
- Durante transición, algunas rutas aceptan `slug` e `id` para compatibilidad retroactiva.

---

## 2026-04-21 — Panel financiero orientado a caja + comisiones + liquidaciones

### Decisión
El panel `/admin/finance` deja de depender sólo de `commission_entries` y pasa a consolidar caja real, pipeline abierto, comisiones, cupones y liquidaciones en un mismo dashboard.

### Motivo
- La base real del negocio vive en varias tablas: `orders`, `commission_entries`, `coupon_redemptions`, `coupon_assignments` y `payout_periods`.
- Un panel sólo de comisiones devuelve ceros cuando todavía no hubo redenciones, aunque ya existan órdenes cobradas.
- Finanzas necesita responder dos preguntas distintas: qué entra a caja y qué queda por liquidar.

### Consecuencia
- La vista financiera puede mostrar datos reales aun sin comisiones registradas.
- Se habilita una lectura operativa más útil para admin y prepara el terreno para liquidación formal por período.
- La siguiente iteración debería sumar filtros por rango de fechas y exportación.

## 2026-04-22 — Entorno kinesio funcional con preferencias por usuario

### Decisión
Convertir `kinesio` en un entorno operable real:
- `dashboard`, `coupons`, `patients`, `commissions`, `payouts`, `profile`, `settings` y `help` dejan de ser placeholders
- `profile` y `settings` exponen APIs propias con persistencia por usuario
- las preferencias de kinesio se guardan en `SystemSetting` bajo una key por usuario

### Motivo
- El workspace kinesio necesita ser útil de punta a punta, no sólo mostrar KPIs.
- El profesional requiere editar sus datos, ajustar su vista y consultar negocio real sin depender del admin.
- Reutilizar `SystemSetting` evita introducir una tabla nueva sólo para preferencias operativas.

### Consecuencia
- Se centraliza la UX de kinesio en componentes reutilizables y datos reales.
- El panel puede evolucionar con auto refresh, densidad visual y filtros persistentes por usuario.
- Queda abierta una futura migración a una tabla de preferencias dedicada si la granularidad por usuario crece.
