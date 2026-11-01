#!/bin/bash
# ================================================
# Dunkelmann Bot – Pterodactyl Startup Script
# Set this as your Pterodactyl startup command:
#   bash start.sh
# ================================================

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "██████╗ ██╗   ██╗███╗   ██╗██╗  ██╗███████╗██╗  ███╗   ███╗ █████╗ ███╗   ██╗███╗   ██╗"
echo "██╔══██╗██║   ██║████╗  ██║██║ ██╔╝██╔════╝██║  ████╗ ████║██╔══██╗████╗  ██║████╗  ██║"
echo "██║  ██║██║   ██║██╔██╗ ██║█████╔╝ █████╗  ██║  ██╔████╔██║███████║██╔██╗ ██║██╔██╗ ██║"
echo "██║  ██║██║   ██║██║╚██╗██║██╔═██╗ ██╔══╝  ██║  ██║╚██╔╝██║██╔══██║██║╚██╗██║██║╚██╗██║"
echo "██████╔╝╚██████╔╝██║ ╚████║██║  ██╗███████╗███████╗██║ ╚═╝ ██║██║  ██║██║ ╚████║██║ ╚████║"
echo "╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝"
echo ""
echo "  Dunkelmann"
echo "  Fejlesztők: Dunkelmann & aø."
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

bash "$SCRIPT_DIR/install.sh"

echo ""
echo "[START] Dunkelmann Bot & Web indítása..."
echo ""

export NODE_ENV="${NODE_ENV:-production}"
exec node "$SCRIPT_DIR/dist/index.js"

