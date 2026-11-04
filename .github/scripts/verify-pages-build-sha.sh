#!/usr/bin/env bash
# Verify live GitHub Pages publishes the expected build-info.json manifest (FUP-SMOKE-01).
set -euo pipefail

page_url="${1:?page URL required}"
expected_sha="${2:?expected full git sha required}"
max_attempts="${3:-6}"
retry_sleep_sec="${4:-20}"

if ! [[ "${expected_sha}" =~ ^[0-9a-fA-F]{40}$ ]]; then
  echo "::error::EXPECTED_SHA must be a full 40-character git commit SHA"
  exit 1
fi

manifest_url="${page_url%/}/build-info.json"
expected_lower="$(printf '%s' "${expected_sha}" | tr '[:upper:]' '[:lower:]')"

sha_matches_manifest() {
  local manifest_lower="$1"
  if [ "${manifest_lower}" = "${expected_lower}" ]; then
    return 0
  fi
  if [ "${#manifest_lower}" -ge 12 ] && [ "${#manifest_lower}" -lt 40 ]; then
    if [[ "${expected_lower}" == "${manifest_lower}"* ]]; then
      return 0
    fi
  fi
  if [ "${#manifest_lower}" -eq 40 ] && [ "${manifest_lower}" != "${expected_lower}" ]; then
    return 1
  fi
  return 1
}

for attempt in $(seq 1 "${max_attempts}"); do
  echo "Attempt ${attempt}/${max_attempts}: ${manifest_url}"

  http_code="$(curl -sS -o /tmp/nexus-pages-build-info.json -w '%{http_code}' \
    -H 'Accept: application/json' \
    "${manifest_url}")"

  if [ "${http_code}" != "200" ]; then
    echo "build-info.json HTTP ${http_code} (retrying)"
    sleep "${retry_sleep_sec}"
    continue
  fi

  if ! manifest_git_sha="$(python3 - <<'PY'
import json
from pathlib import Path
data = json.loads(Path("/tmp/nexus-pages-build-info.json").read_text(encoding="utf-8"))
sha = data.get("gitSha")
if not isinstance(sha, str) or not sha.strip():
    raise SystemExit("missing gitSha")
print(sha.strip())
PY
  )"; then
    echo "Invalid build-info.json (retrying)"
    sleep "${retry_sleep_sec}"
    continue
  fi

  manifest_lower="$(printf '%s' "${manifest_git_sha}" | tr '[:upper:]' '[:lower:]')"
  if sha_matches_manifest "${manifest_lower}"; then
    echo "Pages build-info.json gitSha matches expected commit (${manifest_git_sha})"
    exit 0
  fi

  echo "Mismatch: manifest gitSha=${manifest_git_sha} expected=${expected_sha} (retrying)"
  sleep "${retry_sleep_sec}"
done

echo "::error::build-info.json did not match expected ${expected_sha} after ${max_attempts} attempts"
exit 1
