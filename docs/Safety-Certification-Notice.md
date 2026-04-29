# Safety & Certification Notice — Nexus-HEMS-Dash

**Last updated:** 2026-04-29
**Applies to:** All versions ≤ 1.2.0

---

## 1. Safety-Critical Context

Nexus-HEMS-Dash controls or monitors safety-critical electrical infrastructure:

| Domain | Typical hazard | Regulatory scope |
|---|---|---|
| Battery storage (LFP, NMC) | Overcharge / thermal runaway | IEC 62619, VDE 0510-11 |
| EV charging / V2G (OCPP, ISO 15118) | Grid instability, EV battery damage | IEC 61851, ISO 15118 |
| Heat pump (SG Ready, EEBUS) | Comfort loss, freeze damage | EN 14511, VDE-AR-N 4105 |
| Grid feed-in / §14a EnWG | Regulatory non-compliance | EnWG §14a, NAV §20 |
| Photovoltaic inverter (SunSpec/Modbus) | Anti-islanding, overvoltage | VDE-AR-N 4105, IEC 62116 |

**Any software that sends commands to these systems operates in a safety-critical domain.** Failures can cause property damage, electrical fires, injuries, or regulatory penalties.

---

## 2. Current Certification Status

> **No regulatory certification has been obtained for any version of Nexus-HEMS-Dash.**

| Standard | Status | Notes |
|---|---|---|
| VDE-AR-E 2829-6 (EEBUS/HEMS) | ❌ Not certified | SHIP handshake implemented; TÜV/DEKRA audit pending |
| VDE-AR-N 4105 (grid feed-in) | ❌ Not certified | Adapter configuration only; no SIL assessment |
| ISO 15118-20 (V2G / BPT) | ❌ Not certified | BPT parameters implemented; CharIN conformance testing not performed |
| IEC 62619 (battery safety) | ❌ Not applicable | Application layer only; cell/BMS hardware certified separately |
| CE marking | ❌ Not assessed | No EU Declaration of Conformity |
| GDPR Art. 25 (privacy by design) | 🔄 Partial | PII masking implemented; formal DPIA not performed |

### What "production-grade" means for this project

The label **production-grade** refers to software quality attributes:

- Strict TypeScript, zero linting warnings, WCAG 2.2 AA accessibility
- Automated security gates (SBOM, Grype CVE scan, OWASP dependency audit)
- Circuit-breaker patterns, dead-letter queues, structured logging
- Signed Docker images (cosign, SLSA Level 2)
- OCPP 2.1 / EEBUS SHIP / OpenADR 3.1 protocol compliance at the implementation level

It does **not** imply regulatory approval, functional safety assessment (IEC 61508 / EN 50128 SIL), or approval for safety-critical use without independent certification.

---

## 3. Mock Mode vs. Live Hardware

The `ADAPTER_MODE=mock` default is intentional for developer onboarding and CI. **Critical differences:**

| Property | Mock mode | Live hardware |
|---|---|---|
| Data source | Random/simulated | Real inverters, EV chargers, heat pumps |
| Commands executed | Logged only | Sent to hardware |
| Failure modes | None | Thermal runaway, overcurrent, grid violations |
| Circuit breaker | Present but trivially exercised | Must be validated under real fault conditions |
| Latency | Synthetic | Protocol-dependent (MQTT ≤ 500 ms, Modbus RTU ~100 ms) |

**Before switching to `ADAPTER_MODE=live` on real hardware:**

1. Review `docs/Adapter-Dev-Guide.md` and `docs/Protocol-Adapter-Guide-Backend.md` end-to-end.
2. Validate every adapter config against the `Hardware-Compatibility-Matrix.md`.
3. Confirm all rate limits, SOC guardrails, and §14a power caps are correctly configured.
4. Run with hardware **read-only** first (disable write commands in adapter config) and monitor `apps/api/data/audit-log.ndjson` for 24–48 hours.
5. Engage a qualified electrician and, where required, a certified energy system integrator.

---

## 4. Command Safety Architecture

The following layers are implemented to reduce — but not eliminate — risk:

```
User UI / AI Suggestion
  │
  ▼
Zod schema validation (packages/shared-types)
  │
  ▼
Rate limiting: 30 cmd/min per connection (WS_RATE_LIMIT)
  │
  ▼
IndexedDB audit trail (apps/web/src/core/command-safety.ts)
  │
  ▼
SOC guardrails: EV min 10% / max 95% (OCPP21Adapter)
§14a cap: 4.2 kW max grid charge (EnergyRouterService)
  │
  ▼
Circuit breaker: CLOSED → OPEN after 5 failures, 30s cooldown
  │
  ▼
Hardware adapter (OCPP / Modbus / MQTT / EEBUS)
  │
  ▼
Physical hardware (inverter / wallbox / heat pump / battery)
```

These layers are software-only. They do not replace hardware-level protection devices (fuses, MCBs, RCDs, BMS overcurrent protection).

---

## 5. What Must Be Done Before a Safety-Critical Deployment

### Mandatory steps

- [ ] **Professional electrical installation review** by a licensed electrician
- [ ] **VDE-AR-N 4105 compliance check** for grid feed-in (if applicable, Germany)
- [ ] **Grid operator notification** for battery storage ≥ 600 W (NAV §20)
- [ ] **Hardware BMS independence** — battery safety must not depend solely on this software
- [ ] **Failsafe hardware interlock** — ensure the physical system can operate safely if the HEMS dashboard becomes unavailable (network outage, server restart)

### Strongly recommended

- [ ] Penetration test before exposing any API endpoint to the internet
- [ ] Separate VLAN for HEMS devices, isolated from general home network
- [ ] Regular `pnpm audit` + Grype SBOM scan schedule (at minimum before each live deployment)
- [ ] Monitoring alerts on circuit-breaker OPEN events (Prometheus → Alertmanager)
- [ ] Backup power for the server running the API (UPS)

---

## 6. Tauri Desktop App — Auto-Updater Status (CRIT-02)

The Tauri auto-updater is **currently disabled** (`active: false` in `tauri.conf.json`).

**Risk if enabled without a signing key:** An unsigned or improperly signed update could allow arbitrary code execution on the user's desktop.

**Steps to safely activate the auto-updater:**

```bash
# 1. Generate the signing keypair (run once, store the private key securely — e.g. in a password manager or HSM)
cargo tauri signer generate -w ~/.tauri/nexus-hems.key

# 2. The command outputs the public key. Copy it.
# 3. Add to GitHub repository secrets:
#    TAURI_PRIVATE_KEY  = (contents of ~/.tauri/nexus-hems.key)
#    TAURI_KEY_PASSWORD = (password you set during generation)

# 4. Update tauri.conf.json:
#    "pubkey": "<public key from step 2>",
#    "active": true
#    (endpoints is already set to the GitHub releases URL)

# 5. Update tauri-build.yml to sign artifacts:
#    env:
#      TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
#      TAURI_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
```

**Do not set `active: true` with an empty `pubkey`** — the updater will attempt to download but cannot verify signatures, creating a supply-chain attack surface.

---

## 7. Regulatory & Liability Disclaimer

This software is provided "as is" under the MIT License. The authors:

- Make no warranties regarding fitness for safety-critical use
- Accept no liability for property damage, personal injury, or regulatory penalties arising from use in live electrical systems
- Do not represent that any version is certified under VDE, IEC, ISO, CE, or equivalent standards

End users and integrators are solely responsible for ensuring compliance with applicable local regulations, grid operator requirements, and safety standards before deploying this software with real hardware.

---

## 8. Reporting Safety Issues

Security and safety vulnerabilities should be reported via the coordinated disclosure process described in `SECURITY.md`. Do **not** open public GitHub issues for safety-critical bugs until a patch is available.

For imminent safety hazards in live deployments, shut down the system immediately and contact your hardware vendor and local grid operator.

---

*This notice is reviewed before each minor release. Open a PR against this file to suggest corrections.*
