import { describe, expect, it } from 'vitest';
import { assertCommandRiskMapExhaustive, COMMAND_RISK_MAP } from '../core/command-risk-map';
import { commandSchemas } from '../core/command-safety';

describe('COMMAND_RISK_MAP', () => {
  it('covers every commandSchemas entry', () => {
    const types = Object.keys(commandSchemas) as (keyof typeof commandSchemas)[];
    assertCommandRiskMapExhaustive(types);
    expect(Object.keys(COMMAND_RISK_MAP).sort()).toEqual(types.sort());
  });

  it('marks grid limit as admin_grid', () => {
    expect(COMMAND_RISK_MAP.SET_GRID_LIMIT.risk).toBe('admin_grid');
  });
});
