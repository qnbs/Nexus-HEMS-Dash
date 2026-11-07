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

1. **Actions** → workflows — pick **CodeQL Advanced** whose **file is** `.github/workflows/codeql.yml` (hover or open **View workflow file**; do not assume the display name is unique).
2. If the banner says the workflow was disabled: **Enable workflow** (or **I understand my workflows, go ahead and enable**).
3. Confirm the workflow shows **Active** (`gh workflow list --all | rg "CodeQL Advanced"` → should **not** say `disabled_manually`).

Optional (PAT with `actions:write` or repo admin):

```bash
gh workflow enable "CodeQL Advanced"
```

---

## 2.5. Phantom duplicate workflow (legacy `codeql1.yml`) — disable first

If a PR briefly added `.github/workflows/codeql1.yml` and that file was removed from the default branch, GitHub Actions may still list a second workflow named **CodeQL Advanced** pointing at **`codeql1.yml`**. It can stay **active** while the file no longer exists on `main`, which is misleading and can block **Code scanning** or confuse **Tool status**.

**Maintainer — UI**

1. **Actions** → find any **CodeQL Advanced** entry whose path is **`.github/workflows/codeql1.yml`** (open **View workflow file** or compare to `codeql.yml`).
2. **Disable workflow** on that entry (or delete the workflow from the Actions UI if GitHub offers it).
3. Re-check `gh workflow list --all | rg -i codeql` — only **one** **CodeQL Advanced** for **`codeql.yml`** should remain **active** after you complete §2.

CLI note: `gh workflow enable/disable` **403** with integration tokens is expected; the UI path above is authoritative.

---

## 3. Run on `main`

1. **Actions** → **CodeQL Advanced** ( **`codeql.yml` only** ) → **Run workflow** → branch **`main`** → **Run workflow**.
2. Wait for all matrix jobs (**actions**, **javascript-typescript**, **rust**) to succeed.

---

## 4. Verify ingest

- **Security** → **Code scanning** → confirm analyses for `refs/heads/main`.
- Optional: `node scripts/verify-code-scanning-workflow-health.mjs` (do **not** set `VERIFY_CODE_SCANNING_SKIP_CODEQL_ADVANCED=1`).

---

## 5. Related

- [code-scanning-tool-health-421.md](code-scanning-tool-health-421.md) §0  
- [security-full-gate.md](security-full-gate.md) (Path A / B)
