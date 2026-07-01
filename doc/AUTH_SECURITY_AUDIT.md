# AUTH_SECURITY_AUDIT

Fecha: 2026-07-01

Alcance revisado:
- `starfeet-web`: Auth.js/NextAuth, login, registro, recuperacion, invitado, RBAC, APIs core y proxy.
- `starfeet-landing`: `marketing-admin`, APIs de marketing, upload, traduccion y revalidacion.

## Resumen ejecutivo

El core de `starfeet-web` tiene una base razonable: Auth.js v5, bcrypt, cookies `httpOnly`, RBAC server-side en la mayoria de APIs, helper central de autorizacion, auditoria estructurada en logs y rate limit inicial. Para un nivel enterprise todavia faltan controles importantes: rate limiting distribuido, lockout persistente real, MFA para roles privilegiados, verificacion de email, invalidacion de sesiones ante cambios criticos, auditoria persistente y politicas anti-CSRF/Origin en APIs propias.

El riesgo mas alto no esta en el login core sino en la integracion con `starfeet-landing`: las APIs de marketing que escriben en MySQL permiten mutaciones sin autorizacion server-side, y el upload usa un secreto expuesto al cliente/fallback hardcodeado. En el estado actual, la UI verifica sesion, pero los endpoints no confian en un guard server-side equivalente.

## Estado de implementacion

Aplicado el 2026-07-01:
- Mutaciones de `/api/marketing/*`, `/api/marketing/upload`, `/api/translate` y `/api/revalidate` protegidas server-side con sesion del core y rol `ADMIN/MARKETING`.
- Eliminado el uso de `NEXT_PUBLIC_UPLOAD_SECRET` desde `marketing-admin`.
- Eliminados fallbacks hardcodeados de revalidacion en runtime.
- Quitados logs de cookies/sesion en `/api/public/session`.
- CORS de `/api/public/session` y `/api/public/logout` corregido con parseo real de hostname.
- `callbackUrl` de `/post-login` validado contra dominios del ecosistema o rutas relativas.
- `.env*` ignorado en `starfeet-landing` preservando `.env.example`.
- Rate limit persistente para auth/codigos usando Postgres como storage compartido.
- Lockout persistente por cuenta con `failedLoginAttempts`, `lockoutUntil` y reset en login exitoso.
- Revocacion de sesiones por `sessionVersion` en reset/cambio de password y desactivacion/reactivacion.
- Auditoria persistente en `security_audit_events` para login, registro, reset e invitado.
- Warmup de desarrollo corregido: `scripts/ops/dev-with-warmup.sh` ya no depende de `curl`, usa `node fetch`.
- `LoginForm` ya no fuerza `router.refresh()` despues del `router.push`, evitando una navegacion duplicada post-login.
- Refactor SOLID del auth core:
  - `auth-policy.ts`: constantes de politica de seguridad.
  - `credentials-auth.service.ts`: orquestacion del login por credenciales.
  - `oauth-auth.service.ts`: sign-in OAuth y linking operativo.
  - `account-lockout.service.ts`: bloqueo/reset de intentos.
  - `auth-rate-limit.service.ts`: rate limit por caso de uso.
  - `auth-audit.service.ts`: auditoria unificada en logs + DB.
  - `session-version.service.ts`: validacion/revocacion de sesion JWT.

Pendiente para hardening enterprise:
- Rotar secretos reales en Hostinger/VPS si se usaron los valores antiguos.
- MFA obligatorio para `ADMIN/MARKETING`.
- Dashboard de seguridad para consultar `security_audit_events`.

## Fortalezas actuales

- Auth centralizado en `auth.ts` con Auth.js v5 y Prisma Adapter.
- Sesion JWT con rol y estado refrescados desde DB en callback `jwt`.
- Cookie de sesion `httpOnly`, `sameSite=lax`, `secure` segun entorno y dominio wildcard para subdominios.
- Login por credenciales con bcrypt y rechazo de usuarios inactivos.
- Registro con normalizacion de email, hash de password y linking para usuarios OAuth sin password.
- Recuperacion e invitado usan codigos temporales hasheados, expiracion y consumo.
- `requireRole` y `requireSessionUser` existen como control server-side reusable.
- La mayoria de APIs `/api/v1/admin`, `/api/v1/kinesio` y `/api/v1/cliente` invocan guardas server-side.
- Layouts de `admin` y `kinesio` validan rol antes de renderizar.
- Auditoria de eventos de auth en logs con email enmascarado.

## Hallazgos criticos

### C1. APIs de marketing sin autorizacion server-side

Archivos:
- `/opt/docker/starfeet-landing/app/api/marketing/texts/route.ts`
- `/opt/docker/starfeet-landing/app/api/marketing/testimonials/route.ts`
- `/opt/docker/starfeet-landing/app/api/marketing/testimonials/[id]/route.ts`

Problema:
- `POST /api/marketing/texts` permite upsert de textos sin verificar sesion ni rol.
- `POST /api/marketing/testimonials` permite crear testimonios sin verificar sesion ni rol.
- `PUT/DELETE /api/marketing/testimonials/[id]` permite editar/borrar sin verificar sesion ni rol.
- El panel `marketing-admin` valida sesion en cliente llamando a `/api/public/session`, pero eso no protege los endpoints contra llamadas directas.

Impacto:
- Defacement de la landing.
- Manipulacion de testimonios/contenido publico.
- Persistencia de contenido malicioso o fraudulento en MySQL.

Propuesta senior:
- Crear un guard server-side en `starfeet-landing` para validar sesion contra el core o, preferentemente, mover estas mutaciones al core (`starfeet-web`) y dejar la landing como consumidor.
- Exigir rol `ADMIN` o `MARKETING` en cada metodo mutante.
- Mantener `GET` publico solo para datos realmente publicos y separar `GET admin` de `GET public` si hay campos internos.
- Agregar auditoria persistente para cambios de marketing: usuario, rol, accion, recurso, diff minimo, IP y user-agent.

### C2. Upload de marketing usa secreto expuesto al cliente y fallback hardcodeado

Archivos:
- `/opt/docker/starfeet-landing/app/marketing-admin/page.tsx`
- `/opt/docker/starfeet-landing/app/api/marketing/upload/route.ts`

Problema:
- El cliente usa `process.env.NEXT_PUBLIC_UPLOAD_SECRET` y un fallback hardcodeado.
- El endpoint usa `process.env.UPLOAD_SECRET` y el mismo fallback.
- Un secreto `NEXT_PUBLIC_*` no es secreto: queda disponible para el navegador.
- Si falta la variable real, queda activo un secreto predecible.

Impacto:
- Upload no autorizado de archivos al sitio.
- Posible consumo de disco.
- Publicacion de archivos no deseados bajo `/uploads`.

Propuesta senior:
- Eliminar secretos publicos para upload.
- Proteger upload con sesion server-side y rol `ADMIN/MARKETING`.
- Eliminar fallbacks hardcodeados en secretos.
- Validar tipo MIME real, extension, tamano maximo, dimensiones para imagenes, duracion para video y rechazar contenido ejecutable.
- Guardar en object storage con URLs firmadas o pipeline server-side, no en filesystem local si Hostinger/Node puede perder estado o mezclar despliegues.

### C3. Endpoint publico de sesion registra cookies y sesion completa en logs

Archivo:
- `/opt/docker/starfeet-web/app/api/public/session/route.ts`

Problema:
- Hace `console.log` del header `cookie`.
- Hace `console.log` del objeto `session`.

Impacto:
- Exposicion de tokens/sesion en logs de aplicacion, proveedor o contenedor.
- Riesgo alto si logs se centralizan o se comparten para soporte.

Propuesta senior:
- Eliminar logs de cookies y sesion.
- Si se necesita observabilidad, loguear solo metadata no sensible: `hasSession`, `role`, `userId` hasheado, origin, requestId.

### C4. Validacion CORS/Origin por sufijo inseguro

Archivos:
- `/opt/docker/starfeet-web/app/api/public/session/route.ts`
- `/opt/docker/starfeet-web/app/api/public/logout/route.ts`

Problema:
- Usa `origin.endsWith(cleanBase)`.
- Un origen como `https://evilstarfeet.ar` termina en `starfeet.ar` y podria pasar la condicion.
- `OPTIONS` refleja `Access-Control-Allow-Origin` para cualquier origen.

Impacto:
- Exposicion cross-origin de endpoints con credenciales en escenarios maliciosos o mal configurados.

Propuesta senior:
- Parsear `new URL(origin).hostname`.
- Permitir solo `hostname === cleanBase` o `hostname.endsWith("." + cleanBase)`.
- Exigir `https:` fuera de localhost.
- Centralizar `isAllowedOrigin(origin)` y reutilizarlo.

## Hallazgos altos

### A1. Rate limit en memoria, no enterprise

Archivos:
- `/opt/docker/starfeet-web/lib/security/rate-limit.ts`
- `/opt/docker/starfeet-web/proxy.ts`
- rutas de registro, recuperacion e invitado.

Problema:
- El store vive en `globalThis` del proceso Node.
- Se pierde al reiniciar.
- No coordina multiples replicas/contenedores.
- No protege bien contra distribucion por IP o rotacion de proceso.

Propuesta senior:
- Migrar a Redis/Upstash/Dragonfly con sliding window o token bucket.
- Rate limits separados por IP, email normalizado, par IP+email y ASN/pais si se agrega WAF.
- Incluir backoff progresivo.
- Emitir metricas y alertas por bloqueo.

### A2. Lockout persistente documentado pero no implementado en schema actual

Archivos:
- `/opt/docker/starfeet-web/auth.ts`
- `/opt/docker/starfeet-web/prisma/schema.prisma`
- `doc/SESSION_CONTEXT.md` menciona `lockoutUntil` y `failedLoginAttempts`.

Problema:
- La documentacion dice que existen `lockoutUntil` y `failedLoginAttempts`.
- El `schema.prisma` actual de `User` no contiene esos campos.
- `auth.ts` no incrementa intentos fallidos ni consulta `lockoutUntil`.

Propuesta senior:
- Agregar campos: `failedLoginAttempts`, `lockoutUntil`, `lastFailedLoginAt`, `lastLoginAt`.
- Al fallar password: incrementar contador en transaccion.
- Al superar umbral: lockout temporal progresivo.
- Al login exitoso: resetear contador y guardar `lastLoginAt`.
- Mantener rate limit por IP ademas del lockout por cuenta.

### A3. Sin invalidacion de sesiones tras reset/cambio de password o desactivacion

Archivos:
- `/opt/docker/starfeet-web/app/api/auth/reset-password/route.ts`
- `/opt/docker/starfeet-web/app/api/v1/admin/profile/route.ts`
- `/opt/docker/starfeet-web/app/api/v1/kinesio/profile/route.ts`
- `/opt/docker/starfeet-web/app/api/v1/admin/kinesios/[id]/route.ts`

Problema:
- Reset/cambio de password actualiza hash, pero no fuerza cierre de sesiones previas.
- Desactivar usuario cambia `isActive`, y el JWT refresca estado en cada callback, pero no hay versionado de sesion ni revocacion explicita.

Propuesta senior:
- Agregar `sessionVersion` o `tokenVersion` en `User`.
- Incluirlo en JWT y comparar contra DB.
- Incrementarlo en reset/cambio de password, cambio de rol, desactivacion/reactivacion y eventos de riesgo.
- Para roles privilegiados, cerrar todas las sesiones excepto la actual cuando cambian credenciales.

### A4. Sin MFA para roles privilegiados

Problema:
- `ADMIN`, `MARKETING` y eventualmente `KINESIOLOGO` acceden con password/Google sin segundo factor.

Propuesta senior:
- MFA obligatorio para `ADMIN` y `MARKETING`.
- TOTP/WebAuthn como opcion principal; codigos de recuperacion hasheados.
- Politica step-up: pedir MFA para acciones sensibles aunque la sesion exista.
- Guardar `mfaEnabledAt`, `mfaEnforcedAt`, `lastMfaAt`.

### A5. Linking automatico de Google por email con `allowDangerousEmailAccountLinking`

Archivo:
- `/opt/docker/starfeet-web/auth.ts`

Problema:
- Esta habilitado `allowDangerousEmailAccountLinking: true`.
- Puede ser aceptable solo si se confia totalmente en el proveedor y en `email_verified`.

Propuesta senior:
- Verificar explicitamente que Google entregue email verificado antes de linkear.
- Registrar evento de linking en auditoria persistente.
- Para roles privilegiados, requerir reautenticacion/MFA antes de vincular proveedores.

## Hallazgos medios

### M1. Registro y recuperacion no verifican formalmente email

Problema:
- El registro por credenciales activa al usuario directamente.
- `emailVerified` existe en schema pero no aparece como requisito.

Propuesta:
- Flujo de verificacion de email antes de habilitar acciones sensibles.
- Para compras se puede permitir checkout, pero limitar panel/cambios de datos hasta verificar.

### M2. Password policy minima insuficiente

Problema:
- La politica visible se centra en longitud minima.
- No hay control contra passwords comunes/comprometidas ni historial.

Propuesta:
- Minimo 12 caracteres para admins y marketing.
- Bloquear passwords comunes con zxcvbn o lista local.
- Opcional: Have I Been Pwned k-anonymity.
- Historial de hashes para impedir reuse en roles privilegiados.

### M3. Codigos de recuperacion/invitado sin contador persistente por codigo

Problema:
- Hay rate limit por IP+email, pero no contador persistente en `AccessCode`.
- Reinicios o replicas debilitan el control.

Propuesta:
- Agregar `attemptCount`, `maxAttempts`, `lastAttemptAt`.
- Consumir o invalidar codigo al superar intentos.
- Invalidar codigos anteriores al emitir uno nuevo para el mismo email/tipo.

### M4. `post-login` permite redirect directo para `CLIENTE`

Archivo:
- `/opt/docker/starfeet-web/app/post-login/page.tsx`

Problema:
- Si un `CLIENTE` visita `/post-login?callbackUrl=https://externo`, se redirige directamente.
- Auth.js valida redirects en su callback, pero esta pagina server-side hace su propia redireccion.

Propuesta:
- Reutilizar allowlist de dominios del ecosistema.
- Permitir solo rutas relativas o subdominios aprobados.

### M5. Falta anti-CSRF/Origin check en APIs propias mutantes

Problema:
- Auth.js protege sus rutas, pero las APIs custom con cookies no tienen una politica uniforme de Origin/CSRF.

Propuesta:
- Para `POST/PATCH/PUT/DELETE`, validar `Origin`/`Host`.
- Opcional: double-submit CSRF token para backoffice.
- Mantener `sameSite=lax`, pero no depender solo de eso.

## Propuesta de arquitectura senior

### 1. Fuente unica de autenticacion y autorizacion

- `starfeet-web` debe ser el authority de identidad, sesiones, roles y permisos.
- `starfeet-landing` no deberia implementar autorizacion propia con secretos publicos.
- Las mutaciones de marketing deberian vivir en el core o llamar a un endpoint core que valide `ADMIN/MARKETING`.

### 2. Politica RBAC + permisos finos

- Mantener roles actuales: `ADMIN`, `MARKETING`, `KINESIOLOGO`, `CLIENTE`.
- Agregar permisos por capacidad para acciones sensibles:
  - `marketing.content.write`
  - `marketing.media.upload`
  - `admin.users.write`
  - `admin.security.write`
  - `finance.read`
- No codificar autorizacion solo por ruta; centralizar policy en `lib/authz`.

### 3. Sesiones revocables

- Agregar `sessionVersion` a `User`.
- JWT incluye `sessionVersion`, `role`, `isActive`.
- En cada callback se compara contra DB.
- Incrementar version ante password reset, cambio de password, cambio de rol, desactivacion, MFA reset o sospecha.

### 4. Rate limiting distribuido y lockout persistente

- Redis como backend de rate limit.
- Lockout por cuenta persistente en DB.
- Backoff progresivo y alertas por ataques.
- WAF/Traefik con reglas basicas para `/api/auth/*`, `/api/marketing/*`, upload y checkout.

### 5. MFA y step-up

- MFA obligatorio para `ADMIN` y `MARKETING`.
- Step-up para:
  - crear/editar usuarios
  - resetear passwords de terceros
  - cambiar roles
  - tocar settings de seguridad
  - subir media publica
  - borrar testimonios/contenido

### 6. Auditoria persistente

Tabla `SecurityAuditEvent`:
- `id`, `createdAt`, `actorUserId`, `actorRole`, `action`, `resourceType`, `resourceId`
- `ip`, `userAgent`, `requestId`
- `outcome`, `reason`
- `metadata` JSON con datos no sensibles

Eventos minimos:
- login success/fail/rate limit/lockout
- password reset request/success/fail
- MFA enabled/disabled/challenge failed
- role change/user deactivate/password admin reset
- marketing content create/update/delete/upload

### 7. Secret management

- No usar secretos hardcodeados.
- No usar secretos `NEXT_PUBLIC_*`.
- `.env` solo local, no versionado.
- `.env.example` sin usuarios reales, hosts internos o passwords sugeridas reales.
- Rotacion inmediata si un secreto fue expuesto en cliente, logs o repo.

## Plan priorizado

### P0 - Bloqueantes antes de exponer marketing admin

1. Proteger server-side `POST/PUT/DELETE` de `/api/marketing/*` con rol `ADMIN/MARKETING`.
2. Reemplazar upload con auth server-side; eliminar `NEXT_PUBLIC_UPLOAD_SECRET` y fallback.
3. Eliminar logs de cookies/sesion en `/api/public/session`.
4. Corregir allowlist CORS/Origin con parseo real de hostname.
5. Eliminar fallbacks hardcodeados de `UPLOAD_SECRET` y `REVALIDATION_SECRET`.

### P1 - Hardening core de auth

1. Implementar `failedLoginAttempts`, `lockoutUntil`, `lastFailedLoginAt`, `lastLoginAt`.
2. Migrar rate limiting a Redis.
3. Agregar `sessionVersion` y revocacion ante cambios criticos.
4. Validar `callbackUrl` en `/post-login`.
5. Agregar Origin check comun para APIs mutantes.

### P2 - Enterprise controls

1. MFA obligatorio para `ADMIN/MARKETING`.
2. Auditoria persistente con dashboard de seguridad.
3. Verificacion formal de email.
4. Politica de password fuerte y bloqueo de passwords comunes.
5. Alertas operativas y runbook de incidente.

## Criterio de aceptacion

- Un usuario anonimo no puede mutar textos, testimonios ni subir archivos en la landing.
- Un usuario autenticado sin rol `ADMIN/MARKETING` tampoco puede hacerlo.
- No hay cookies ni objetos de sesion completos en logs.
- Ningun secreto requerido tiene fallback hardcodeado.
- Rate limits sobreviven reinicios y funcionan entre replicas.
- Reset/cambio de password invalida sesiones antiguas.
- Admin/Marketing requiere MFA.
- Todo evento sensible queda auditado de forma persistente.
