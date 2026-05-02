# ADR-015 — OCPP 2.1 Security Profile 3 and Browser WebSocket Limits

**Status:** Accepted  
**Date:** 2026-05-02  

## Context

Security Profile 3 requires mutual TLS between CSMS and charging station. The dashboard uses standard browser `WebSocket`, which cannot attach TLS client certificates.

## Decision

- Adapter config continues to use `clientCert` / `clientKey` on `AdapterConnectionConfig` for PEM material **when** connecting via Tauri, native bridge, or terminating TLS at a local proxy.
- `OCPP21Adapter` logs a console warning when `securityProfile >= 3`, `tls === true`, and PEM fields are empty.
- CRL/OCSP validation remains the responsibility of the TLS terminator (proxy / desktop bridge), not the SPA.

## Consequences

Production SP3 deployments must route OCPP through an edge component that performs mTLS; the SPA alone cannot satisfy SP3 on the wire.
