import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { invalidateExecConfigCache, runScript } from '../services/ExecService.js';

describe('ExecService', () => {
  const originalConfig = process.env.EXEC_SCRIPTS_CONFIG;

  beforeEach(() => {
    invalidateExecConfigCache();
    process.env.EXEC_SCRIPTS_CONFIG = JSON.stringify({
      scripts: {
        read_meter: {
          command: '/bin/echo',
          commandArgs: ['{"readings":[{"metric":"POWER_W","value":1500,"role":"pv"}]}'],
          allowedArgs: ['--device'],
          timeoutMs: 1000,
        },
      },
    });
  });

  afterEach(() => {
    invalidateExecConfigCache();
    if (originalConfig === undefined) delete process.env.EXEC_SCRIPTS_CONFIG;
    else process.env.EXEC_SCRIPTS_CONFIG = originalConfig;
  });

  it('rejects unknown script IDs', async () => {
    await expect(runScript({ scriptId: 'not_whitelisted' })).rejects.toThrow(/whitelist/);
  });

  it('rejects unsafe argument keys', async () => {
    await expect(runScript({ scriptId: 'read_meter', args: { '$(rm -rf)': 'x' } })).rejects.toThrow(
      /Unsafe argument key/,
    );
  });

  it('rejects disallowed argument keys for a script', async () => {
    await expect(runScript({ scriptId: 'read_meter', args: { '--port': '502' } })).rejects.toThrow(
      /not allowed/,
    );
  });
});
