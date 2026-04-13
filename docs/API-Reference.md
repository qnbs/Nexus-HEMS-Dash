# API Reference

Nexus HEMS server exposes REST endpoints and a real-time WebSocket interface.
All schemas are defined with Zod in `src/types/protocol.ts`.

---

## REST Endpoints

### `GET /api/health`

Health check (no auth required).

**Response** `200 OK`

```json
{
  "status": "ok",
  "uptime": 3600,
  "adapters": [{ "id": "victron-mqtt", "status": "connected" }],
  "metrics": { "totalSamples": 12 },
  "jwt": { "kid": "k-1", "rotationDueIn": "29d" }
}
```

### `POST /api/auth/token`

Request a JWT for WebSocket authentication.

**Body** (validated by `AuthTokenRequestSchema`)

```json
{ "clientId": "dashboard-1", "scope": "readwrite" }
```

**Response** `200 OK`

```json
{ "token": "eyJ…", "expiresIn": "24h" }
```

### `POST /api/auth/refresh`

Refresh an existing JWT via `Authorization: Bearer <token>`.

**Response** `200 OK`

```json
{ "token": "eyJ…", "expiresIn": "24h" }
```

### `GET /metrics`

Prometheus scrape endpoint. Returns `text/plain; version=0.0.4` with all `hems_*` metrics.

### `GET /api/metrics/json`

Same metrics in JSON format for the in-app monitoring dashboard.

**Response**

```json
{
  "families": [
    {
      "name": "hems_pv_power_watts",
      "help": "Current PV generation power in watts",
      "type": "gauge",
      "samples": [
        { "labels": { "inverter": "primary" }, "value": 3200, "timestamp": 1719000000000 }
      ]
    }
  ],
  "health": { "uptime": 3600, "connections": 2 }
}
```

### `GET /api/eebus/discover`

List EEBUS devices found via mDNS (`_ship._tcp`).

### `POST /api/eebus/pair`

Pair an EEBUS device by SKI (validated by `EEBUSPairRequestSchema`).

**Body**

```json
{ "ski": "ABC123…" }
```

### `GET /api/grafana/dashboard`

Returns a Grafana dashboard JSON model pre-configured for all `hems_*` metrics.

---

## WebSocket Protocol

Connect to `ws://host:port` with optional authentication:

- Query parameter: `?token=<JWT>`
- Header: `Authorization: Bearer <JWT>`

In production (`NODE_ENV=production`) authentication is **required**; in development anonymous connections are accepted.

### Server → Client Messages

| `type`          | Payload                         | Frequency           |
| --------------- | ------------------------------- | ------------------- |
| `ENERGY_UPDATE` | `EnergyData` object (see below) | Every 2 s           |
| `ERROR`         | `{ error: string }`             | On invalid commands |

#### `EnergyData` Fields

| Field            | Type   | Unit                  |
| ---------------- | ------ | --------------------- |
| `gridPower`      | number | W (positive = import) |
| `pvPower`        | number | W                     |
| `batteryPower`   | number | W (positive = charge) |
| `houseLoad`      | number | W                     |
| `batterySoC`     | number | % (0–100)             |
| `heatPumpPower`  | number | W                     |
| `evPower`        | number | W                     |
| `gridVoltage`    | number | V                     |
| `batteryVoltage` | number | V                     |
| `pvYieldToday`   | number | kWh                   |
| `priceCurrent`   | number | €/kWh                 |

### Client → Server Commands

Validated by `WSCommandSchema`. Rate-limited to **30 commands/min** per client.

| `type`                | `value` | Range            |
| --------------------- | ------- | ---------------- |
| `SET_EV_POWER`        | watts   | 0 – 50 000       |
| `SET_HEAT_PUMP_POWER` | watts   | 0 – 50 000       |
| `SET_BATTERY_POWER`   | watts   | −50 000 – 50 000 |

---

## Prometheus Metrics

| Metric                              | Type    | Labels       |
| ----------------------------------- | ------- | ------------ |
| `hems_pv_power_watts`               | gauge   | `inverter`   |
| `hems_battery_power_watts`          | gauge   | `battery_id` |
| `hems_grid_power_watts`             | gauge   | `phase`      |
| `hems_house_load_watts`             | gauge   | —            |
| `hems_ev_charger_power_watts`       | gauge   | `charger_id` |
| `hems_heat_pump_power_watts`        | gauge   | —            |
| `hems_battery_soc_percent`          | gauge   | `battery_id` |
| `hems_grid_voltage_volts`           | gauge   | `phase`      |
| `hems_battery_voltage_volts`        | gauge   | `battery_id` |
| `hems_pv_yield_today_kwh`           | counter | —            |
| `hems_tariff_price_eur_per_kwh`     | gauge   | `provider`   |
| `hems_uptime_seconds`               | counter | —            |
| `hems_websocket_messages_total`     | counter | `direction`  |
| `hems_websocket_connections_active` | gauge   | —            |

---

## Security

- **Helmet** CSP, HSTS, X-Frame-Options: DENY
- **CORS** allowlist (configurable via `CORS_ORIGINS` env var)
- **Rate limiting**: 100 req/min global, 60 req/min `/api/*`, 30 cmd/min per WS client
- **JWT**: Ed25519 (EdDSA), 24 h expiry, automatic key rotation
- **WebSocket**: 64 KB max payload, Zod command validation
- **Input validation**: All request bodies validated with Zod schemas
