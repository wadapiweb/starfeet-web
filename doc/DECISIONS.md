# DECISIONS

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
