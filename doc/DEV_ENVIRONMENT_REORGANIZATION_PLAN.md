# DEV_ENVIRONMENT_REORGANIZATION_PLAN

Fecha: 2026-07-01

## 1. Objetivo

Ordenar el entorno de desarrollo de Starfeet en el VPS-DEV `72.60.141.77` para que quede claramente separado de staging y produccion.

Este plan NO cubre la implementacion de staging/prod. Staging y produccion se trabajaran despues en el VPS-PROD `76.13.121.160`.

## 2. Contexto actual

Repos en VPS-DEV:
- Core: `/opt/docker/starfeet-web`
- Landing VPS dev: `/opt/docker/starfeet-landing`

Servicios actuales:
- `starfeet-db`
- `starfeet-web`
- `starfeet-landing`

Estado actual detectado:
- `starfeet-web` corre en `NODE_ENV=development` con `npm run dev`.
- `starfeet-landing` corre en `NODE_ENV=development` con `npm run dev`.
- El router actual de Traefik para `starfeet-web` usa dominios sin prefijo dev:
  - `tienda.starfeet.ar`
  - `kine.starfeet.ar`
  - `dashboard.starfeet.ar`
- `dev1.starfeet.ar` ya apunta a `starfeet-landing` en VPS-DEV.
- `dev.starfeet.ar` vive en Hostinger Cloud y debe quedar informado de los dominios DEV para links/login/carrito.

DNS ya configurado por el usuario:
- `dev-dashboard.starfeet.ar` -> `72.60.141.77`
- `dev-tienda.starfeet.ar` -> `72.60.141.77`
- `dev-kine.starfeet.ar` -> `72.60.141.77`
- `dev1.starfeet.ar` -> `72.60.141.77`

DNS futuro, fuera de esta etapa:
- Staging/prod iran a VPS-PROD `76.13.121.160`.

## 3. Estado objetivo DEV

Dominios DEV:

| Dominio | Servicio | Modo | Ruta interna |
| --- | --- | --- | --- |
| `dev-dashboard.starfeet.ar` | `starfeet-web-dev` | `next dev` | `/admin` via `proxy.ts` |
| `dev-tienda.starfeet.ar` | `starfeet-web-dev` | `next dev` | `/tienda` via `proxy.ts` |
| `dev-kine.starfeet.ar` | `starfeet-web-dev` | `next dev` | `/kinesio` via `proxy.ts` |
| `dev1.starfeet.ar` | `starfeet-landing-dev` | `next dev` | landing local VPS |
| `dev.starfeet.ar` | Hostinger Cloud | cloud/staging landing | debe linkear a dominios DEV |

Nombres DEV recomendados:

| Recurso | Nombre |
| --- | --- |
| Contenedor DB | `starfeet-db-dev` |
| Contenedor Core | `starfeet-web-dev` |
| Contenedor Landing VPS | `starfeet-landing-dev` |
| DB Postgres | `starfeet_dev` |
| Usuario DB | `starfeet_dev_user` |
| Volumen Postgres | `starfeet_db_dev_data` |
| Red interna Docker | `starfeet-dev-internal` |
| Imagen DB | `postgres:16-alpine` |
| Imagen Node dev | `node:22-alpine` |

## 4. Principios de diseño

### Separacion por entorno

DEV no debe responder por dominios de produccion:
- NO `dashboard.starfeet.ar`
- NO `tienda.starfeet.ar`
- NO `kine.starfeet.ar`

DEV debe responder solo por:
- `dev-dashboard.starfeet.ar`
- `dev-tienda.starfeet.ar`
- `dev-kine.starfeet.ar`
- `dev1.starfeet.ar`

### Secretos nuevos

No se deben reutilizar credenciales actuales.

Generar nuevos valores para:
- `DB_PASSWORD`
- `AUTH_SECRET`
- `REVALIDATION_SECRET`
- `UPLOAD_SECRET` si sigue existiendo en variables de landing

Los secretos no deben documentarse en Markdown ni commitearse.

### Cookies por entorno

DEV debe usar namespace propio para no pisar staging/prod:

```txt
__Secure-dev.authjs.session-token
```

Requiere variable:

```env
AUTH_COOKIE_NAMESPACE=dev
```

Staging/prod se resolveran despues, pero la convencion propuesta es:

```txt
staging -> __Secure-staging.authjs.session-token
prod    -> __Secure-authjs.session-token
```

### Configuracion declarativa

El codigo debe leer dominios desde env:
- `NEXT_PUBLIC_URL_DASHBOARD`
- `NEXT_PUBLIC_URL_TIENDA`
- `NEXT_PUBLIC_URL_KINE`
- `NEXT_PUBLIC_URL_LANDING`
- `NEXT_PUBLIC_URL_MARKETING`

Evitar hardcodear dominios productivos dentro de componentes o servicios.

### SOLID aplicado a esta tarea

- Single Responsibility: Docker/Traefik, env, auth cookies, routing y home/cloud se tratan como responsabilidades separadas.
- Open/Closed: agregar staging/prod despues no debe requerir reescribir DEV; solo crear nuevos env/compose.
- Dependency Inversion: el codigo debe depender de variables/configuracion, no de dominios literales.
- Interface Segregation: helpers de dominios/auth no deben mezclar routing, cookies, DB y UI.

## 5. Variables DEV objetivo

### `/opt/docker/starfeet-web/.env`

Plantilla esperada, sin valores reales:

```env
APP_ENV=dev
NODE_ENV=development

DOMAIN=starfeet.ar
NEXT_PUBLIC_BASE_DOMAIN=.starfeet.ar
NEXT_PUBLIC_ROOT_DOMAIN=starfeet.ar

NEXT_PUBLIC_URL_TIENDA=https://dev-tienda.starfeet.ar
NEXT_PUBLIC_URL_KINE=https://dev-kine.starfeet.ar
NEXT_PUBLIC_URL_DASHBOARD=https://dev-dashboard.starfeet.ar
NEXT_PUBLIC_URL_LANDING=https://dev.starfeet.ar
NEXT_PUBLIC_URL_MARKETING=https://dev1.starfeet.ar/marketing-admin

MARKETING_URL=https://dev1.starfeet.ar/marketing-admin
LANDING_URL=https://dev.starfeet.ar

SUPPORT_EMAIL=soporte@starfeet.ar

DB_USER=starfeet_dev_user
DB_PASSWORD=<nuevo_password_fuerte>
DB_NAME=starfeet_dev
DATABASE_URL=postgresql://starfeet_dev_user:<nuevo_password_fuerte>@starfeet-db-dev:5432/starfeet_dev

AUTH_URL=https://dev-dashboard.starfeet.ar
AUTH_TRUST_HOST=true
AUTH_SECRET=<nuevo_auth_secret_fuerte>
AUTH_COOKIE_NAMESPACE=dev

AUTH_GOOGLE_ID=<google_oauth_client_id_dev_o_actual>
AUTH_GOOGLE_SECRET=<google_oauth_secret_dev_o_actual>

RESEND_API_KEY=<resend_key_dev>
EMAIL_FROM="Starfeet Dev <onboarding@resend.dev>"

DATABASE_URL_LANDING=<mysql_landing_dev_url>
```

Verificacion post-implementacion:

- `AUTH_COOKIE_NAMESPACE=dev` debe estar definido en `.env` y tambien propagado al servicio `starfeet-web-dev` en `docker-compose.yml`.
- Las cookies auxiliares de Auth.js en DEV deben verse como `__Host-dev.authjs.csrf-token` y `__Secure-dev.authjs.callback-url`.
- Luego de login exitoso, la cookie de sesion esperada es `__Secure-dev.authjs.session-token`.
- El endpoint `/api/auth/session` debe validarse con `GET`; `curl -I` envia `HEAD` y Auth.js responde `400 UnknownAction` por diseno.

### `/opt/docker/starfeet-landing/.env`

```env
APP_ENV=dev
NODE_ENV=development

DATABASE_URL=<mysql_landing_dev_url>

REVALIDATION_SECRET=<nuevo_revalidation_secret>
UPLOAD_SECRET=<nuevo_upload_secret_si_aplica>

NEXT_PUBLIC_BASE_DOMAIN=starfeet.ar
NEXT_PUBLIC_URL_TIENDA=https://dev-tienda.starfeet.ar
NEXT_PUBLIC_URL_KINE=https://dev-kine.starfeet.ar
NEXT_PUBLIC_URL_DASHBOARD=https://dev-dashboard.starfeet.ar
NEXT_PUBLIC_URL_LANDING=https://dev.starfeet.ar
NEXT_PUBLIC_URL_MARKETING=https://dev1.starfeet.ar/marketing-admin
```

## 6. Etapas de ejecucion

### Etapa 0 - Preparacion y backup

Checklist:
- [x] Confirmar que DNS `dev-*` resuelve a `72.60.141.77`.
- [x] Guardar copia local segura de `.env` actual de `starfeet-web`.
- [x] Guardar copia local segura de `.env` actual de `starfeet-landing`.
- [x] Exportar dump de la DB actual solo si hay datos dev utiles.
- [x] Registrar `docker compose ps`.
- [x] Confirmar que staging/prod todavia NO se tocaran.

Comandos sugeridos:

```bash
cd /opt/docker/starfeet-web
docker compose ps
docker compose exec -T starfeet-db pg_dump -U "$DB_USER" "$DB_NAME" > /root/starfeet_dev_backup_$(date +%Y%m%d_%H%M%S).sql
```

Nota: si se decide empezar limpio sin datos, el dump puede ser solo preventivo.

### Etapa 1 - Crear secretos nuevos DEV

Checklist:
- [x] Generar `DB_PASSWORD`.
- [x] Generar `AUTH_SECRET`.
- [x] Generar `REVALIDATION_SECRET`.
- [x] Generar `UPLOAD_SECRET` si el env lo conserva.
- [x] Guardarlos solo en `.env`/secret manager, nunca en docs.

Comandos sugeridos:

```bash
openssl rand -base64 48
openssl rand -hex 32
```

### Etapa 2 - Reescribir Docker Compose DEV

Cambios esperados:
- [x] `starfeet-db` -> `starfeet-db-dev`
- [x] `starfeet-web` -> `starfeet-web-dev`
- [x] `starfeet-landing` -> `starfeet-landing-dev`
- [x] `starfeet-internal` -> `starfeet-dev-internal`
- [x] `starfeet_db_data` -> `starfeet_db_dev_data`
- [x] Traefik core solo para `dev-dashboard`, `dev-tienda`, `dev-kine`.
- [x] Traefik landing para `dev1.starfeet.ar`.
- [x] `DATABASE_URL` apunta a `starfeet-db-dev`.

Regla Traefik esperada para core:

```txt
Host(`dev-tienda.starfeet.ar`) || Host(`dev-kine.starfeet.ar`) || Host(`dev-dashboard.starfeet.ar`)
```

### Etapa 3 - Actualizar env DEV

Checklist:
- [x] `.env` de `starfeet-web` actualizado con dominios `dev-*`.
- [x] `.env` de `starfeet-web` usa `AUTH_COOKIE_NAMESPACE=dev`.
- [x] `.env` de `starfeet-web` usa `DB_USER=starfeet_dev_user`.
- [x] `.env` de `starfeet-web` usa `DB_NAME=starfeet_dev`.
- [x] `.env` de `starfeet-landing` apunta a dominios `dev-*`.
- [x] No quedan URLs `dashboard.starfeet.ar`, `tienda.starfeet.ar`, `kine.starfeet.ar` en env DEV salvo comentarios historicos claramente marcados.

### Etapa 4 - Ajustar codigo para namespace de cookie

Checklist:
- [x] `auth.ts` lee `AUTH_COOKIE_NAMESPACE`.
- [x] En DEV, cookie efectiva esperada: `__Secure-dev.authjs.session-token`.
- [x] Logout publico borra tambien cookie namespaced.
- [x] Documentar convencion para staging/prod.

Implementacion esperada:
- Si `AUTH_COOKIE_NAMESPACE=dev`, cookie name base: `dev.authjs.session-token`.
- Si no hay namespace, cookie name base: `authjs.session-token`.
- Si `secure=true`, prefijo `__Secure-`.

### Etapa 5 - Routing y redirects DEV

Checklist:
- [x] `proxy.ts` reconoce `dev-dashboard.starfeet.ar`.
- [x] `proxy.ts` reconoce `dev-tienda.starfeet.ar`.
- [x] `proxy.ts` reconoce `dev-kine.starfeet.ar`.
- [x] `lib/role-redirect.ts` redirige por env a `NEXT_PUBLIC_URL_*`.
- [x] Navbar/login/carrito no redirigen a dominios sin prefijo dev.

### Etapa 6 - Home y landing al tanto

Este punto es obligatorio porque el usuario pidio que "la home este al tanto".

Checklist Hostinger Cloud `dev.starfeet.ar`:
- [x] Variables del deploy cloud apuntan a:
  - `https://dev-tienda.starfeet.ar`
  - `https://dev-dashboard.starfeet.ar`
  - `https://dev-kine.starfeet.ar`
  - `https://dev1.starfeet.ar/marketing-admin`
- [x] Navbar cloud abre login en `dev-dashboard.starfeet.ar/login`.
- [x] Compra rapida/carrito cloud apunta a `dev-tienda.starfeet.ar`.
- [x] Portal profesional cloud apunta a `dev-kine.starfeet.ar` o login dashboard segun rol.

Checklist VPS landing `dev1.starfeet.ar`:
- [x] `.env` local apunta a dominios DEV.
- [x] `marketing-admin` valida sesion contra `dev-tienda.starfeet.ar/api/public/session`.
- [x] Upload/revalidate siguen protegidos por sesion/rol.

### Etapa 7 - DB limpia y migraciones

Checklist:
- [x] Parar servicios viejos.
- [x] Levantar `starfeet-db-dev` con volumen nuevo.
- [x] Aplicar migraciones Prisma.
- [x] Ejecutar seed dev si corresponde.
- [x] Confirmar tablas nuevas de auth hardening:
  - `rate_limit_buckets`
  - `security_audit_events`
  - columnas `failedLoginAttempts`, `lockoutUntil`, `sessionVersion`

Comandos sugeridos:

```bash
docker compose up -d starfeet-db-dev
docker compose run --rm starfeet-web-dev npx prisma migrate deploy
docker compose run --rm starfeet-web-dev npx prisma db seed
```

### Etapa 8 - Levantar y validar DEV

Checklist:
- [x] `docker compose up -d`.
- [x] `docker compose ps` muestra:
  - `starfeet-db-dev`
  - `starfeet-web-dev`
  - `starfeet-landing-dev`
- [x] Certificados HTTPS emitidos por Traefik para dominios DEV.
- [x] `https://dev-dashboard.starfeet.ar/login` responde 200.
- [x] Login admin funciona.
- [x] Cookie usa namespace `dev`.
- [x] `https://dev-dashboard.starfeet.ar/` muestra admin si rol `ADMIN`.
- [x] `https://dev-tienda.starfeet.ar/` muestra tienda.
- [x] `https://dev-kine.starfeet.ar/` muestra portal o login segun sesion.
- [x] `https://dev1.starfeet.ar/` muestra landing local.
- [x] `dev.starfeet.ar` envia links a dominios DEV.

Comandos de smoke:

```bash
curl -k -I https://dev-dashboard.starfeet.ar/login
curl -k -I https://dev-tienda.starfeet.ar/
curl -k -I https://dev-kine.starfeet.ar/
curl -k -I https://dev1.starfeet.ar/
```

### Etapa 9 - Confirmar que VPS-DEV no sirve prod-like domains

Checklist:
- [x] `dashboard.starfeet.ar` no apunta a `72.60.141.77`.
- [x] `tienda.starfeet.ar` no apunta a `72.60.141.77`.
- [x] `kine.starfeet.ar` no apunta a `72.60.141.77`.
- [x] Traefik en VPS-DEV no tiene routers para esos dominios.

## 7. Criterios de aceptacion

DEV se considera ordenado cuando:
- Los contenedores y volumen tienen sufijo `-dev`.
- La DB limpia se llama `starfeet_dev`.
- El usuario DB se llama `starfeet_dev_user`.
- Los dominios de plataforma en VPS-DEV usan prefijo `dev-`.
- El VPS-DEV no sirve `dashboard`, `tienda` ni `kine` sin prefijo.
- Auth usa cookie namespaced `dev`.
- La landing local `dev1` y la home cloud `dev.starfeet.ar` apuntan a dominios DEV.
- Login funciona sin depender de dominios productivos.
- `npm run build` y/o `npx tsc --noEmit` pasan antes del cierre.
- Queda documentado cualquier cambio manual hecho fuera del repo.

## 8. Riesgos y mitigaciones

### Riesgo: perdida de datos dev actuales

Mitigacion:
- Dump preventivo antes de crear volumen nuevo.
- Aceptar que DEV puede ser recreable.

### Riesgo: cookies cruzadas entre DEV y PROD

Mitigacion:
- `AUTH_COOKIE_NAMESPACE=dev`.
- Borrar cookies viejas en navegador al validar.

### Riesgo: Home cloud no actualizada

Mitigacion:
- Revisar variables de Hostinger/GitHub Actions.
- Probar links desde `dev.starfeet.ar`.

### Riesgo: OAuth Google no acepta nuevos callback domains

Mitigacion:
- Agregar callbacks DEV en Google Cloud:
  - `https://dev-dashboard.starfeet.ar/api/auth/callback/google`

### Riesgo: Traefik conserva routers viejos

Mitigacion:
- Revisar labels activas con `docker inspect`.
- Reiniciar servicios despues de cambiar labels.

## 9. Continuidad si se retoma en otra sesion

Antes de hacer cualquier cambio, leer:
- `doc/DEV_ENVIRONMENT_REORGANIZATION_PLAN.md`
- `doc/PROJECT_CONTEXT.md`
- `doc/LANDING_WORKFLOW.md`
- `doc/AUTH_SECURITY_AUDIT.md`

Estado de la tarea:
- [x] Etapa 0 - Preparacion y backup
- [x] Etapa 1 - Crear secretos nuevos DEV
- [x] Etapa 2 - Reescribir Docker Compose DEV
- [x] Etapa 3 - Actualizar env DEV
- [x] Etapa 4 - Ajustar cookie namespace
- [x] Etapa 5 - Routing y redirects DEV
- [x] Etapa 6 - Home y landing al tanto
- [x] Etapa 7 - DB limpia y migraciones
- [x] Etapa 8 - Levantar y validar DEV
- [x] Etapa 9 - Confirmar que VPS-DEV no sirve prod-like domains

Ultima decision conocida:
- DEV vive en VPS `72.60.141.77`.
- Staging/prod viviran despues en VPS `76.13.121.160`.
- `dev.starfeet.ar` vive en Hostinger Cloud y debe apuntar sus links a DEV.
- `dev1.starfeet.ar` vive en VPS-DEV.

## 10. No hacer en esta etapa

- No configurar staging.
- No configurar produccion.
- No mover `starfeet.ar`.
- No reutilizar credenciales antiguas.
- No dejar `dashboard.starfeet.ar`, `tienda.starfeet.ar`, `kine.starfeet.ar` servidos desde VPS-DEV.
- No commitear `.env`.

## 11. Resultados y Directivas de Validación de Reorganización (2026-07-01)

Se realizaron pruebas de humo y validaciones de login real:
- **Login de Administrador**: Probado exitosamente vía browser subagent. El flujo de autenticación con `admin@starfeet.ar` y la redirección post-login funcionan correctamente.
- **Namespaced Cookies**: Confirmado el uso de cookies namespaced, protegiendo el entorno dev de cualquier interferencia de sesión con producción/staging. Las cookies esperadas en DEV son:
  - `__Host-dev.authjs.csrf-token`
  - `__Secure-dev.authjs.callback-url`
  - `__Secure-dev.authjs.session-token`
- **Ruta de Salud**: Creado `/api/health` para validar el estado del servidor y la conexión a PostgreSQL de manera rápida, implementando mejores prácticas de seguridad (los errores de base de datos solo se loguean en el servidor vía `console.error` y no se exponen al cliente).
- **Warmup Confiable**: Configurado `dev-with-warmup.sh` para compilar `/api/health`, `/login`, `/api/auth/session`, `/api/public/session`, `/post-login`, `/admin`, `/tienda`, y `/kinesio` al iniciar el contenedor, mitigando la lentitud inicial provocada por la compilación on-demand de Next.js.

### Directivas de Arquitectura y Seguridad para Entornos

1. **Modo de Ejecución en DEV**:
   - El entorno de desarrollo corre con `NODE_ENV=development`.
   - La lentitud inicial en este entorno es un comportamiento esperado y nativo de Next.js debido a la **compilación bajo demanda (*on-demand compilation*)**.
   - El script de **warmup** no elimina este comportamiento; simplemente desplaza la sobrecarga de la compilación inicial al arranque del contenedor.
2. **Construcción en Producción y Staging**:
   - En entornos de Staging y Producción, la aplicación **debe compilarse de manera estática y ejecutarse en modo optimizado** (`npm run build` y luego `npm run start`). Está estrictamente prohibido usar el modo de desarrollo (`next dev`) en dichos ambientes.
3. **Credenciales y Datos Sembrados (Seed)**:
   - La cuenta semilla `admin@starfeet.ar` con contraseña `123456` es de uso exclusivamente temporal para pruebas locales y en el entorno DEV.
   - **Queda estrictamente prohibido sembrar o utilizar estas credenciales en entornos de Staging o Producción**. Cada entorno superior debe contar con sus propias credenciales robustas y generadas aleatoriamente.

