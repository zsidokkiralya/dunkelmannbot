#!/bin/bash
# ================================================
# Dunkelmann Bot – Pterodactyl Auto-Installer
# Runs automatically before every startup.
# ================================================

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  Dunkelmann – Dependency Installer"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"

# ── Helper: check if npm is available ──────────
if ! command -v npm &> /dev/null; then
  echo "[ERROR] npm not found! Please install Node.js."
  exit 1
fi

NODE_VER=$(node --version 2>/dev/null || echo "unknown")
echo "[INFO] Node.js: $NODE_VER"
echo "[INFO] npm: $(npm --version)"
echo ""

# The root manifest owns the dependencies of both services. Types are needed
# during the build, even when the hosting panel sets NODE_ENV=production.
echo "[1/2] Installing dependencies..."
if [[ -f package-lock.json ]]; then
  npm ci --include=dev --no-audit --no-fund
else
  npm install --include=dev --no-audit --no-fund
fi
echo "[2/2] Building application..."
npm run build

echo "============================================"
echo "  All dependencies OK. Ready to start."
echo "============================================"
