#!/bin/sh
set -eu

NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1536}" npx next dev --webpack &
NEXT_PID=$!

cleanup() {
  if kill -0 "$NEXT_PID" >/dev/null 2>&1; then
    kill "$NEXT_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

warm() {
  node -e "fetch(process.argv[1]).then((r) => process.exit(r.ok || r.status < 500 ? 0 : 1)).catch(() => process.exit(1))" "$1" >/dev/null 2>&1
}

for i in $(seq 1 120); do
  if warm "http://127.0.0.1:3000/login"; then
    break
  fi
  sleep 1
done

# El warmup no elimina la compilación dinámica de Next.js en modo DEV (next dev);
# en su lugar, desplaza el tiempo de compilación inicial de las páginas/API al arranque
# del contenedor. Esto evita timeouts y demoras cuando el usuario final interactúa por primera vez.
# Nota: Los fallos de warmup no detienen el contenedor gracias a los operadores "|| true".

# 1. Validamos disponibilidad inicial contra /api/health antes de proceder con el resto
warm "http://127.0.0.1:3000/api/health" || true

# 2. Pre-compilación de rutas críticas (autenticación, vistas principales)
warm "http://127.0.0.1:3000/login" || true
warm "http://127.0.0.1:3000/api/auth/session" || true
warm "http://127.0.0.1:3000/api/public/session" || true
warm "http://127.0.0.1:3000/post-login" || true
warm "http://127.0.0.1:3000/admin" || true
warm "http://127.0.0.1:3000/tienda" || true
warm "http://127.0.0.1:3000/kinesio" || true

wait "$NEXT_PID"
