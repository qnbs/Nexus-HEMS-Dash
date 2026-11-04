import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertProxyAddrSupplyChain,
  compareSemver,
  maxResolvedProxyAddrVersion,
  readProxyAddrSupplyChainFromRepo,
  semverAtLeast,
} from './proxy-addr-supply-chain.mjs';

describe('proxy-addr-supply-chain', () => {
  it('orders semver for lockfile resolution', () => {
    assert.ok(compareSemver('2.0.8', '2.0.7') > 0);
    assert.ok(semverAtLeast('2.0.8', '2.0.8'));
    assert.ok(!semverAtLeast('2.0.7', '2.0.8'));
  });

  it('finds highest proxy-addr version in lockfile snippet', () => {
    const snippet = ['  proxy-addr@2.0.7:', '  proxy-addr@2.0.8:'].join('\n');
    assert.equal(maxResolvedProxyAddrVersion(snippet), '2.0.8');
  });

  it('repo lockfile satisfies P0 proxy-addr floor (#386 / #403)', () => {
    const chain = readProxyAddrSupplyChainFromRepo();
    assert.doesNotThrow(() => assertProxyAddrSupplyChain(chain));
    assert.equal(chain.lockVersion, '2.0.8');
  });
});
