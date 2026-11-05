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

FIXTURES="${ROOT}/fixtures"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "${tmp_dir}"' EXIT

run_with_mock_gh() {
  local scenario="$1"
  shift
  GITHUB_REPOSITORY="qnbs/Nexus-HEMS-Dash" \
    MOCK_FRESHNESS_SCENARIO="${scenario}" \
    PATH="${FIXTURES}:${PATH}" \
    run_freshness_check "$@"
}

if run_with_mock_gh schedule-fresh sbom-scan.yml 2 schedule >"${tmp_dir}/freshness-schedule.out" 2>&1; then
  echo "OK run_freshness_check schedule mode accepts fresh run"
else
  echo "FAIL run_freshness_check schedule mode fresh run"
  cat "${tmp_dir}/freshness-schedule.out"
  failures=$((failures + 1))
fi

if run_with_mock_gh any-fresh sbom-scan.yml 8 any >"${tmp_dir}/freshness-any.out" 2>&1; then
  echo "OK run_freshness_check any mode picks latest paginated timestamp"
else
  echo "FAIL run_freshness_check any mode fresh run"
  cat "${tmp_dir}/freshness-any.out"
  failures=$((failures + 1))
fi

if run_with_mock_gh schedule-stale sbom-scan.yml 2 schedule >"${tmp_dir}/freshness-stale.out" 2>&1; then
  echo "FAIL run_freshness_check should reject stale schedule run"
  cat "${tmp_dir}/freshness-stale.out"
  failures=$((failures + 1))
else
  echo "OK run_freshness_check schedule mode rejects stale run"
fi

if [ "${failures}" -gt 0 ]; then
  echo "${failures} test(s) failed"
  exit 1
fi
echo "All security-scan-freshness unit tests passed."
