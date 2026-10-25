#!/usr/bin/env bash
set -e

PORT="${FRONTEND_PORT:-3000}"
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║     DEVIN HEALTH CENTER            ║"
echo "  ║                                      ║"
echo "  ║  http://${IP}:${PORT}  ║"
echo "  ║  http://localhost:${PORT}             ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

docker compose up --build "$@"
