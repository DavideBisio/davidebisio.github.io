#!/usr/bin/env bash
# One-time setup: installs a Linux-native Node.js and puts it on PATH.
#
# Why: in this WSL environment, the `node`/`npm` on the default PATH are the
# Windows binaries (under /mnt/c/...). Windows npm can't build/install native
# modules against a project that lives on the Linux filesystem (UNC path
# errors), so a Linux-native Node is needed for `npm install`, `astro dev`,
# etc. to work from a WSL terminal.
#
# This script downloads Node into ~/.local/opt (no sudo required) and adds
# it to PATH by appending an export line to ~/.bashrc, guarded so re-running
# this script is safe.
#
# Usage: ./setup.sh

set -euo pipefail

NODE_VERSION="v22.23.3"
INSTALL_DIR="$HOME/.local/opt"
NODE_DIR="$INSTALL_DIR/node-${NODE_VERSION}-linux-x64"
NODE_BIN="$NODE_DIR/bin"
MARKER="# added by setup.sh (davidebisio.github.io): Linux-native Node for WSL"

if [ "$(uname -s)" != "Linux" ] || [ "$(uname -m)" != "x86_64" ]; then
  echo "error: this script targets Linux x86_64 (WSL). Detected: $(uname -s) $(uname -m)" >&2
  exit 1
fi

mkdir -p "$INSTALL_DIR"

if [ -x "$NODE_BIN/node" ]; then
  echo "Node ${NODE_VERSION} already installed at $NODE_DIR"
else
  echo "Downloading Node ${NODE_VERSION}..."
  TMP_TAR="$(mktemp -t node-XXXXXX.tar.xz)"
  trap 'rm -f "$TMP_TAR"' EXIT
  curl -sLo "$TMP_TAR" "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.xz"
  tar xf "$TMP_TAR" -C "$INSTALL_DIR"
  rm -f "$TMP_TAR"
  trap - EXIT
  echo "Installed to $NODE_DIR"
fi

export PATH="$NODE_BIN:$PATH"
node --version
npm --version

BASHRC="$HOME/.bashrc"
if [ -f "$BASHRC" ] && grep -qF "$MARKER" "$BASHRC"; then
  echo "PATH already configured in $BASHRC"
else
  {
    echo ""
    echo "$MARKER"
    echo "export PATH=\"$NODE_BIN:\$PATH\""
  } >> "$BASHRC"
  echo "Added Node to PATH in $BASHRC"
fi

echo ""
echo "Done. Open a new terminal (or run: source ~/.bashrc) for PATH changes to apply."
echo "Then: cd $(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd) && npm install"
