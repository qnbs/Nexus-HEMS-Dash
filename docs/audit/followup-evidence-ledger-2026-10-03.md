# Follow-up evidence ledger — post-v1.12.1 aftercare

**Campaign:** Post-audit residual convergence (continuation of waves 0–9 / #363)  
**Ledger opened:** 2026-10-04 (UTC)  
**Baseline re-fetch SHA:** `539a897de17eca0877819bda9a68e8de8b2e843b`  
**Prior audit ledger:** [`evidence-ledger-2026-10-02.md`](evidence-ledger-2026-10-02.md)  
**Prior final report:** [`Audit-Final-Report-2026-10-02.md`](Audit-Final-Report-2026-10-02.md)

This document is the **delta ledger** for the follow-up master prompt. It does not reopen closed #363 findings without regression evidence.

---

## 1. Repository snapshot (2026-10-04)

| Signal | Value |
|--------|--------|
| `main` HEAD | `0eb15bc` — `chore(release): 1.12.2 patch (FUP-REL-01)` |
| Root `package.json` version | `1.12.2` |
| Latest tag | `v1.12.2` @ `0eb15bc` |
| Open PRs | **0** |
| Open GitHub Issues | **0** |
| Ruleset | `Main Branch Protection (Production)` id **15007889**, enforcement **active** |
| Required status checks | `✅ CI Passed`, `lighthouse`, `🎭 E2E Tests` |
| `strict_required_status_checks_policy` | **false** |
| `required_approving_review_count` | **0** |
| `required_review_thread_resolution` | **false** |
| `required_signatures` | **true** |
| `current_user_can_bypass` (agent token) | **always** (governance residual **FUP-GOV-01**) |

### Commits on `main` after tag `v1.12.1` (`c48cd56`)

| SHA | Summary |
|-----|---------|
| `53c5d48` | #369 docs truth-sync v1.12.1 |
| `ecc210f` | #370 debt/safety/evidence truth-sync |
| `f4f323c` | #371 `tar` / `undici` overrides |
| `539a897` | #372 Dependabot inventory link |

**Release drift:** GitHub Release **v1.12.1** points at tag `c48cd56`; security override **#371** is on `main` but **not** on the tag → **FUP-REL-01** (cut **v1.12.2** before large behavioral waves).

---

## 2. Release & provenance

| Item | Value |
|------|--------|
| Latest GitHub Release | **v1.12.2** (published 2026-10-04; manifest #374) |
| Tag `v1.12.2` commit | `0eb15bc` |
| Tag `v1.12.1` commit | `c48cd56` |
| Tag `v1.12.0` commit | `698cf42` |
| Pages URL | https://qnbs.github.io/Nexus-HEMS-Dash/ |
| Pages HTTP (root) | **200** (checked 2026-10-04) |
| Pages deploy SHA correlation | Deploy workflow **37115991467** succeeded for push `539a897`; browser SHA verification not yet automated (**FUP-SMOKE-01**, **FUP-PROV-01**) |
| Container images | `container-publish.yml` green on prior `main` pushes; digests not captured in this ledger pass (SBOM schedule **37175749578** success 2026-10-04) |

---

## 3. Workflow runs (representative)

| Workflow | Run (example) | Branch/SHA | Result |
|----------|-----------------|------------|--------|
| CI | `37115991556` | `main` @ `539a897` | **success** |
| Deploy | `37115991467` | `main` @ `539a897` | **success** |
| Dependabot `npm_and_yarn` | `37115781313` | `main` dynamic | **failure** (13 updater errors, down from 18) |
| SBOM Generation (schedule) | `37175749578` | `main` | **success** |

Re-fetch required before each merge; do not assume greens persist.

---

## 4. Dependency & supply chain

| Check | Result (2026-10-04, `539a897` workspace) |
|-------|------------------------------------------|
| `pnpm audit --prod` | **No known vulnerabilities** |
| `pnpm audit` (full tree) | **58** findings (44 high, 14 moderate) — dev/build transitive; **FUP-DEPS-02** |
| Manual overrides on `main` | `tar >=7.5.21`, `undici ^7.29.1` (#371), plus #366–#367 floors |
| Dependabot npm job | Fails: Vitest peer lockstep (`vitest` 5.x vs `@vitest/*` 4.1.9), `security_update_not_possible`, `security_update_not_found` (**FUP-DEPS-01**) |
| Renovate | Scheduled runs **success** (e.g. `35958881054`); **npm owner** per `DEVOPS.md` — align GitHub security updater vs Renovate (**FUP-DEPS-01**) |
| Cargo/Tauri advisories | Not re-run in this pass; track under **FUP-DEPS-01** / release gates |

### Dependabot error classes (run `37115781313`, indicative)

- `@humanfs/node`, `@vitest/mocker`, `@xmldom/xmldom`, `baseline-browser-mapping`, `basic-ftp`, `brace-expansion`, `browserslist`, `fast-uri`, `js-yaml`, `nanoid`, `postcss`, `extract-zip` (`security_update_not_found`), Vitest ecosystem peer failure.

---

## 5. Protocol / feature partial status (from `FEATURE_STATUS.md`)

| Area | Frontend | Backend | Notes |
|------|----------|---------|--------|
| Home Assistant MQTT | ✅ contrib | ⚠️ partial | **FUP-PROTO-01** |
| Matter/Thread | ✅ contrib | ⚠️ partial | **FUP-PROTO-01** |
| Zigbee2MQTT | ✅ contrib | ⚠️ partial | **FUP-PROTO-01** |
| OpenADR 3.1 VEN | ✅ contrib | ⚠️ partial | **FUP-OADR-01**, **FUP-PROTO-01** |
| Capacitor mobile | — | — | ⚠️ partial (**FUP-CAP-01**) |
| WCAG manual SR pass | — | — | ⏳ planned (**FUP-A11Y-01**) |

---

## 6. Regression assertions (#363 — do not re-implement)

Treat as **locked** unless a targeted test fails:

- Composite HTTP idempotency (scope + fingerprint)
- Offline replay envelope + TTL/skew
- OCPP live `Authorize` fail-closed, allowlist, 64 KiB frame cap
- WS ticket scope fallback
- Strict EV mode/phases; evcc unsupported-command rejection
- Settings sync registry, credential rejection, batch mutex + rollback
- `COMMAND_RISK_MAP` exhaustiveness
- Build SHA/time provenance (`VITE_BUILD_SHA`)
- `navigator.locks` offline sync
- Deploy `wait-for-ci` on exact SHA
- API `test:coverage` in CI + `check:coverage-baseline` before `✅ CI Passed` (**verified** in `.github/workflows/ci.yml` — supersedes stale audit report claim **FUP-DOC-01**)

---

## 7. Follow-up finding register

| ID | Priority | Domain | Status | Wave | Summary |
|----|----------|--------|--------|------|---------|
| **FUP-REL-01** | P1 | Release | **closed** | F0 | **v1.12.2** @ `0eb15bc` (#374, tag published 2026-10-04) |
| **FUP-REDIS-01** | P0/P1 | Sync | **closed** | F1 | #375 @ `23538c9` — Lua batch, stream diff, `REDIS_REQUIRED`, Helm guard |
| **FUP-IDEM-01** | P0/P1 | Idempotency | **closed** | F2 | Physical-command ledger + UNKNOWN after dispatch (#377) |
| **FUP-REDIS-02** | P1 | Redis API | **closed** | F1 | #375 — typed `SET NX`, `hget`/`hdel`/`eval`/`xrevrange` on `IRedisClient` |
| **FUP-CTRL-01** | P1 | Safety | **closed** | F3 | ControlAuthority fail-closed browser direct control (#378) |
| **FUP-OCPP-01** | P1 | OCPP | **open** | F4 | Disable SP0 insecure CSMS by default; identity/session limits |
| **FUP-DEPLOY-01** | P1 | CI/CD | **open** | F5 | Promote CI-built `apps/web/dist`, no post-CI rebuild |
| **FUP-SMOKE-01** | P1 | CI/CD | **open** | F5 | Browser smoke on Pages; assert expected `VITE_BUILD_SHA` |
| **FUP-E2E-01** | P2 | QA | **open** | F6 | Chromium blocking vs Firefox/WebKit scheduled; README truth |
| **FUP-PWA-01** | P2 | PWA | **open** | F6 | Dedicated Playwright project with SW enabled |
| **FUP-DEPS-01** | P1/P2 | Supply chain | **open** | F7 | Dependabot 13-error convergence; Vitest lockstep; ownership |
| **FUP-DEPS-02** | P2 | Supply chain | **open** | F7 | Dev/build HIGH policy + time-bounded allowlist |
| **FUP-GOV-01** | P1 | Governance | **open** | F10 | Ruleset tighten; map bypass actors; no routine bypass |
| **FUP-DOC-01** | P2 | Docs | **open** | F0/F9 | Truth-sync audit final report (API coverage blocking) |
| **FUP-DST-01** | P2 | Domain | **open** | F8 | Tariff/optimizer DST proofs (Europe/Berlin) |
| **FUP-OADR-01** | P2 | OpenADR | **open** | F8 | Webhook auth, expiry, dispatch release, idempotency |
| **FUP-PROTO-01** | P2 | Protocols | **open** | F8 | Backend parity matrix HA/Matter/Zigbee/OpenADR |
| **FUP-CAP-01** | P2 | Mobile | **open** | F9 | `cap sync` + Android build evidence |
| **FUP-A11Y-01** | P2 | a11y | **open** | F9 | Manual screen-reader protocol (no fake pass) |
| **FUP-SW-01** | P2 | PWA | **open** | F9 | SW/background-sync lifecycle; stuck `syncing` recovery |
| **FUP-HEALTH-01** | P2 | Ops | **open** | F9 | Health/readiness Redis required; Prometheus counters |
| **FUP-PROV-01** | P2 | Provenance | **open** | F5/F9 | Unified build-info across web/API/container/Helm |

---

## 8. Execution log (append-only)

| Date (UTC) | SHA / PR | Action |
|------------|----------|--------|
| 2026-10-04 | (this file) | Opened follow-up ledger at `539a897`; registered findings FUP-* |
| 2026-10-04 | `0eb15bc` / #374 | **FUP-REL-01:** v1.12.2 manifest + tag; `Release-History.md` SHA `0eb15bc` |
| 2026-10-04 | (F1 branch) | **FUP-REDIS-01/02:** atomic Lua batch, stream diff, typed SET NX, `REDIS_REQUIRED`, Helm wiring (PR pending) |
| 2026-10-04 | `23538c9` / #375 | **FUP-REDIS-01/02 merged** (admin squash; CI green @ `fb2d8a4`, 8 review threads resolved) |
| 2026-10-04 | `0b7e759` / #376 | Ledger closeout: FUP-REDIS-01/02 marked **closed** on `main` |
| 2026-10-04 | `f53aea1` / #377 | **FUP-IDEM-01 merged** — physical-command ledger + replay/WS wiring |
| 2026-10-04 | (F3 branch) | **FUP-CTRL-01:** ControlAuthority resolver + command/connect gates (PR #378 pending) |

---

## 9. Certification

No regulatory certification (VDE/IEC/CE) is claimed. Cloud campaign: **no live hardware actuation** (`ADAPTER_MODE=mock`, no `ALLOW_LIVE_HARDWARE`).
