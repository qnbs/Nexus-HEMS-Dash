#!/usr/bin/env bash
# Returns 0 when the workflow has a successful run within max_stale_days.
# mode: any (schedule/dispatch/push/PR) or schedule (cron only).
set -euo pipefail

workflow_file="${1:?workflow yaml file name}"
max_stale_days="${2:?max stale days}"
mode="${3:-any}"
repo="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY required}"

workflow_id="$(gh api "/repos/${repo}/actions/workflows/${workflow_file}" --jq '.id')"

if [ "${mode}" = "schedule" ]; then
  event_filter='.event=="schedule"'
  label="scheduled"
else
  event_filter='.event=="schedule" or .event=="workflow_dispatch" or .event=="push" or .event=="pull_request"'
  label="any-trigger"
fi

last_success="$(gh api "/repos/${repo}/actions/workflows/${workflow_id}/runs?status=success&per_page=80" \
  --jq "[.workflow_runs[] | select(${event_filter})][0].created_at // empty")"

if [ -z "${last_success}" ]; then
  echo "::error::No successful ${label} ${workflow_file} run found."
  exit 1
fi

echo "Last successful ${label} ${workflow_file}: ${last_success}"
last_epoch="$(date -d "${last_success}" +%s)"
now_epoch="$(date -u +%s)"
age_days=$(( (now_epoch - last_epoch) / 86400 ))
echo "Age (days): ${age_days}"

if [ "${age_days}" -gt "${max_stale_days}" ]; then
  echo "::error::${workflow_file} ${label} success is ${age_days} days old (max ${max_stale_days})."
  exit 1
fi

echo "Freshness OK for ${workflow_file} (${label}, ${age_days}d)"
