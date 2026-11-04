#!/usr/bin/env bash
# Returns 0 when the workflow has a successful run within MAX_STALE_DAYS
# from schedule, workflow_dispatch, push, or pull_request (post–Actions re-enable).
set -euo pipefail

workflow_file="${1:?workflow yaml file name}"
max_stale_days="${2:?max stale days}"
repo="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY required}"

workflow_id="$(gh api "/repos/${repo}/actions/workflows/${workflow_file}" --jq '.id')"
last_success="$(gh api "/repos/${repo}/actions/workflows/${workflow_id}/runs?status=success&per_page=50" \
  --jq '[.workflow_runs[] | select(.event=="schedule" or .event=="workflow_dispatch" or .event=="push" or .event=="pull_request")][0].created_at // empty')"

if [ -z "${last_success}" ]; then
  echo "::error::No successful ${workflow_file} run found (schedule/dispatch/push/PR)."
  exit 1
fi

echo "Last successful ${workflow_file}: ${last_success}"
last_epoch="$(date -d "${last_success}" +%s)"
now_epoch="$(date -u +%s)"
age_days=$(( (now_epoch - last_epoch) / 86400 ))
echo "Age (days): ${age_days}"

if [ "${age_days}" -gt "${max_stale_days}" ]; then
  echo "::error::${workflow_file} success is ${age_days} days old (max ${max_stale_days})."
  exit 1
fi

echo "Freshness OK for ${workflow_file} (${age_days}d)"
