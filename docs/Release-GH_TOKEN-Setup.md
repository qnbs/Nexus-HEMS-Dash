# GH_TOKEN — semantic-release Setup for Protected `main`

**Related:** ADR-015 (`docs/adr/ADR-015-release-automation.md`), `.github/workflows/release.yml`

semantic-release must push a `chore(release): … [skip ci]` commit **and** a version tag back to `main`. The default `GITHUB_TOKEN` cannot bypass repository rulesets on `main`, so releases stall at v1.6.1 until a PAT is configured.

## Option A — Classic PAT (simplest, matches ADR-015)

1. GitHub → **Settings** (your user) → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
2. **Note:** `Nexus-HEMS-Dash semantic-release`
3. **Expiration:** 90 days or custom (set a calendar reminder to rotate).
4. **Scopes** (minimum):
   | Scope | Why |
   |-------|-----|
   | **`repo`** | Push release commits + tags to `main`, read repo metadata |

   For a **public** repository only, `public_repo` can suffice in theory; this project documents **`repo`** as the supported path.

5. Copy the token (shown once).
6. Repository **qnbs/Nexus-HEMS-Dash** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - **Name:** `GH_TOKEN` (exact spelling — `release.yml` uses `secrets.GH_TOKEN || secrets.GITHUB_TOKEN`)
   - **Value:** paste the PAT

7. **Ruleset bypass (required if push still fails):**
   - Repo → **Settings** → **Rules** → **Rulesets** → open the `main` ruleset
   - **Bypass list** → add the **GitHub user** that owns the PAT (or a dedicated `release-bot` machine user)
   - Ensure bypass allows **push** (and signed commits if your ruleset requires commit signing — the bypass actor must sign or the rule must exempt bypassed actors)

8. Trigger: merge any `feat:` / `fix:` commit to `main`, or re-run the **Release** workflow manually.

## Option B — Fine-grained PAT (GitHub recommended)

1. GitHub → **Settings** → **Developer settings** → **Fine-grained personal access tokens** → **Generate new token**.
2. **Resource owner:** `qnbs`
3. **Repository access:** **Only select repositories** → `Nexus-HEMS-Dash`
4. **Permissions:**

   | Permission | Access | Why |
   |------------|--------|-----|
   | **Contents** | Read and write | Push release commit + tag |
   | **Metadata** | Read-only | Required baseline |
   | **Pull requests** | Read and write | `@semantic-release/github` release notes |
   | **Issues** | Read and write | GitHub release / issue linkage |
   | **Workflows** | Read-only | Sufficient for semantic-release (no workflow edits) |

5. Save as repository secret **`GH_TOKEN`** (same as Option A).
6. Add the token owner to the **ruleset bypass list** (same as step 7 above).

## Option C — Ruleset bypass for `github-actions[bot]` (no PAT)

If you prefer not to store a PAT:

1. Repo → **Settings** → **Rules** → **Rulesets** → `main`
2. **Bypass list** → add **`github-actions[bot]`** with push permission
3. Ensure required status checks still run on normal PRs (bypass only applies to the bot actor)

This can work when the ruleset allows the default `GITHUB_TOKEN` for trusted actors. If pushes still fail, use Option A/B.

## Verify

After configuring:

```bash
GH_PAGER=cat PAGER=cat gh run list --workflow=release.yml --branch main --limit 3
GH_PAGER=cat PAGER=cat gh run view <run-id> --log | grep -E 'Released|semantic-release|failed to push'
git fetch --tags origin && git tag --sort=-creatordate | head -3
```

Success indicators:

- Job summary: `✅ Released v1.7.0` (or next version)
- New annotated tag `v1.7.x` on `main`
- `CHANGELOG.md` on `main` with `[Unreleased]` emptied and new version section
- GitHub **Releases** page shows generated notes
- Downstream: `tauri-build.yml` + `container-publish.yml` trigger on the new release/tag

## Security notes

- Never commit the PAT to the repo or log it in CI output.
- Rotate on expiry; revoke immediately if leaked.
- Use a dedicated machine user (`release-bot`) if the maintainer account should not bypass rulesets personally.
- `GH_TOKEN` is only consumed by `release.yml` — other workflows continue using `GITHUB_TOKEN`.
