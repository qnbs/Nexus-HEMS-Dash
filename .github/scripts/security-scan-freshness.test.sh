#!/usr/bin/env bash
# Unit tests for security-scan-freshness.sh (#387). No live gh API calls.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=security-scan-freshness.sh
source "${ROOT}/security-scan-freshness.sh"

failures=0
assert_eq() {
  local got="$1"
  local want="$2"
  local name="$3"
  if [ "${got}" != "${want}" ]; then
    echo "FAIL ${name}: got '${got}' want '${want}'"
    failures=$((failures + 1))
  else
    echo "OK ${name}"
  fi
}

multi_page_json='{
  "workflow_runs": [
    {"event":"push","created_at":"2026-11-05T03:00:00Z"},
    {"event":"schedule","created_at":"2026-11-04T03:00:00Z"},
    {"event":"pull_request","created_at":"2026-11-03T03:00:00Z"}
  ]
}'
assert_eq "$(pick_latest_success_timestamp "${multi_page_json}" any)" "2026-11-05T03:00:00Z" "any-mode max timestamp"

schedule_json='{
  "workflow_runs": [
    {"event":"schedule","created_at":"2026-10-05T03:12:20Z"},
    {"event":"schedule","created_at":"2026-11-05T03:03:00Z"}
  ]
}'
assert_eq "$(pick_latest_success_timestamp "${schedule_json}" schedule)" "2026-11-05T03:03:00Z" "schedule-mode max"

empty_json='{"workflow_runs":[]}'
assert_eq "$(pick_latest_success_timestamp "${empty_json}" any)" "" "empty runs"

if ( assert_single_iso_timestamp $'2026-11-05T03:00:00Z\n2026-10-01T03:00:00Z' "test" ); then
  echo "FAIL multiline timestamp should exit non-zero"
  failures=$((failures + 1))
else
  echo "OK multiline timestamp rejected"
fi

if ( assert_single_iso_timestamp "2026-11-05T03:00:00Z" "valid-single" ); then
  echo "OK valid single timestamp accepted"
else
  echo "FAIL valid single timestamp rejected"
  failures=$((failures + 1))
fi

if [ "${failures}" -gt 0 ]; then
  echo "${failures} test(s) failed"
  exit 1
fi
echo "All security-scan-freshness unit tests passed."
