# Release History — Nexus-HEMS-Dash

**Last curated:** 2026-07-03  
**Current release:** `v1.9.0`  
**Policy:** Manual-only semantic-release (ADR-015 amended 2026-07-03)

This document records the **canonical release timeline**, known anomalies from the automatic-release period, and how to cut future releases correctly.

---

## Canonical tag timeline

| Tag | Date (UTC) | Head commit | Highlights |
|-----|------------|-------------|------------|
| `v1.9.0` | 2026-07-02 | `4138235` | Read-only banner, `ControlPanel` removal, `ENERGY_UPDATE` Zod validation |
| `v1.8.0` | 2026-07-02 | `1407ad5` | ADR-025 backend WS consumer (`VITE_BACKEND_WS`) |
| `v1.7.0` | 2026-07-02 | `c963a5d` | OpenEMS + OCPP CSMS backend, coverage 78/72/70/80, GH_TOKEN release docs |
| `v1.6.1` | 2026-07-02 | — | Hardware registry 190 devices, HeatPumpAdapter, help/settings audit |
| `v1.6.0` | 2026-07-02 | — | P1 MQTT/Zigbee/Shelly/OCPP adapter enhancements |
| `v1.5.0` | 2026-07-02 | — | EEBUS backend, HA native, ExecAdapter |
| `v1.4.0` | 2026-07-02 | — | LiveEnergyAggregator bridge (HIGH-17), hardware registry UI |
| `v1.3.0` | 2026-06-30 | — | Safety defaults, read-only mode, supply-chain gates |
| `v1.2.0` | 2026-06-30 | — | CI hardening, safety documentation |
| `v1.1.0` | 2026-04-25 | — | Mobile, tariffs, toolchain |
| `v1.0.0` | — | — | Initial public release |

---

## 2026-07-02 automatic-release incident (resolved)

Between `v1.7.0` and `v1.9.0`, semantic-release ran on **every `main` push** after `GH_TOKEN` was configured. Effects:

| Problem | Impact | Resolution (2026-07-03) |
|---------|--------|-------------------------|
| Rapid version bumps | Three releases in one evening (`1.7.0` → `1.9.0`) | `release.yml` trigger changed to **manual dispatch only** |
| Empty GitHub Release bodies | `v1.8.0` and `v1.9.0` published with header-only notes | Bodies curated from `CHANGELOG.md`; file structure fixed |
| Malformed `CHANGELOG.md` | semantic-release prepended version blocks **above** `# Changelog` | Restored Keep a Changelog order (header → Unreleased → versions) |
| Version drift | Root `package.json` at `1.9.0` while workspace/Tauri stayed at `1.6.1` | All version fields synced to `1.9.0`; `.releaserc.json` git assets extended |
| Duplicate Tauri CI | `release.yml#tauri-release` + `tauri-build.yml` on `release: published` | `tauri-release` job removed; desktop builds owned by `tauri-build.yml` |
| `chore(release): … [skip ci]` commits | Skipped CI on version bumps | Acceptable for release commits; feature work still gated by PR CI |

---

## 2026-07-03 GitHub Pages 403 (transient, resolved)

An audit observed `https://qnbs.github.io/Nexus-HEMS-Dash/` returning HTTP 403 (101-byte body). Investigation found **no code or configuration fault**: `vite.config.ts` `base` is `/Nexus-HEMS-Dash/`, `.nojekyll` is present at the repo root and in `apps/web/public/` (copied into `dist/`), the Pages source is **GitHub Actions** (`build_type: workflow`, source `main:/`), HTTPS is enforced, and every recent `deploy.yml` run on `main` succeeded. Re-probing returned **HTTP 200** serving the SPA shell. Root cause: the transient "try again later" Pages state after rapid `main` pushes — already mitigated by PR #232's `concurrency` queue + sleep/retry and the `prune-deployments` job. No action required; monitor via `deploy.yml`.

---

## How to cut a release (going forward)

### Preferred — manual workflow dispatch

1. Ensure `CHANGELOG.md` `[Unreleased]` is accurate.
2. **Actions → Release → Run workflow** on `main`, `approveRelease=RELEASE`.
3. Verify: new tag, GitHub Release with non-empty body, workspace versions in sync.
4. Downstream: `tauri-build.yml` + `container-publish.yml` trigger on the published release.

### Fallback — fully manual tags

See **ADR-015 Option B** — bump versions, PR, tag, `gh release create`.

### Pre-release checklist

- [ ] `[Unreleased]` section complete in `CHANGELOG.md`
- [ ] `FEATURE_STATUS.md` / `README.md` version line updated if user-facing claims changed
- [ ] Root + `apps/{api,web}` + `packages/shared-types` + `tauri.conf.json` + `Cargo.toml` versions match
- [ ] No duplicate Tauri build workflows triggered unintentionally
- [ ] `GH_TOKEN` PAT valid (if using semantic-release dispatch)

---

## Related docs

- `docs/adr/ADR-015-release-automation.md` — trigger chain and policy
- `docs/Release-GH_TOKEN-Setup.md` — PAT setup (optional for manual tags)
- `docs/Manual-Workflow-Triggers.md` — workflow dispatch steps
- `CHANGELOG.md` — full per-version notes
