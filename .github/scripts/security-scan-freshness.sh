#!/usr/bin/env bash
# Returns 0 when the workflow has a successful run within max_stale_days.
# mode: any (schedule/dispatch/push/PR) or schedule (cron only).
set -euo pipefail

pick_latest_success_timestamp() {
  local json="$1"
  local pick_mode="$2"
  if [ "${pick_mode}" = "schedule" ]; then
    jq -r '[.workflow_runs[] | select(.event == "schedule") | .created_at] | max // empty' <<<"${json}"
  else
    jq -r '[.workflow_runs[] | select(.event == "schedule" or .event == "workflow_dispatch" or .event == "push" or .event == "pull_request") | .created_at] | max // empty' <<<"${json}"
  fi
}

assert_single_iso_timestamp() {
  local value="$1"
  local context="$2"
  if [ -z "${value}" ]; then
    return 0
  fi
  if printf '%s' "${value}" | grep -q $'\n'; then
    echo "::error::${context}: expected one timestamp, got multiple lines (pagination/jq bug)."
    printf '%s\n' "${value}" >&2
    exit 1
  fi
  if ! [[ "${value}" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
    echo "::error::${context}: invalid ISO8601 UTC timestamp: ${value}"
    exit 1
  fi
}

run_freshness_check() {
  local workflow_file="$1"
  local max_stale_days="$2"
  local mode="${3:-any}"
  local repo="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY required}"

  local workflow_id
  workflow_id="$(gh api "/repos/${repo}/actions/workflows/${workflow_file}" --jq '.id')"

  local label last_success runs_json
  if [ "${mode}" = "schedule" ]; then
    label="scheduled"
    runs_json="$(gh api "/repos/${repo}/actions/workflows/${workflow_id}/runs?status=success&event=schedule&per_page=1")"
    last_success="$(jq -r '.workflow_runs[0].created_at // empty' <<<"${runs_json}")"
  else
    label="any-trigger"
    last_success="$(gh api "/repos/${repo}/actions/workflows/${workflow_id}/runs?status=success&per_page=100" \
      --paginate --jq '.workflow_runs[] | select(.event == "schedule" or .event == "workflow_dispatch" or .event == "push" or .event == "pull_request") | .created_at' \
      | sort -r | head -n 1 || true)"
  fi

  assert_single_iso_timestamp "${last_success}" "${workflow_file} ${label}"

  if [ -z "${last_success}" ]; then
    echo "::error::No successful ${label} ${workflow_file} run found."
    return 1
  fi

  echo "Last successful ${label} ${workflow_file}: ${last_success}"
  local last_epoch now_epoch age_sec max_stale_sec age_days
  last_epoch="$(date -d "${last_success}" +%s)"
  now_epoch="$(date -u +%s)"
  age_sec=$(( now_epoch - last_epoch ))
  max_stale_sec=$(( max_stale_days * 86400 ))
  age_days=$(( age_sec / 86400 ))
  echo "Age: ${age_sec}s (~${age_days}d, max ${max_stale_sec}s / ${max_stale_days}d)"

  if [ "${age_sec}" -gt "${max_stale_sec}" ]; then
    echo "::error::${workflow_file} ${label} success is ${age_sec}s old (max ${max_stale_sec}s)."
    return 1
  fi

  echo "Freshness OK for ${workflow_file} (${label}, ${age_sec}s)"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  run_freshness_check "${1:?workflow yaml file name}" "${2:?max stale days}" "${3:-any}"
fi
