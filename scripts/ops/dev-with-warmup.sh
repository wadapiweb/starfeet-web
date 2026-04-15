#!/bin/sh
set -eu

NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1024}" npx next dev --webpack &
NEXT_PID=$!

cleanup() {
  if kill -0 "$NEXT_PID" >/dev/null 2>&1; then
    kill "$NEXT_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

for i in $(seq 1 120); do
  if curl -fsS "http://127.0.0.1:3000/login" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Pre-compila rutas de auth para evitar timeout en primer request detrás de proxy.
curl -fsS "http://127.0.0.1:3000/login" >/dev/null 2>&1 || true
curl -fsS "http://127.0.0.1:3000/api/auth/session" >/dev/null 2>&1 || true

wait "$NEXT_PID"
