#!/usr/bin/env node
/**
 * Gitleaks integrity verification (#432). Uses a generated config identical to
 * `.gitleaks.toml` except the canary fixture path exclusion is removed.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  applyTemplate,
  probeMarker,
  syntheticAwattarToken,
  syntheticGroqKey,
  syntheticMqttPassword,
  syntheticMqttPasswordWithPlaceholder,
  syntheticTibberToken,
} from './gitleaks-canary/runtime-synthetic.mjs';

const repoRoot = process.cwd();
const mainConfigPath = path.join(repoRoot, '.gitleaks.toml');
const canaryDir = path.join(repoRoot, 'scripts/gitleaks-canary');
const probeRoot = path.join(repoRoot, '.cache/gitleaks-probes');
const integrityConfigPath = path.join(probeRoot, '.gitleaks-integrity.generated.toml');

/** Pin matches CI wrapper / security-full probe install. */
const GITLEAKS_DOCKER = 'ghcr.io/gitleaks/gitleaks:v8.22.1';

/** Run a subprocess from the repo root and return spawnSync output. */
function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
}

/** Write integrity config with canary path allowlist removed for probe scans. */
function ensureIntegrityConfig() {
  fs.mkdirSync(probeRoot, { recursive: true });
  const main = fs.readFileSync(mainConfigPath, 'utf8');
  const withoutCanaryPath = main.replace(
    /\n\s*'''scripts\/gitleaks-canary\/''',\n/,
    '\n',
  );
  if (withoutCanaryPath === main) {
    console.error('Integrity config generation failed: canary path entry not found.');
    process.exit(1);
  }
  fs.writeFileSync(integrityConfigPath, withoutCanaryPath);
}

/** Map a host path under the repo to the `/repo` bind-mount path used in Docker. */
function hostToContainerSource(hostPath) {
  const resolved = path.resolve(hostPath);
  const root = path.resolve(repoRoot);
  if (resolved === root) return '/repo';
  if (resolved.startsWith(`${root}${path.sep}`)) {
    return `/repo${resolved.slice(root.length)}`;
  }
  return resolved;
}

/** Prefer local `gitleaks`; fall back to Docker; skip locally when neither exists. */
function resolveGitleaksRunner() {
  const local = run('gitleaks', ['version'], { stdio: 'pipe' });
  if (!local.error && local.status === 0) {
    return { mode: 'local' };
  }
  const docker = run('docker', ['version'], { stdio: 'pipe' });
  if (!docker.error && docker.status === 0) {
    return { mode: 'docker' };
  }
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.error('Gitleaks CLI and Docker unavailable — cannot run integrity probes.');
    process.exit(1);
  }
  console.warn('Skipping integrity checks (no gitleaks/docker locally).');
  process.exit(0);
}

const gitleaksRunner = resolveGitleaksRunner();

/** Log the selected Gitleaks runner and version for CI audit trails. */
function logRunnerVersion() {
  if (gitleaksRunner.mode === 'local') {
    const version = run('gitleaks', ['version'], { stdio: 'pipe' });
    if (!version.error && version.status === 0) {
      console.log(`Gitleaks runner: local ${version.stdout.trim()}`);
    }
  } else {
    const version = run(
      'docker',
      ['run', '--rm', GITLEAKS_DOCKER, 'version'],
      { stdio: 'pipe' },
    );
    if (!version.error && version.status === 0) {
      console.log(`Gitleaks runner: docker ${GITLEAKS_DOCKER} (${version.stdout.trim()})`);
    }
  }
}

logRunnerVersion();

/** Run Gitleaks against `sourcePath` and parse the JSON report at `reportPath`. */
function gitleaksReport(sourcePath, reportPath) {
  const resolvedSource = path.resolve(sourcePath);
  const resolvedReport = path.resolve(reportPath);
  fs.mkdirSync(path.dirname(resolvedReport), { recursive: true });

  const args = [
    'detect',
    '--source',
    resolvedSource,
    '--config',
    integrityConfigPath,
    '--no-git',
    '--report-format',
    'json',
    '--report-path',
    resolvedReport,
    '--exit-code',
    '1',
  ];

  const runner = gitleaksRunner;
  let status;
  if (runner.mode === 'local') {
    const result = run('gitleaks', args, { stdio: 'pipe' });
    if (result.error) {
      console.error(result.error.message);
      process.exit(1);
    }
    status = result.status ?? 1;
  } else {
    const containerReport = hostToContainerSource(resolvedReport);
    const dockerArgs = [
      'detect',
      '--source',
      hostToContainerSource(resolvedSource),
      '--config',
      hostToContainerSource(integrityConfigPath),
      '--no-git',
      '--report-format',
      'json',
      '--report-path',
      containerReport,
      '--exit-code',
      '1',
    ];
    const result = run(
      'docker',
      ['run', '--rm', '-v', `${repoRoot}:/repo`, '-w', '/repo', GITLEAKS_DOCKER, ...dockerArgs],
      { stdio: 'pipe' },
    );
    if (result.error) {
      console.error(result.error.message);
      process.exit(1);
    }
    status = result.status ?? 1;
  }

  if (!fs.existsSync(resolvedReport)) {
    console.error('Gitleaks did not produce a JSON report (scanner error).');
    process.exit(1);
  }

  let findings;
  try {
    findings = JSON.parse(fs.readFileSync(resolvedReport, 'utf8'));
  } catch {
    console.error('Failed to parse Gitleaks JSON report.');
    process.exit(1);
  }

  if (!Array.isArray(findings)) {
    console.error('Unexpected Gitleaks JSON shape.');
    process.exit(1);
  }

  return { status, findings };
}

/** Assert Gitleaks findings match expected rule IDs and optional probe markers. */
function expectFinding(label, sourceDir, expected) {
  const reportFile = path.join(sourceDir, '.gitleaks-report.json');
  const { status, findings } = gitleaksReport(sourceDir, reportFile);
  if (status === 0 && expected.length > 0) {
    console.error(`${label}: expected leaks but scan was clean.`);
    process.exit(1);
  }
  if (status !== 0 && expected.length === 0) {
    console.error(`${label}: expected clean scan but Gitleaks exited ${status}.`);
    console.error(JSON.stringify(findings, null, 2));
    process.exit(1);
  }

  for (const exp of expected) {
    const allowedRules = Array.isArray(exp.ruleId) ? exp.ruleId : [exp.ruleId];
    const hit = findings.some((f) => {
      const file = (f.File ?? f.file ?? '').replaceAll('\\', '/');
      const rule = f.RuleID ?? f.ruleID ?? f.RuleId ?? '';
      const matchText = `${f.Match ?? ''}${f.Secret ?? ''}`;
      const ruleOk = file.endsWith(exp.fileSuffix) && allowedRules.includes(rule);
      if (!ruleOk) return false;
      if (exp.marker && !matchText.includes(exp.marker)) return false;
      return true;
    });
    if (!hit) {
      console.error(
        `${label}: missing expected finding ${allowedRules.join('|')} in *${exp.fileSuffix}`,
      );
      console.error(JSON.stringify(findings, null, 2));
      process.exit(1);
    }
  }

  if (expected.length === 0 && findings.length > 0) {
    console.error(`${label}: unexpected findings:`);
    console.error(JSON.stringify(findings, null, 2));
    process.exit(1);
  }

  console.log(`${label}: OK (${expected.length ? `${expected.length} expected finding(s)` : 'clean'})`);
}

/** Read a canary template file from `scripts/gitleaks-canary/`. */
function readTemplate(name) {
  const filePath = path.join(canaryDir, name);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing canary template: ${name}`);
    process.exit(1);
  }
  return fs.readFileSync(filePath, 'utf8');
}

/** Read a static canary fixture from `scripts/gitleaks-canary/`. */
function readCanary(name) {
  const filePath = path.join(canaryDir, name);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing canary fixture: ${name}`);
    process.exit(1);
  }
  return fs.readFileSync(filePath, 'utf8');
}

/** Create a unique directory under `.cache/gitleaks-probes/` for an isolated probe. */
function freshProbeDir(prefix) {
  fs.mkdirSync(probeRoot, { recursive: true });
  return fs.mkdtempSync(path.join(probeRoot, prefix));
}

if (!fs.existsSync(canaryDir)) {
  console.error('Missing scripts/gitleaks-canary/ directory.');
  process.exit(1);
}

ensureIntegrityConfig();

const probeIds = {
  docs: 'DOCS_TIBBER',
  eebus: 'EEBUS_MQTT',
  groq: 'GROQ_KEY',
  tibberNear: 'TIBBER_NEAR',
  mqttMixed: 'MQTT_MIXED',
  awattar: 'AWATTAR_KEY',
  mqttPlaceholder: 'MQTT_PLACEHOLDER',
};

const synth = {
  docsToken: syntheticTibberToken(probeIds.docs),
  eebusMqtt: syntheticMqttPassword(probeIds.eebus, { includeExampleSubstring: true }),
  groqKey: syntheticGroqKey(probeIds.groq),
  tibberNearToken: syntheticTibberToken(probeIds.tibberNear),
  mqttMixedPassword: syntheticMqttPassword(probeIds.mqttMixed),
  awattarToken: syntheticAwattarToken(probeIds.awattar),
  mqttPlaceholderPassword: syntheticMqttPasswordWithPlaceholder(probeIds.mqttPlaceholder),
};

// Positive: docs path restored (no whole-file ignore) + Tibber canary
const docsProbe = freshProbeDir('docs-');
const docsRel = path.join(docsProbe, 'docs', 'API-Reference.md');
fs.mkdirSync(path.dirname(docsRel), { recursive: true });
fs.writeFileSync(
  docsRel,
  `${fs.readFileSync(path.join(repoRoot, 'docs/API-Reference.md'), 'utf8')}\n${applyTemplate(readTemplate('docs-api-append.template'), {
    PROBE_TIBBER_VAL: synth.docsToken,
  })}`,
);
expectFinding('Docs API-Reference Tibber probe', docsProbe, [
  {
    fileSuffix: 'docs/API-Reference.md',
    ruleId: 'tibber-api-token',
    marker: probeMarker(probeIds.docs),
  },
]);

// Positive: EEBUS test path + MQTT substring must still detect
const eebusProbe = freshProbeDir('eebus-');
const eebusRel = path.join(
  eebusProbe,
  'apps/api/src/protocols/eebus/EebusProtocolAdapter.test.ts',
);
fs.mkdirSync(path.dirname(eebusRel), { recursive: true });
fs.writeFileSync(
  eebusRel,
  `${fs.readFileSync(path.join(repoRoot, 'apps/api/src/protocols/eebus/EebusProtocolAdapter.test.ts'), 'utf8')}\n${applyTemplate(readTemplate('eebus-test-append.template'), {
    PROBE_MQTT_VAL: synth.eebusMqtt,
  })}`,
);
expectFinding('EEBUS test MQTT probe', eebusProbe, [
  {
    fileSuffix: 'apps/api/src/protocols/eebus/EebusProtocolAdapter.test.ts',
    ruleId: 'mqtt-credentials',
    marker: probeMarker(probeIds.eebus),
  },
]);

// Positive: Groq API marker in isolated copy (not under canary allowlist path)
const openAiProbe = freshProbeDir('openai-');
fs.writeFileSync(path.join(openAiProbe, 'probe.env'), `${synth.groqKey}\n`);
expectFinding('Groq API marker probe', openAiProbe, [
  {
    fileSuffix: 'probe.env',
    ruleId: 'groq-api-key',
    marker: probeMarker(probeIds.groq).replaceAll('_', 'X'),
  },
]);

// Negative: HA colon placeholder
const haSafeProbe = freshProbeDir('ha-safe-');
fs.writeFileSync(
  path.join(haSafeProbe, 'HaSafe.ts'),
  readCanary('ha-mqtt-placeholder.fixture'),
);
expectFinding('HA mqttPassword colon placeholder', haSafeProbe, []);

// Negative: EEBUS form placeholder PEM syntax
const eebusSafeProbe = freshProbeDir('eebus-safe-');
fs.writeFileSync(
  path.join(eebusSafeProbe, 'AdapterConfigEebusFields.tsx'),
  readCanary('eebus-form-placeholder.fixture'),
);
expectFinding('EEBUS placeholder= PEM syntax', eebusSafeProbe, []);

// Positive: Tibber marker near placeholder comment text (#432 residual)
const tibberNearProbe = freshProbeDir('tibber-near-');
fs.writeFileSync(
  path.join(tibberNearProbe, 'tibber.env'),
  applyTemplate(readTemplate('tibber-near-placeholder.template'), {
    PROBE_TIBBER_VAL: synth.tibberNearToken,
  }),
);
expectFinding('Tibber marker near placeholder text', tibberNearProbe, [
  {
    fileSuffix: 'tibber.env',
    ruleId: 'tibber-api-token',
    marker: probeMarker(probeIds.tibberNear),
  },
]);

// Negative: Tibber-shaped placeholder assignment stays clean
const tibberSafeProbe = freshProbeDir('tibber-safe-');
fs.writeFileSync(
  path.join(tibberSafeProbe, 'tibber.env'),
  readCanary('tibber-placeholder-negative.env'),
);
expectFinding('Tibber your_ placeholder assignment', tibberSafeProbe, []);

// Positive: mqttUser on same line must not suppress mqttPassword (#432)
const mqttMixedProbe = freshProbeDir('mqtt-mixed-');
fs.writeFileSync(
  path.join(mqttMixedProbe, 'Broker.ts'),
  applyTemplate(readTemplate('mqtt-mixed-line.template'), {
    PROBE_MQTT_VAL: synth.mqttMixedPassword,
  }),
);
expectFinding('MQTT mixed-line password probe', mqttMixedProbe, [
  {
    fileSuffix: 'Broker.ts',
    ruleId: 'mqtt-credentials',
    marker: probeMarker(probeIds.mqttMixed),
  },
]);

// Positive: aWATTar token (exact rule ID)
const awattarProbe = freshProbeDir('awattar-');
fs.writeFileSync(
  path.join(awattarProbe, 'awattar.env'),
  applyTemplate(readTemplate('awattar-positive.template'), {
    PROBE_AWATTAR_VAL: synth.awattarToken,
  }),
);
expectFinding('aWATTar API key probe', awattarProbe, [
  {
    fileSuffix: 'awattar.env',
    ruleId: 'awattar-api-key',
    marker: probeMarker(probeIds.awattar),
  },
]);

const awattarSafeProbe = freshProbeDir('awattar-safe-');
fs.writeFileSync(
  path.join(awattarSafeProbe, 'awattar.env'),
  readCanary('awattar-placeholder-negative.env'),
);
expectFinding('aWATTar your_ placeholder assignment', awattarSafeProbe, []);

// Positive: mqttPassword containing literal placeholder substring
const mqttPlaceholderProbe = freshProbeDir('mqtt-placeholder-');
fs.writeFileSync(
  path.join(mqttPlaceholderProbe, 'mqtt.env'),
  applyTemplate(readTemplate('mqtt-placeholder-positive.template'), {
    PROBE_MQTT_VAL: synth.mqttPlaceholderPassword,
  }),
);
expectFinding('MQTT placeholder substring probe', mqttPlaceholderProbe, [
  {
    fileSuffix: 'mqtt.env',
    ruleId: 'mqtt-credentials',
    marker: probeMarker(probeIds.mqttPlaceholder),
  },
]);

console.log('Gitleaks integrity verification passed.');
