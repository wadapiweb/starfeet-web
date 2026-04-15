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
