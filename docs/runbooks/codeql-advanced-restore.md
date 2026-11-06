# Restore CodeQL Advanced (`.github/workflows/codeql.yml`)

**When:** GitHub **Default** setup was used and/or the **CodeQL Advanced** workflow was disabled (GitHub often sets it to `disabled_manually` when Default is on).

**Single source:** ADR-027 — **Advanced** via this workflow (`actions`, `javascript-typescript` with `security-and-quality`, `rust`). **Do not** run Default and Advanced at the same time.

---

## 1. Turn off Default (maintainer)

1. **Settings** → **Code security** → **Code scanning**.
2. For **CodeQL** default analysis: **Disable** / remove default setup so only one CodeQL configuration remains.

---

## 2. Enable the workflow (maintainer — UI)

Automation tokens may get **403** on `PUT .../actions/workflows/{id}/enable`. Use the UI:

1. **Actions** → left sidebar **CodeQL Advanced** (file: `codeql.yml`).
2. If the banner says the workflow was disabled: **Enable workflow** (or **I understand my workflows, go ahead and enable**).
3. Confirm the workflow shows **Active** (`gh workflow list --all | rg "CodeQL Advanced"` → should **not** say `disabled_manually`).

Optional (PAT with `actions:write` or repo admin):

```bash
gh workflow enable "CodeQL Advanced"
```

---

## 3. Run on `main`

1. **Actions** → **CodeQL Advanced** → **Run workflow** → branch **`main`** → **Run workflow**.
2. Wait for all matrix jobs (**actions**, **javascript-typescript**, **rust**) to succeed.

---

## 4. Verify ingest

- **Security** → **Code scanning** → confirm analyses for `refs/heads/main`.
- Optional: `node scripts/verify-code-scanning-workflow-health.mjs` (do **not** set `VERIFY_CODE_SCANNING_SKIP_CODEQL_ADVANCED=1`).

---

## Related

- [code-scanning-tool-health-421.md](code-scanning-tool-health-421.md) §0  
- [security-full-gate.md](security-full-gate.md) (Path A / B)
