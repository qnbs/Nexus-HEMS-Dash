#!/usr/bin/env bash
# Block until github-pages has no in-flight deployment and optional cooldown elapsed.
# Mitigates transient "Deployment failed, try again later" after rapid main pushes.
set -euo pipefail

ENV="${1:-github-pages}"
MIN_COOLDOWN_SEC="${2:-180}"
MAX_WAIT_SEC="${3:-900}"
POLL_SEC="${4:-20}"
REPO="${REPO:?REPO env var required (owner/repo)}"

deadline=$((SECONDS + MAX_WAIT_SEC))
ACTIVE_STATES='^(queued|waiting|pending|in_progress)$'

echo "Waiting for '${ENV}' to be idle (cooldown=${MIN_COOLDOWN_SEC}s, max=${MAX_WAIT_SEC}s)."

while [ "$SECONDS" -lt "$deadline" ]; do
  latest_id="$(gh api "repos/${REPO}/deployments?environment=${ENV}&per_page=1" --jq '.[0].id // empty' 2>/dev/null || true)"
  if [ -z "$latest_id" ]; then
    echo "No '${ENV}' deployments found; ready to publish."
    exit 0
  fi

  latest_state="$(gh api "repos/${REPO}/deployments/${latest_id}/statuses?per_page=1" --jq '.[0].state // "unknown"')"
  latest_updated="$(gh api "repos/${REPO}/deployments/${latest_id}/statuses?per_page=1" --jq '.[0].updated_at // empty')"
  echo "Latest deployment ${latest_id}: state=${latest_state}, updated=${latest_updated:-n/a}"

  if [[ "$latest_state" =~ $ACTIVE_STATES ]]; then
    echo "Deployment still active; sleeping ${POLL_SEC}s..."
    sleep "$POLL_SEC"
    continue
  fi

  if [ "$latest_state" = "success" ] && [ -n "$latest_updated" ]; then
    updated_epoch="$(date -u -d "$latest_updated" +%s)"
    now_epoch="$(date -u +%s)"
    age=$((now_epoch - updated_epoch))
    if [ "$age" -lt "$MIN_COOLDOWN_SEC" ]; then
      wait_for=$((MIN_COOLDOWN_SEC - age))
      echo "Last successful publish ${age}s ago; sleeping ${wait_for}s for cooldown."
      sleep "$wait_for"
    fi
  fi

  echo "Environment '${ENV}' is idle; proceeding."
  exit 0
done

echo "::error::Timed out after ${MAX_WAIT_SEC}s waiting for '${ENV}' to become idle." >&2
exit 1
