# Operator Screenshots — Capture Guide

> Placeholder assets for integration guides (P3 polish). Screenshots are **not** committed to the repo by default — maintainers add PNGs under `docs/images/operators/` and reference them from guides.

---

## Directory layout

```
docs/images/operators/
  ha-ws-api-settings.png      # Settings → Adapters → HA token
  ha-mqtt-broker.png          # MQTT broker mode
  eebus-certificates.png      # Settings → EEBUS certificates tab
  eebus-pairing-wizard.png    # Pairing approve step
  heatpump-modbus-settings.png
  wallbox-evcc-link.png
  mppt-modbus-live.png
  grafana-adapter-health.png  # nexus-hems-adapters dashboard
```

---

## Capture checklist (1280×800, light + dark theme)

| Guide | Screen | Steps |
|-------|--------|-------|
| [Home Assistant](Home-Assistant-Integration-Guide.md) | HA adapter settings | Settings → Adapters → Home Assistant → ha-ws-api filled |
| [EEBUS](EEBUS-Integration-Guide.md) | Certificates tab | Settings → tab=certificates → trust store visible |
| [Heat Pump](Heat-Pump-Integration-Guide.md) | Modbus host | Settings → Adapters → backend heatpump env hint |
| [Wallbox](Wallbox-EV-Charging-Guide.md) | evcc / OCPP panel | Devices → EV section |
| [MPPT](MPPT-Hybrid-Inverter-Guide.md) | Live energy PV | Energy Flow → production tab |
| [Grafana](Grafana-Dashboards-Custom.md) | Adapter Health | Import `nexus-adapter-health.json` |

---

## Markdown embed pattern

```markdown
![EEBUS certificates tab](./images/operators/eebus-certificates.png)
*Settings → EEBUS → Import Certificate (ocean-dark theme, v1.6.1)*
```

Use **German and English** captions in `de`/`en` guide sections when screenshots contain UI text.

---

## Automation (future)

- Playwright `toHaveScreenshot()` for Settings sub-routes (stored in `apps/web/tests/e2e/__screenshots__/`)
- Chromatic for component-level captures — not a substitute for full-page operator flows
