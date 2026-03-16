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
- **Dependency Scanning**: npm audit, Snyk, Socket.dev, Aikido Safe Chain
- **Supply Chain**: OpenSSF Scorecard, Renovate automated updates, Dependabot
- **Container Security**: Trivy image scanning, read-only containers, non-root user
- **Anti-Trojan-Source**: Unicode Bidi character detection
- **Pre-commit Hooks**: Gitleaks, detect-private-key, anti-trojan-source
- **Conventional Commits**: Enforced via commitlint

## Encryption & Data Handling

- API keys are encrypted at rest using AES-GCM in IndexedDB (Dexie.js)
- No secrets are stored in environment variables or plain text
- TLS 1.3 with mTLS for EEBUS SPINE/SHIP communication
- All external API calls use HTTPS

## OpenSSF Scorecard

This project is tracked by the [OpenSSF Scorecard](https://scorecard.dev/viewer/?uri=github.com/qnbs/Nexus-HEMS-Dash) for supply chain security best practices.
