#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
FAIL=0

run_step() {
  local name="$1"
  shift
  echo "[GATE] $name"
  if "$@"; then
    echo "[OK] $name"
  else
    echo "[FAIL] $name"
    FAIL=1
  fi
}

# ─── starfeet-web: monolítico Next.js en root ───────────────────────────────
# No hay separación frontend/ ni backend/ — todo corre desde el root del proyecto

if [[ -f package.json ]]; then
  run_step "lint" bash -lc "npm run lint"
  run_step "build" bash -lc "npm run build"
fi

# ─── Prisma: validar schema ──────────────────────────────────────────────────
if [[ -f prisma/schema.prisma ]]; then
  run_step "prisma validate" bash -lc "npx prisma validate"
fi

# ─── Smoke ───────────────────────────────────────────────────────────────────
if [[ -x scripts/smoke/smoke_minimal.sh ]]; then
  run_step "smoke minimal" bash -lc "scripts/smoke/smoke_minimal.sh"
else
  echo "[WARN] scripts/smoke/smoke_minimal.sh no existe o no es ejecutable"
fi

# ─── Resultado final ─────────────────────────────────────────────────────────
if [[ "$FAIL" -ne 0 ]]; then
  echo "[RESULT] GATE FAILED"
  exit 1
fi

echo "[RESULT] GATE PASSED"
