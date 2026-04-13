## [Unreleased]

### Features

- **Vite 8 Migration**: Migrated from Vite 6.4.2 to Vite 8.0.8 with Rolldown (Rust-based bundler)
  - Replaced Rollup + esbuild with Rolldown for production builds
  - OXC minification replaces esbuild minification
  - `@vitejs/plugin-react` v5 → v6 with native `reactCompilerPreset`
  - React Compiler now uses `@rolldown/plugin-babel` instead of inline Babel config
  - `build.rolldownOptions` replaces deprecated `build.rollupOptions`
  - LightningCSS default for CSS minification
- **Storybook 10**: Upgraded from Storybook 8.6 to 10.3.5 (Vite 8 compatible)
  - `addon-essentials` and `addon-interactions` merged into Storybook core
  - `@chromatic-com/storybook` upgraded to v5.1.2
- **Tailwind CSS**: `@tailwindcss/vite` upgraded to v4.2.2

### 🛠️ Infrastructure & Tooling

- **pnpm 10.31.0** enforced via Corepack (`packageManager` field in package.json)
  - Removed npm lockfile; `pnpm-lock.yaml` (v9.0) is the canonical lockfile
  - All 17 CI workflows updated to use `pnpm/action-setup@v4` + `corepack enable` + `--frozen-lockfile`
  - Docker builds use `corepack enable && pnpm install --frozen-lockfile`
  - DevContainer + Codespaces setup fully aligned with pnpm
  - `.npmrc` configured: `engine-strict`, `strict-peer-dependencies`, `prefer-frozen-lockfile`
  - No `--legacy-peer-deps` anywhere in the codebase
- **Node.js version matrix clarified**:
  - Production baseline: **Node.js 24 LTS** (all builds, containers, release workflows)
  - Development minimum: **Node.js 22+** (per `engines` field in package.json)
  - CI canary: **Node.js 25+** (non-blocking forward-compatibility signal)
- **Rolldown bundler** delivers OXC minification with deterministic 8-char content hashes
- **Express 5.x** deployed with full backward compatibility in API layer
- **Semantic Release** with Conventional Commits for automated versioning and changelog
- **Biome 2.4** as secondary lint layer alongside ESLint (cognitive complexity, hook-at-top-level)
  - `noAccumulatingSpread` elevated to error level

### 🔒 Security

- **CSP meta-tag** added to `index.html` for static hosting (GitHub Pages) — covers `default-src`, `script-src`, `connect-src` with whitelisted API domains, `frame-ancestors 'none'`, `object-src 'none'`
- **Rate-limit jitter** (±25%) on Express global + API limiters to prevent thundering-herd synchronisation
- **Docker Compose** containers enforced with `read_only: true` + `tmpfs` volumes
- All GitHub Actions pinned to commit SHA (prevents tag-rollback supply chain attacks)
- Security fuzz testing (`security-fuzz.test.ts`) in CI pipeline

### 📊 Quality

- **Vitest coverage thresholds raised**: Statements 55%, Branches 45%, Functions 55%, Lines 55%
- **Tailwind v4 `darkMode` config** fixed: combined selector for 3 dark themes (energy-dark, ocean-dark, nature-green)
- **TypeScript strictness**: `strict: true` baseline maintained; `exactOptionalPropertyTypes` tracked for future PR (42 adapter/auth fixes needed)

## 1.0.0 (2026-04-13)

### ⚠ BREAKING CHANGES

- Refactored from single-page dashboard to multi-page SPA

New Pages:

- Home (/) - KPI overview with mini Sankey and quick links
- Energy Flow (/energy-flow) - Full D3.js Sankey diagram
- Production (/production) - PV generation stats and forecasts
- Storage (/storage) - Battery SoC visualization and strategy
- Consumption (/consumption) - Usage breakdown and grid exchange
- EV Charging (/ev) - EV control modes and §14a EnWG
- Floorplan (/floorplan) - KNX interactive building control
- AI Optimizer (/ai-optimizer) - Gemini AI + voice control
- Tariffs (/tariffs) - Live Tibber/aWATTar prices and forecasts
- Analytics (/analytics) - Statistics, forecasts, PDF export
- 404 Not Found page

Architecture:

- React Router v7 with lazy() code-splitting per page
- Desktop sidebar navigation with 3 groups (Energy/Tools/System)
- Redesigned mobile bottom nav with 'More' sheet
- Breadcrumbs component with i18n route labels
- PageHeader component with icon, title, subtitle, actions
- Vendor chunk splitting (react, d3, motion, recharts, i18n, query)
- basename support for GitHub Pages deployment

Updated:

- Command palette with all 11 routes and bilingual keywords
- EN/DE locales with page-specific translations
- E2E tests for all routes (accessibility + user flow)
- CI/CD workflows with --legacy-peer-deps
- README v3.0.0 with page structure documentation

### ✨ Features

- 3× MultiPlus-II system presets, fully editable config, README rewrite, GH Pages fix ([acf58fd](https://github.com/qnbs/Nexus-HEMS-Dash/commit/acf58fda8b1026406188f12defee7c8c341dcb9a))
- adapter plugin system (contrib/ + registerAdapter API) ([fbc1888](https://github.com/qnbs/Nexus-HEMS-Dash/commit/fbc1888248000a0c550abde82727dd19ef100ca1))
- Adapter-Config-Panel, Compliance-Checklist, Dev-Guide ([2ed45d9](https://github.com/qnbs/Nexus-HEMS-Dash/commit/2ed45d939b4f1683cba16115df27ebb48fa6def0))
- **adapters:** implement Adapter Pattern for HEMS protocols v3.1.0 ([0007c54](https://github.com/qnbs/Nexus-HEMS-Dash/commit/0007c5451c0f9d6133d692f5db1f8e19bc9e0c4d))
- add 4 contrib protocol adapters (HA MQTT, Matter/Thread, Zigbee2MQTT, Shelly REST) ([5750f0f](https://github.com/qnbs/Nexus-HEMS-Dash/commit/5750f0f394bb816522552f0b17c525802120d4a2))
- add controllers, plugins & hardware registry pages ([7d7dd04](https://github.com/qnbs/Nexus-HEMS-Dash/commit/7d7dd042f88946fed67e233128a7e80e5b55a5f1))
- add stale-action, PR labeler, branch protection guide ([e22d3e4](https://github.com/qnbs/Nexus-HEMS-Dash/commit/e22d3e4da3c17e67f96a6b7a9fbaf2eaaa93a47c))
- **ai-optimizer:** comprehensive page rewrite with strategy timeline ([9b131b6](https://github.com/qnbs/Nexus-HEMS-Dash/commit/9b131b6d66aaae1a866993c4731652774836ac1f))
- **analytics:** comprehensive rewrite with KPI bar, energy balance chart, cost analysis, efficiency metrics ([829dffd](https://github.com/qnbs/Nexus-HEMS-Dash/commit/829dffd3b176872ab00284c4a045cace4177e68b))
- backend security hardening (v4.3.0) ([a69fe78](https://github.com/qnbs/Nexus-HEMS-Dash/commit/a69fe783b7059671aa5a03a870c52d4279f625c7))
- BYOK AI system with AES-GCM 256-bit encrypted key storage ([7f354b6](https://github.com/qnbs/Nexus-HEMS-Dash/commit/7f354b668a3c303e41a327f67aca043f4e347641))
- Cerbo GX MK2 + RPi integration guide, gateway selector, full i18n ([e58b2b9](https://github.com/qnbs/Nexus-HEMS-Dash/commit/e58b2b9289639af4bc441dba9f2c7c160a634a2f))
- Complete Feature Suite v2.1.0 - All 8 Advanced Features Implemented ([8494ae1](https://github.com/qnbs/Nexus-HEMS-Dash/commit/8494ae1491b30f61064e218cb027f36c4064a7bb))
- complete UI/UX transformation to unified command center ([b353ea7](https://github.com/qnbs/Nexus-HEMS-Dash/commit/b353ea7f1793218ea5483c9a4b779f7e07ce1057))
- Comprehensive PWA Enhancement with State-of-the-Art Features ([6fdd96c](https://github.com/qnbs/Nexus-HEMS-Dash/commit/6fdd96ca12871ad5325605ee487ed53e10262695))
- comprehensive Settings/Help rewrite, PWA enhancements, UI/UX polish ([a188dc8](https://github.com/qnbs/Nexus-HEMS-Dash/commit/a188dc80412c2b20d6f693dcd104505513db59be))
- **consumption:** comprehensive consumer analysis with charts, costs & load shifting ([dd8c3a1](https://github.com/qnbs/Nexus-HEMS-Dash/commit/dd8c3a18da6e86c1b0290c1230b694360b8e8d7c))
- **db:** add Dexie.js IndexedDB migration safety with upgrade handlers ([6ce2068](https://github.com/qnbs/Nexus-HEMS-Dash/commit/6ce20689272330a91552bf89e7a98c535fe16f0f))
- deepen pages & features — dynamic pricing, CO₂, offline voice ([dbc2bff](https://github.com/qnbs/Nexus-HEMS-Dash/commit/dbc2bffd06d8c547174cb49cfacd8de531e521e6))
- demo data, KNX floorplan, AI acknowledgments ([f3426be](https://github.com/qnbs/Nexus-HEMS-Dash/commit/f3426be2c7b425b29dfc0e88a05e0a3737ee12cd))
- Deployment & Monitoring – Docker-Compose, Prometheus, Tauri Auto-Update ([ebf4d86](https://github.com/qnbs/Nexus-HEMS-Dash/commit/ebf4d86d31482d259890fb0ebcd21a65ca68897f))
- deployment, devops & monitoring (8.1-8.5) ([45a2908](https://github.com/qnbs/Nexus-HEMS-Dash/commit/45a29081d2c53661b2f029090e49521a7c13d0dc))
- emhass/openems/evcc-inspired hems expansion ([0886cb3](https://github.com/qnbs/Nexus-HEMS-Dash/commit/0886cb348e1663469f4145d0bbc766c876a47e98))
- **energy-flow:** comprehensive page rewrite + fix i18n key mismatch ([75ad9c1](https://github.com/qnbs/Nexus-HEMS-Dash/commit/75ad9c184516487d43bb693e973be10f45afd837))
- **ev:** enhance EVPage — charge source donut, weekly stats, efficiency metrics, departure planner with schedule, ProtocolRow i18n fix ([91f01f6](https://github.com/qnbs/Nexus-HEMS-Dash/commit/91f01f64e11b215db946df4765c9d6ef96254d85))
- extend Service Worker runtime caching for all APIs ([d54d9ed](https://github.com/qnbs/Nexus-HEMS-Dash/commit/d54d9edf6ea3a6c193176879c7fcca05422883dc))
- **floorplan:** room energy donut, air quality panel, temp comparison bars, KNX activity log ([249641e](https://github.com/qnbs/Nexus-HEMS-Dash/commit/249641ec31ef3005fb6b15dcf8e9d05f14877369))
- full performance optimization setup ([b981631](https://github.com/qnbs/Nexus-HEMS-Dash/commit/b9816314c635d3a996cf30775c9b9fc5d3f4c923))
- historical analytics + influxDB/prometheus integration ([c4b869c](https://github.com/qnbs/Nexus-HEMS-Dash/commit/c4b869c90d2349cdb2c8457915540daf674a397a))
- Historical Analytics + ML-Forecast + CO₂ Reports (Maßnahme 4.3) ([3de254f](https://github.com/qnbs/Nexus-HEMS-Dash/commit/3de254f44e6cecfa1cce9c5feb9ed7b1fc0cb875))
- **home:** comprehensive HomePage rewrite — system health banner, energy balance strip, today's highlights, load breakdown, enhanced KPI cards with hover chevron ([16fe0bd](https://github.com/qnbs/Nexus-HEMS-Dash/commit/16fe0bdd50e907c67431ec1f82bd2449adb2716c))
- Initialize Nexus-HEMS Dash project structure ([6b0879f](https://github.com/qnbs/Nexus-HEMS-Dash/commit/6b0879f1fe4166a9b108989ab2f25208dfddef8c))
- mobile native-app + multi-tariff + dynamic grid fees ([1e585a9](https://github.com/qnbs/Nexus-HEMS-Dash/commit/1e585a93c917f604e54c6a8eb45018c1d984564a))
- **monitoring:** comprehensive page rewrite + fix analytics mobile overflow ([47e8d08](https://github.com/qnbs/Nexus-HEMS-Dash/commit/47e8d081c1b8da42deb30ef6fc65a7e305617ac8))
- Multi-User Auth + Shareable QR-Links (Maßnahme 4.2) ([3324d4c](https://github.com/qnbs/Nexus-HEMS-Dash/commit/3324d4c3aa04d6002422508ea5019096f4ee0e44))
- **navigation:** comprehensive cross-referencing system with PageCrossLinks ([95282ff](https://github.com/qnbs/Nexus-HEMS-Dash/commit/95282ffb2e5a85ce997335ae1c220cf08be168d3))
- Nexus HEMS Dashboard v2.0.0 - Production Ready ([bf79310](https://github.com/qnbs/Nexus-HEMS-Dash/commit/bf7931080e644531f28aedf947534ccff746a9c9))
- optimize header/title bar for mobile — modern UX overhaul ([af4e6fe](https://github.com/qnbs/Nexus-HEMS-Dash/commit/af4e6fe0f7bf549338922db321bf5e0e5881e4a4))
- plugin system + 5 contrib adapters vollständig integriert (v4.5.0) ([b8de32a](https://github.com/qnbs/Nexus-HEMS-Dash/commit/b8de32ad6355c0d66a356f80ab1820da2865998c))
- **production:** comprehensive ProductionPage rewrite — solar ring gauge, 6 KPI cards, 24h production curve, PV distribution pie, system specs panel, irradiance/PR indicator ([4117b11](https://github.com/qnbs/Nexus-HEMS-Dash/commit/4117b11dedfed775a8f9d3fdc707efed41e16038))
- Prometheus/Grafana monitoring, EEBUS SPINE/SHIP, OceanDeep default, fix all TS errors ([0b29839](https://github.com/qnbs/Nexus-HEMS-Dash/commit/0b298394ac8435061245adaed8824e204f8fc35b))
- **protocols:** real protocol implementations (mock → production) ([27df052](https://github.com/qnbs/Nexus-HEMS-Dash/commit/27df05291e7fc83d8241b3fb414643e04d6bc196))
- **readme:** dynamic badges + settings deep-linking + audit ([90c8336](https://github.com/qnbs/Nexus-HEMS-Dash/commit/90c833622144e025d4933984b7f64d43f32ea0b3))
- replace express-validator with Zod schema validation ([ae6b57d](https://github.com/qnbs/Nexus-HEMS-Dash/commit/ae6b57dd108fd3758beaa5bd6d7488651b69b512))
- **robustness:** exponential backoff + jitter + navigator.onLine + Web Worker + per-adapter metrics + useShallow ([2db6426](https://github.com/qnbs/Nexus-HEMS-Dash/commit/2db64266f005690c4689412d933ac79d3b2f4708))
- **safety:** critical fail-safe layer for hardware command control ([adf25b4](https://github.com/qnbs/Nexus-HEMS-Dash/commit/adf25b4e37f68ca11d32157f0be9027ac4ea8caf))
- **security:** BYOK vault + per-adapter encrypted config + Helmet + mTLS schemas ([c39e1b7](https://github.com/qnbs/Nexus-HEMS-Dash/commit/c39e1b7b4b6ecf232b6439431cee04b3c51e6c63))
- sentry + error boundaries + prometheus monitoring ([7664988](https://github.com/qnbs/Nexus-HEMS-Dash/commit/76649888f9bed640aafb8fc954566bbc1ae3dc9f))
- **settings:** add accessibility, location, alert thresholds, quiet hours, dashboard prefs ([6487ac9](https://github.com/qnbs/Nexus-HEMS-Dash/commit/6487ac995a94c1d8981fcfa7cab3ce8cd9f33728))
- **settings:** add Controllers & MPC tab, update page-relations, fix version ([76baf8a](https://github.com/qnbs/Nexus-HEMS-Dash/commit/76baf8a23217d2c72d21f0389bb6e630938e9bc0))
- **storage:** comprehensive battery management page with SoC chart, strategy selector, safety limits ([7e28fcc](https://github.com/qnbs/Nexus-HEMS-Dash/commit/7e28fccf5d2846d0dd04779b66afd7bf98318394))
- storybook + chromatic CI, docs, semantic-release, i18n inspector ([0ba77ab](https://github.com/qnbs/Nexus-HEMS-Dash/commit/0ba77ab4034893a542d57ecfc7676d61ecdce50a))
- **tariffs:** comprehensive TariffsPage rewrite with price forecasting, tariff comparison, optimal windows, provider config, cost analysis & price alerts ([c40889a](https://github.com/qnbs/Nexus-HEMS-Dash/commit/c40889a1695fa80777da09acb7a9537de9d3425a))
- Tauri Mobile + Push Notifications (EV ready, Tariff spike) ([9ae9dbc](https://github.com/qnbs/Nexus-HEMS-Dash/commit/9ae9dbc851028614bf2d7c197242dd2a8cbaaa57))
- **ui:** aria-live sankey, high-contrast, reduced-motion, a11y tests ([72f9c30](https://github.com/qnbs/Nexus-HEMS-Dash/commit/72f9c301269c87c95ed8923116389dadd22cbff1))
- **ui:** comprehensive mobile header with live energy status bar ([2607c5c](https://github.com/qnbs/Nexus-HEMS-Dash/commit/2607c5c08fc142a9fb57200643dd08c368fca2ba))
- **ui:** refined visual design system with advanced micro-interactions ([e6b9129](https://github.com/qnbs/Nexus-HEMS-Dash/commit/e6b9129ff70c61f34739b412fbb83cbaed9d1cef))
- v3.0.0 - Multi-Page Architecture with 11 lazy-loaded routes ([0916183](https://github.com/qnbs/Nexus-HEMS-Dash/commit/091618376cee109750c1489b6153605e2dd72b38))
- v4.0.0 — PDF export fix, PWA icons, onboarding & production polish ([a8a4142](https://github.com/qnbs/Nexus-HEMS-Dash/commit/a8a4142a9e8e43a4479f8bd97b91ebc43cd2a9ec))
- web workers for D3-Sankey & AI via Comlink ([7680849](https://github.com/qnbs/Nexus-HEMS-Dash/commit/76808495ced6a958e45fc4b4025809de9b05ba3b))

### 🐛 Bug Fixes

- **a11y:** resolve all E2E accessibility violations for green CI ([9f4f91f](https://github.com/qnbs/Nexus-HEMS-Dash/commit/9f4f91fbd8cd9d6e810fcdef68a3f4c6ac29c23b)), closes [#64748b](https://github.com/qnbs/Nexus-HEMS-Dash/issues/64748b) [#8896b0](https://github.com/qnbs/Nexus-HEMS-Dash/issues/8896b0) [#94a3b8](https://github.com/qnbs/Nexus-HEMS-Dash/issues/94a3b8) [#64748b](https://github.com/qnbs/Nexus-HEMS-Dash/issues/64748b) [#94a3b8](https://github.com/qnbs/Nexus-HEMS-Dash/issues/94a3b8)
- AI settings breadcrumb i18n error — key 'ai' returned object instead of string ([3fe7ef9](https://github.com/qnbs/Nexus-HEMS-Dash/commit/3fe7ef9872d6363892f8c3e8bbef40374c9d491a))
- audit — i18n keys, missing nav entries, legacy redirects, dead refs ([f45d921](https://github.com/qnbs/Nexus-HEMS-Dash/commit/f45d92154f671d7ce28724b46294fa94f92e5a0e))
- audit & harden all tests, fix CI, update badges ([3599ecf](https://github.com/qnbs/Nexus-HEMS-Dash/commit/3599ecf2bc8ec31b40e7e38b80729b8e0d97b2cd))
- audit and harden all recent HEMS modules ([3834f90](https://github.com/qnbs/Nexus-HEMS-Dash/commit/3834f90aa680771b6f916d6081d1cf7db8c1d573))
- centralize demo data in EnergyContext, dismiss tours in E2E ([9667f28](https://github.com/qnbs/Nexus-HEMS-Dash/commit/9667f2816084080ca4d76c5c9a71df63daf3160c))
- CI adapter tests, TariffsPage crash, PWA stale cache ([cb4bad9](https://github.com/qnbs/Nexus-HEMS-Dash/commit/cb4bad9c84cd714cf680a25a5d27791f409fbb63))
- CI E2E tests — CORS, CSP, rate limiting & mobile nav timeout ([01b7ece](https://github.com/qnbs/Nexus-HEMS-Dash/commit/01b7ece6401e636b0b445b6e9a83964d4ee431a0))
- CI lint/type-check/tests, resurrect README v3.3.0, add missing standard files ([3fc716a](https://github.com/qnbs/Nexus-HEMS-Dash/commit/3fc716a79ee32ca0c35fcaab9ecb712e28a0c1e7))
- **ci+ui:** E2E test, PV-Überschuss overflow, full responsive audit ([87bcafb](https://github.com/qnbs/Nexus-HEMS-Dash/commit/87bcafbc475ea3f5472faebdb9fd52f6e4774244))
- **ci+ui:** repair E2E tests, PV-Überschuss overflow, full responsive audit ([7427974](https://github.com/qnbs/Nexus-HEMS-Dash/commit/7427974a43c9e82cc479cb54cbcf01961b6053db))
- **ci:** replace Math.random() render calls with deterministic values ([ab420d4](https://github.com/qnbs/Nexus-HEMS-Dash/commit/ab420d4754bf0e348d2c47df92c12a9b3d420002))
- **ci:** resolve build failure and E2E test failures ([53b3055](https://github.com/qnbs/Nexus-HEMS-Dash/commit/53b3055e77d3c999eede64e2421fe05dde36d393))
- **ci:** sync package-lock.json, optimize README from 1317 to 231 lines ([0a08b41](https://github.com/qnbs/Nexus-HEMS-Dash/commit/0a08b41a9aeb4de8fbb2d87cbc1ff57ccddd8f35))
- comprehensive audit — version sync, page-relations, i18n, nav consistency ([aa1d340](https://github.com/qnbs/Nexus-HEMS-Dash/commit/aa1d340b9830a20822bf8b3bc6de8e8f8db0c817))
- critical dashboard crash - Floorplan missing useTranslation ([1900f6b](https://github.com/qnbs/Nexus-HEMS-Dash/commit/1900f6bf4d498f8a72d689e67e2563584f97bf6a))
- **deploy:** fix GitHub Pages SPA routing & index.html ([d205e84](https://github.com/qnbs/Nexus-HEMS-Dash/commit/d205e8489638eefe29f36d5ed5fd7e8dab3b09ee))
- dereference annotated tag hashes for codeql-action and gitleaks-action ([f732af3](https://github.com/qnbs/Nexus-HEMS-Dash/commit/f732af3d2f468fa8fabe4ef89b762929563aa4bc))
- E2E language-switch + mobile-more-btn, devtools dev-only ([6ad2c13](https://github.com/qnbs/Nexus-HEMS-Dash/commit/6ad2c136f85b465202aa152812fefff8e6da1b21))
- E2E mobile-more-btn use dispatchEvent for motion compat ([6cd0b92](https://github.com/qnbs/Nexus-HEMS-Dash/commit/6cd0b922034359b8651e9d828cb013f7b6f832b8))
- **e2e:** use aria-expanded selector + networkidle for More button test ([86cec6c](https://github.com/qnbs/Nexus-HEMS-Dash/commit/86cec6cbcdff3df03324206b923fa3cb86c0bcb2))
- i18n race condition, mobile header cleanup, PWA update optimization ([f882da4](https://github.com/qnbs/Nexus-HEMS-Dash/commit/f882da45435b748ae032f6d50b4c156f390488c2))
- **i18n:** complete localization of all hardcoded strings ([6a43a6d](https://github.com/qnbs/Nexus-HEMS-Dash/commit/6a43a6dda4cba0bf347de5ade77fb218eef9561d))
- legacy redirects, crossLinks cleanup, navigation audit ([1addb8f](https://github.com/qnbs/Nexus-HEMS-Dash/commit/1addb8f7d57169af22ec1292043a9b500fab916a))
- migrate all Tailwind v4 classes to shorthand syntax + fix trusted-types ([04c279a](https://github.com/qnbs/Nexus-HEMS-Dash/commit/04c279a8b99b61b931bfe7572fa9ad7988d63ec5))
- mobile layout, accessibility settings & onboarding modal ([45b25ff](https://github.com/qnbs/Nexus-HEMS-Dash/commit/45b25fff3a371fc2e4cf196e115e010fa8047624))
- mobile navbar — remove white box on More button, fix overlay behavior ([5fd655e](https://github.com/qnbs/Nexus-HEMS-Dash/commit/5fd655e866e6e245e61a356eeaab09623c8dec2a))
- onboarding blocks app shell, EmergencyStop z-index, ErrorBoundary path ([37d7e16](https://github.com/qnbs/Nexus-HEMS-Dash/commit/37d7e16e67f89e69f01f033fb4f8281664ef64b9))
- PWA crash & complete UI/UX overhaul with state-of-the-art design ([89f00d1](https://github.com/qnbs/Nexus-HEMS-Dash/commit/89f00d19b27190263818ab9184f5f1028a50a8dc))
- PWA popup overlap, share link, add demo data ([ddd4adc](https://github.com/qnbs/Nexus-HEMS-Dash/commit/ddd4adce76e3b6eb561f83e6ce20c97685176bcb))
- pwa update tariffs crash emergency stop settings ci e2e ([9f00808](https://github.com/qnbs/Nexus-HEMS-Dash/commit/9f0080835a1f30a3c99a7d96e62d23286267fb4d))
- PWA update, TariffsPage crash, EmergencyStop, theme color, Settings, CI, E2E ([a34c0c1](https://github.com/qnbs/Nexus-HEMS-Dash/commit/a34c0c199d112a6966258f3f13efbe6adc87fff7))
- **pwa:** eliminate blank white screen on SW update + fix CI pipeline ([42583e1](https://github.com/qnbs/Nexus-HEMS-Dash/commit/42583e1aaecc56d9710df5fdae8eef2a2073d271))
- react 19 strict-mode compliance + eslint-plugin-react-compiler ([6ca4c04](https://github.com/qnbs/Nexus-HEMS-Dash/commit/6ca4c04db23e0f0137359975851ab4873cd35001))
- remove price pill from mobile header ([40b5241](https://github.com/qnbs/Nexus-HEMS-Dash/commit/40b5241680b2509700b8387d76510d2a9f49b796))
- resolve all CI failures + add pre-push stability gate ([d1bd778](https://github.com/qnbs/Nexus-HEMS-Dash/commit/d1bd778fd3b7cf9ad4b9b486999c7a7f8026d8ca))
- resolve failing CI/Scorecard/Trivy/Security workflows ([7e6895d](https://github.com/qnbs/Nexus-HEMS-Dash/commit/7e6895d08b7ad01e73ed17c0e1078c7c70ebc0ad))
- resolve OpenSSF Scorecard security alerts ([bd343bd](https://github.com/qnbs/Nexus-HEMS-Dash/commit/bd343bdde2f4d39d2a1c32b8843a352de4b7820c))
- **sankey:** add relative to container so title stays above diagram ([eb7240f](https://github.com/qnbs/Nexus-HEMS-Dash/commit/eb7240fde9ee575f6042b6c7a3967989ce3eab73))
- Use --legacy-peer-deps in deploy workflow ([2b0e56c](https://github.com/qnbs/Nexus-HEMS-Dash/commit/2b0e56cde48da1d0ba5050d014757047ddcfcf48))

### ⚡ Performance

- **build:** lazy-load locales & Onboarding, fix CSS warning ([5b6446d](https://github.com/qnbs/Nexus-HEMS-Dash/commit/5b6446d25af88972c17a3bf313c0a9c4b611f7c8))
- bundle optimization — manualChunks split, dynamic jsPDF, adapter isolation ([162d8e1](https://github.com/qnbs/Nexus-HEMS-Dash/commit/162d8e1829726639e288de764b685cf6cac832c0))
- lighthouse mobile edge cases — content-visibility, virtual scroll, SEO meta ([b2b76f5](https://github.com/qnbs/Nexus-HEMS-Dash/commit/b2b76f57a241e188abb71edd4b7476b8e17470bf))
- Maßnahme 3.2 — Bundle-Optimierung + Lighthouse CI ≥ 95 ([ae11111](https://github.com/qnbs/Nexus-HEMS-Dash/commit/ae11111c96e519d4aa6e7c0f58c1e0278f3653cb))
- Maßnahme 3.3 — TanStack Query + Zustand Sync optimieren ([d63e215](https://github.com/qnbs/Nexus-HEMS-Dash/commit/d63e21544ad5f155dea07841bc9f8388882252e3))
- optimize build system — code-splitting, D3 tree-shaking, lazy loading ([7010873](https://github.com/qnbs/Nexus-HEMS-Dash/commit/701087353b5950e75f3b3cc27384dca0bc27c1da))
- optimize Zustand bridge, consolidate IndexedDB, fix CI thresholds ([36a8e74](https://github.com/qnbs/Nexus-HEMS-Dash/commit/36a8e741b16385ec50cee1aa2692a19eeb6a9d5c))
- React 19 performance deep dive ([aef0ad2](https://github.com/qnbs/Nexus-HEMS-Dash/commit/aef0ad22eead8657473ce5fcd584cd5b957acc15))
- Web Worker for Sankey + useShallow selectors (Maßnahme 3.1) ([6aa6647](https://github.com/qnbs/Nexus-HEMS-Dash/commit/6aa66471ce28b30afeab1ea80337925b8609a86c))

### 🔒 Security

- comprehensive security hardening & OpenSSF Scorecard integration ([21d8375](https://github.com/qnbs/Nexus-HEMS-Dash/commit/21d83752be50be75d2a28cfcdb633e2d72b80bdf))
- fix all Trivy, CodeQL, and Scorecard alerts ([7bdc57a](https://github.com/qnbs/Nexus-HEMS-Dash/commit/7bdc57a7790c1f1f88762f9d8be99a650ce017b0)), closes [#29](https://github.com/qnbs/Nexus-HEMS-Dash/issues/29) [#3](https://github.com/qnbs/Nexus-HEMS-Dash/issues/3)
- fix cleartext storage of sensitive information (CodeQL [#1](https://github.com/qnbs/Nexus-HEMS-Dash/issues/1), [#2](https://github.com/qnbs/Nexus-HEMS-Dash/issues/2)) ([79e990f](https://github.com/qnbs/Nexus-HEMS-Dash/commit/79e990ff7f4eb0b0b23ebeaafb8405bf4334fa15))
- fix CodeQL, Semgrep, and Scorecard alerts ([#4](https://github.com/qnbs/Nexus-HEMS-Dash/issues/4)-[#28](https://github.com/qnbs/Nexus-HEMS-Dash/issues/28), [#93](https://github.com/qnbs/Nexus-HEMS-Dash/issues/93)-[#94](https://github.com/qnbs/Nexus-HEMS-Dash/issues/94)) ([85429e0](https://github.com/qnbs/Nexus-HEMS-Dash/commit/85429e04dc7b75b737a3eb2920256edac31408e5)), closes [#24](https://github.com/qnbs/Nexus-HEMS-Dash/issues/24) [#22](https://github.com/qnbs/Nexus-HEMS-Dash/issues/22) [#23](https://github.com/qnbs/Nexus-HEMS-Dash/issues/23) [#25](https://github.com/qnbs/Nexus-HEMS-Dash/issues/25) [#26](https://github.com/qnbs/Nexus-HEMS-Dash/issues/26) [#27](https://github.com/qnbs/Nexus-HEMS-Dash/issues/27) [#5](https://github.com/qnbs/Nexus-HEMS-Dash/issues/5) [#6](https://github.com/qnbs/Nexus-HEMS-Dash/issues/6)
- fix Scorecard, Trivy, and CodeQL alerts ([b13b883](https://github.com/qnbs/Nexus-HEMS-Dash/commit/b13b8830076f93aeec235bf41c919fcd122e036b))
- harden MQTT clients (Victron + KNX adapters) ([96dd014](https://github.com/qnbs/Nexus-HEMS-Dash/commit/96dd0140a240658caba2272bbc7154fbf6a8956a))
- replace jsonwebtoken with jose, add key rotation ([6c01ed4](https://github.com/qnbs/Nexus-HEMS-Dash/commit/6c01ed4d412d45d30e336ee7f1458a3bcdafbf36))

### ♿ Accessibility

- WCAG 2.2 AA audit fixes ([62aba52](https://github.com/qnbs/Nexus-HEMS-Dash/commit/62aba525c33a5c38cbc712eba167f85fb884c902))
- **wcag:** comprehensive WCAG 2.2 AA audit & fixes ([2b1c644](https://github.com/qnbs/Nexus-HEMS-Dash/commit/2b1c644a92154dc9a19b53907696dc32b8dc5757))

### ♻️ Refactoring

- **adapters:** extract BaseAdapter abstract class with built-in Circuit Breaker ([96ffd82](https://github.com/qnbs/Nexus-HEMS-Dash/commit/96ffd8263ad1bf9be3af47f713ec645535dc2a5a))
- audit cleanup — remove dead code, guard console, sync versions ([46c6350](https://github.com/qnbs/Nexus-HEMS-Dash/commit/46c6350b87f2f2e105ce38baef2cc1274fc7b486))
- **audit:** global cleanup — remove manual memoization, fix lint ([c9ff4f8](https://github.com/qnbs/Nexus-HEMS-Dash/commit/c9ff4f8be11cbf24bd0d93fa457e4cf2c9b327b2))
- model-agnostic AI, CommandHub i18n, CI fixes, app audit ([bfd092d](https://github.com/qnbs/Nexus-HEMS-Dash/commit/bfd092d485b8b43791950b1ff80a2161e267cf63))
- streamline header — remove redundant page titles, connection indicators ([a2ee4ff](https://github.com/qnbs/Nexus-HEMS-Dash/commit/a2ee4ff8102bfe8e704da397779c96842ea0f573))
- tanstack query + zustand sync — eliminate dual state ([a462aa8](https://github.com/qnbs/Nexus-HEMS-Dash/commit/a462aa844e4e5fd80bf7a55902bbf738ca6c14b8))
- **ui:** declutter interface, redesign theme system, fix e2e tests ([131721e](https://github.com/qnbs/Nexus-HEMS-Dash/commit/131721e27df4e77c73b4c7cd2d3810312f4c6d51))

# Changelog

All notable changes to **Nexus-HEMS-Dash** are documented in this file.

This changelog is automatically generated by [semantic-release](https://github.com/semantic-release/semantic-release) using [Conventional Commits](https://www.conventionalcommits.org/).

---

## [4.5.0](https://github.com/qnbs/Nexus-HEMS-Dash/releases/tag/v4.5.0) (2026-04-13)

### 🔒 Security

- Hardened OpenEMS adapter input handling (component/property validation + value sanitization)
- Tightened adapter worker URL allowlist checks with strict private IPv4 handling
- Sanitized plugin logging/event token output to reduce log-injection risk
- Added dedicated security hardening unit tests (`src/tests/security-hardening.test.ts`)

### 🏗️ Runtime & CI

- Upgraded server runtime to `express@5.x` with matching `@types/express@5.x`
- Removed deprecated `@types/express-rate-limit` stub package
- Kept Node.js 22 as production baseline across build/release paths
- Added Node.js 25 CI canary job as non-blocking forward-compatibility signal

### 🚀 Deployment

- Added manual production deploy approval gate (`approveDeploy=DEPLOY`) in deploy workflow
- Added runner compatibility check for checkout v6 requirements
- Added Helm deployment strategy controls + `revisionHistoryLimit`
- Added digest-aware Helm image rendering (`repository@sha256:...`) for immutable rollouts
- Added OCI image metadata labels to frontend/backend Docker images for traceability

### 📚 Documentation

- Updated `README.md` deployment/security/runtime baseline sections
- Updated `SECURITY.md` with runtime policy and deploy governance
- Updated `docs/Security-Architecture.md` with runtime governance and supply-chain details
- Updated `docs/Deployment-Checklist.md` with manual approval flow, digest strategy, and Helm rollback runbook

## [4.4.0](https://github.com/qnbs/Nexus-HEMS-Dash/releases/tag/v4.4.0) (2026-03-16)

### ✨ Features

- **storybook:** Storybook für alle Components + Chromatic CI-Integration
- **docs:** Security-Architecture.md, Deployment-Checklist.md, Adapter-Dev-Guide Update
- **ci:** semantic-release + automatisierter CHANGELOG + Release-Notes
- **i18n:** Deutsch-Übersetzung 100% abgedeckt + i18next-Inspector-Modus
- **pwa:** PWA Update-Notification, theme_color Fix, Install-Prompt
- **adapter:** EEBUS SPINE/SHIP, Modbus SunSpec, OCPP 2.1 TypeScript-Fixes
- **settings:** EmergencyStop → Danger Zone, LanguageSwitcher → Settings
- **e2e:** Playwright-Tests für alle Hauptrouten + Accessibility

### 🐛 Bug Fixes

- PWA Update-Notification Interval-Leak behoben
- TariffsPage Crash bei fehlenden Daten (ErrorBoundary)
- PredictiveForecast Division-by-Zero Guard
- 5 TypeScript-Fehler behoben (EEBUSAdapter, ModbusSunSpec, OCPP21, command-safety)
- Settings doppelte Imports konsolidiert

### 🔒 Security

- API-Keys verschlüsselt in IndexedDB (AES-GCM)
- Security-Architecture.md Dokumentation
- Deployment-Checklist mit TLS/Reverse-Proxy/Failover

### ♿ Accessibility

- WCAG 2.2 AA Konformität
- Skip-to-Content Link, Focus-Rings, Aria-Attribute

### 🌐 Internationalization

- Deutsch-Übersetzung 100% (1680+ Keys)
- i18next-Inspector-Modus für Entwicklung
- Lazy-Loading für EN-Locale

---

> Ältere Versionen siehe [Git-History](https://github.com/qnbs/Nexus-HEMS-Dash/commits/main).
