# Manual workflow triggers (maintainer)

Cloud agents may not have `actions:write` to dispatch or rerun workflows. Use the GitHub UI or a PAT with workflow scope.

## Tauri Desktop Build (after `tauri.conf.json` / `projectPath` fix)

1. **Actions** → **Tauri Desktop Build** → **Run workflow**
2. Branch: `main`
3. Version: `1.7.0` (without leading `v`)
4. Wait for linux + macos + windows matrix jobs

Or re-run a failed release-triggered build from the failed run page once the fix is on `main`.

## Deploy (GitHub Pages)

If deploy times out in `deployment_queued`, re-run the **Deploy** workflow on `main` after merge. The job now uses a 30-minute timeout.

## PR Feedback Summary

Fixed in PR #216 — invalid `github-script` SHA. No manual action needed after merge.
