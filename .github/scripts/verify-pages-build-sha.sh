#!/usr/bin/env bash
# Verify live GitHub Pages publishes the expected build-info.json manifest (FUP-SMOKE-01).
set -euo pipefail

page_url="${1:?page URL required}"
expected_sha="${2:?expected full git sha required}"

if ! [[ "${expected_sha}" =~ ^[0-9a-fA-F]{40}$ ]]; then
  echo "::error::EXPECTED_SHA must be a full 40-character git commit SHA"
  exit 1
fi

manifest_url="${page_url%/}/build-info.json"
echo "Fetching build manifest: ${manifest_url}"

http_code="$(curl -sS -o /tmp/nexus-pages-build-info.json -w '%{http_code}' \
  -H 'Accept: application/json' \
  "${manifest_url}")"

if [ "${http_code}" != "200" ]; then
  echo "::error::build-info.json returned HTTP ${http_code} (expected 200)"
  exit 1
fi

content_type="$(curl -sSI "${manifest_url}" | awk -F': ' 'tolower($1)=="content-type"{print tolower($2); exit}' | tr -d '\r')"
if [ -n "${content_type}" ] && [[ "${content_type}" != *"application/json"* ]] && [[ "${content_type}" != *"text/plain"* ]]; then
  echo "::warning::Unexpected Content-Type for build-info.json: ${content_type}"
fi

manifest_git_sha="$(python3 - <<'PY'
import json
from pathlib import Path
data = json.loads(Path("/tmp/nexus-pages-build-info.json").read_text(encoding="utf-8"))
sha = data.get("gitSha")
if not isinstance(sha, str) or not sha.strip():
    raise SystemExit("missing gitSha")
print(sha.strip())
PY
)"

expected_lower="$(printf '%s' "${expected_sha}" | tr '[:upper:]' '[:lower:]')"
manifest_lower="$(printf '%s' "${manifest_git_sha}" | tr '[:upper:]' '[:lower:]')"

if [ "${manifest_lower}" = "${expected_lower}" ]; then
  echo "Pages build-info.json gitSha matches expected commit"
  exit 0
fi

# Prefix match (manifest may store short SHA)
if [ "${#manifest_lower}" -ge 12 ] && [[ "${expected_lower}" == "${manifest_lower}"* ]]; then
  echo "Pages build-info.json gitSha prefix matches expected commit"
  exit 0
fi

if [ "${#expected_lower}" -ge 12 ] && [ "${manifest_lower}" = "${expected_lower:0:12}" ]; then
  echo "Pages build-info.json short gitSha matches expected commit prefix"
  exit 0
fi

echo "::error::build-info.json gitSha '${manifest_git_sha}' does not match expected ${expected_sha}"
exit 1
