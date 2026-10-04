#!/usr/bin/env bash
# Dev server helper. The project's Linux-native Node lives outside the
# default WSL PATH (only Windows' node/npm are on it by default), so a
# plain `astro dev stop` in a fresh terminal fails with "command not
# found". This script sets PATH correctly before delegating to astro.
#
# Usage:
#   ./run_preview.sh          # start the dev server in the background
#   ./run_preview.sh stop     # stop it
#   ./run_preview.sh status   # check if it's running
#   ./run_preview.sh logs     # tail dev server logs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_BIN="$HOME/.local/opt/node-v22.23.3-linux-x64/bin"

if [ ! -d "$NODE_BIN" ]; then
  echo "error: Linux-native Node not found at $NODE_BIN" >&2
  echo "       (re-run the setup that downloaded node-v22.23.3-linux-x64 into ~/.local/opt)" >&2
  exit 1
fi

export PATH="$NODE_BIN:$SCRIPT_DIR/node_modules/.bin:$PATH"
cd "$SCRIPT_DIR"

case "${1:-start}" in
  start)
    astro dev --background
    ;;
  stop)
    astro dev stop
    ;;
  status)
    astro dev status
    ;;
  logs)
    astro dev logs
    ;;
  *)
    echo "usage: $0 [start|stop|status|logs]" >&2
    exit 1
    ;;
esac
