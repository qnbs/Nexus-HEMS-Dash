# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Nexus-HEMS Dashboard, please report it responsibly:

1. **Do NOT open a public issue.** Security vulnerabilities must be reported privately.
2. **Email**: Send a detailed report to the repository owner via [GitHub Security Advisories](https://github.com/qnbs/Nexus-HEMS-Dash/security/advisories/new).
3. **Include**: A description of the vulnerability, steps to reproduce, affected versions, and any potential impact.

### Response Timeline

- **Acknowledgement**: Within 48 hours of receiving the report.
- **Assessment**: Within 7 days, we will assess the severity and impact.
- **Fix & Disclosure**: Critical vulnerabilities will be patched within 14 days. A coordinated disclosure will follow.

## Security Measures

This project employs multiple layers of security:

- **Static Analysis**: CodeQL, Semgrep, ESLint security rules
- **Secret Detection**: Gitleaks (pre-commit + CI), Trivy secret scanner
- **Dependency Scanning**: pnpm audit, Snyk, Socket.dev, Aikido Safe Chain
- **Supply Chain**: OpenSSF Scorecard, Renovate automated updates, Dependabot
- **CI Hardening**: GitHub Actions pinned to commit SHA, mandatory security workflow gate
- **Deploy Governance**: GitHub Pages deploy requires manual `workflow_dispatch` confirmation (`approveDeploy=DEPLOY`)
- **Container Security**: Trivy image scanning, read-only containers, non-root user, per-IP connection limits (`limit_conn`)
- **Anti-Trojan-Source**: Unicode Bidi character detection
- **Pre-commit Hooks**: Gitleaks, detect-private-key, anti-trojan-source
- **Conventional Commits**: Enforced via commitlint
- **JWT Entropy Validation**: `jwt-utils.ts` warns on low-entropy secrets, dictionary words, and short keys at startup (production only)
- **Auth Rate Limiting**: `/api/auth/token` and `/api/auth/refresh` limited to 10 req/min per IP (brute-force protection)
- **Trusted-IP Bypass**: `RATE_LIMIT_TRUSTED_IPS` env var allows internal load balancers to bypass rate limits safely

## Runtime Baselines

- **Production runtime**: Node.js 24 LTS (Docker + CI release path)
- **Runtime framework**: Express 5.x + `@types/express` 5.x
- **Package manager**: pnpm 10.33.0 (pinned via `packageManager` field and corepack)

## Encryption & Data Handling

- API keys are encrypted at rest using AES-GCM in IndexedDB (Dexie.js)
- No secrets are stored in environment variables or plain text
- TLS 1.3 with mTLS for EEBUS SPINE/SHIP communication
- All external API calls use HTTPS

## OpenSSF Scorecard

This project is tracked by the [OpenSSF Scorecard](https://scorecard.dev/viewer/?uri=github.com/qnbs/Nexus-HEMS-Dash) for supply chain security best practices.
