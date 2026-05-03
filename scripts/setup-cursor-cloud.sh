#!/usr/bin/env bash
set -euo pipefail

PNPM_VERSION="${PNPM_VERSION:-10.33.0}"
NODE_MAJOR="${NODE_MAJOR:-24}"
PLAYWRIGHT_BROWSERS="${PLAYWRIGHT_BROWSERS:-chromium firefox}"

log() {
  printf '\n==> %s\n' "$*"
}

has_command() {
  command -v "$1" >/dev/null 2>&1
}

require_root_for_apt() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "This setup needs root privileges to install system packages." >&2
    exit 1
  fi
}

install_system_packages() {
  require_root_for_apt
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y ca-certificates curl gnupg python3 python3-pip
}

install_node_if_needed() {
  local current_major=""
  if has_command node; then
    current_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
  fi

  if [ "$current_major" = "$NODE_MAJOR" ]; then
    log "Node $(node --version) already installed"
    return
  fi

  log "Installing Node ${NODE_MAJOR}.x via NodeSource"
  install_system_packages
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
}

install_pnpm() {
  log "Activating pnpm ${PNPM_VERSION} with Corepack"
  corepack enable
  corepack prepare "pnpm@${PNPM_VERSION}" --activate
}

install_workspace_dependencies() {
  log "Installing workspace dependencies"
  pnpm install --frozen-lockfile
}

install_playwright() {
  log "Installing Playwright browsers and system dependencies: ${PLAYWRIGHT_BROWSERS}"
  pnpm --filter @nexus-hems/web exec playwright install --with-deps ${PLAYWRIGHT_BROWSERS}
}

install_graphify() {
  log "Installing graphify CLI from graphifyy"
  python3 -m pip install --user --upgrade graphifyy

  local user_bin="${HOME}/.local/bin"
  if [ -d "$user_bin" ]; then
    export PATH="${PATH}:${user_bin}"
  fi

  if [ "$(id -u)" -eq 0 ]; then
    printf 'export PATH="$PATH:%s"\n' "$user_bin" >/etc/profile.d/nexus-hems-cloud-agent.sh
  fi

  local bashrc="${HOME}/.bashrc"
  local marker="# Nexus-HEMS Cursor Cloud PATH"
  touch "$bashrc"
  local bashrc_contents=""
  bashrc_contents="$(<"$bashrc")"
  case "$bashrc_contents" in
    *"$marker"*) return ;;
  esac

  if [ -f "$bashrc" ]; then
    {
      printf '\n%s\n' "$marker"
      printf 'export PATH="$PATH:%s"\n' "$user_bin"
    } >>"$bashrc"
  fi
}

print_versions() {
  log "Installed tool versions"
  node --version
  pnpm --version
  python3 --version
  graphify --help >/dev/null
  echo "graphify CLI available"
}

main() {
  install_node_if_needed
  install_pnpm
  install_workspace_dependencies
  install_playwright
  install_graphify
  print_versions
}

main "$@"
