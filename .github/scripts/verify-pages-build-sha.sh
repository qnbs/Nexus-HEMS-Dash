#!/usr/bin/env bash
# Verify the live GitHub Pages bundle embeds the expected VITE_BUILD_SHA (FUP-SMOKE-01).
set -euo pipefail

page_url="${1:?page URL required}"
expected_sha="${2:?expected full git sha required}"
short_sha="${expected_sha:0:12}"

html="$(curl -fsSL "${page_url}")"
script_src="$(printf '%s' "${html}" | grep -Eo 'src="[^"]+/assets/[^"]+\.js"' | head -1 | sed 's/src="//;s/"$//')"
if [ -z "${script_src}" ]; then
  echo "::error::Could not locate main JS bundle in Pages HTML"
  exit 1
fi

if [[ "${script_src}" == ./* ]]; then
  bundle_url="${page_url%/}/${script_src#./}"
else
  bundle_url="${script_src}"
fi

bundle="$(curl -fsSL "${bundle_url}")"
if printf '%s' "${bundle}" | grep -q "${short_sha}"; then
  echo "Pages bundle contains expected build SHA prefix ${short_sha}"
  exit 0
fi

if printf '%s' "${bundle}" | grep -q "${expected_sha}"; then
  echo "Pages bundle contains expected full build SHA"
  exit 0
fi

echo "::error::Pages JS at ${bundle_url} does not contain expected SHA ${short_sha}"
exit 1
