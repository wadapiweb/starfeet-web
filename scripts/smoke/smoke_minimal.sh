#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_PREFIX="${API_PREFIX:-/api}"
API_EMAIL="${API_EMAIL:-}"
API_PASSWORD="${API_PASSWORD:-}"

echo "[SMOKE] BASE_URL=$BASE_URL API_PREFIX=$API_PREFIX"

FAIL=0

check() {
  local label="$1"
  local url="$2"
  local expected="${3:-200}"
  local HTTP_CODE
  HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)"
  if [[ "$HTTP_CODE" == "$expected" || "$HTTP_CODE" == "200" || "$HTTP_CODE" == "204" || "$HTTP_CODE" == "308" || "$HTTP_CODE" == "307" || "$HTTP_CODE" == "301" ]]; then
    echo "[OK] $label → $HTTP_CODE"
  else
    echo "[WARN] $label → $HTTP_CODE (esperado ~${expected})"
  fi
}

# ─── Health checks básicos ───────────────────────────────────────────────────

# Página principal de la app
check "homepage" "${BASE_URL}/"

# API ping (si existe)
check "api/ping" "${BASE_URL}${API_PREFIX}/ping"

# Auth: endpoint de sesión de next-auth (siempre presente)
check "auth/session" "${BASE_URL}/api/auth/session"

# ─── Auth con credenciales (opcional) ────────────────────────────────────────
if [[ -n "$API_EMAIL" && -n "$API_PASSWORD" ]]; then
  echo "[SMOKE] Probando login con $API_EMAIL..."
  HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' \
    -X POST "${BASE_URL}/api/auth/callback/credentials" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "email=${API_EMAIL}" \
    --data-urlencode "password=${API_PASSWORD}" \
    || true)"
  echo "[INFO] auth/callback/credentials → $HTTP_CODE"
fi

echo "[DONE] smoke minimal"
