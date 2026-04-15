#!/usr/bin/env bash
set -euo pipefail

AGENTS_FILE="AGENTS.md"
STATE="$(grep -E '^`BOOTSTRAP_' "$AGENTS_FILE" | tr -d '`' || true)"

if [[ "$STATE" != "BOOTSTRAP_PENDING" ]]; then
  echo "[INFO] Bootstrap ya aplicado o estado no pendiente."
  exit 0
fi

if [[ ! -f doc/PROJECT_BOOTSTRAP_REPORT.md ]]; then
  echo "[ERROR] Falta doc/PROJECT_BOOTSTRAP_REPORT.md"
  exit 1
fi

# Cambiar estado
sed -i 's/`BOOTSTRAP_PENDING`/`BOOTSTRAP_DONE`/' "$AGENTS_FILE"

# Eliminar bloque one-shot entre marcadores
sed -i '/<!-- BOOTSTRAP_ONCE_START -->/,/<!-- BOOTSTRAP_ONCE_END -->/d' "$AGENTS_FILE"

echo "[OK] Bootstrap one-shot aplicado: estado actualizado y bloque eliminado."
