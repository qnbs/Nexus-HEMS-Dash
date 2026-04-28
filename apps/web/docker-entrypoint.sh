#!/bin/sh
# MED-03: Validate WS_ORIGINS before nginx starts.
# WS_ORIGINS is injected into the nginx CSP connect-src header via envsubst.
# A malformed value would produce an invalid CSP header — potentially opening
# an XSS vector or silently breaking all WebSocket connectivity.
#
# Pattern: one or more space-separated wss?:// origins, each consisting of
# alphanumeric characters, dots, hyphens, underscores, colons, and brackets
# (for IPv6). No semicolons, quotes, or shell metacharacters permitted.
set -eu

WS_ORIGINS="${WS_ORIGINS:-}"

if [ -n "$WS_ORIGINS" ]; then
  # Validate every token in the space-separated list
  for origin in $WS_ORIGINS; do
    case "$origin" in
      ws://*|wss://*)
        # Strip scheme and check the remainder for safe characters only
        host="${origin#ws://}"
        host="${host#wss://}"
        case "$host" in
          *[!A-Za-z0-9._:\[\]-]*)
            echo "[entrypoint] ERROR: WS_ORIGINS contains invalid characters in: $origin" >&2
            echo "[entrypoint] Only alphanumeric, dots, hyphens, underscores, colons, and brackets are allowed." >&2
            exit 1
            ;;
        esac
        ;;
      *)
        echo "[entrypoint] ERROR: WS_ORIGINS entry does not start with ws:// or wss://: $origin" >&2
        exit 1
        ;;
    esac
  done
fi

# Hand off to the nginx-unprivileged base image entrypoint, which runs
# envsubst on /etc/nginx/templates/*.template before starting nginx.
exec /docker-entrypoint.sh "$@"
