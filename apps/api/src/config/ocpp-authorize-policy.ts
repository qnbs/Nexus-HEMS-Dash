/**
 * OCPP Authorize decision — fail-closed in live mode unless explicitly allowlisted.
 */

import {
  extractOcppIdToken,
  type OcppAuthorizeDecision,
  resolveOcppAuthorizeDecision,
} from '@nexus-hems/shared-types';
import { getEffectiveAdapterMode } from './adapter-mode.js';

export type { OcppAuthorizeDecision };
export { extractOcppIdToken };

function readAllowlist(env: NodeJS.ProcessEnv): Set<string> {
  return new Set(
    (env.OCPP_AUTHORIZE_ID_TOKENS ?? process.env.OCPP_AUTHORIZE_ID_TOKENS ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  );
}

export function resolveInboundOcppAuthorize(
  payload: Record<string, unknown>,
  env: NodeJS.ProcessEnv = process.env,
): OcppAuthorizeDecision {
  const mode = getEffectiveAdapterMode(env);
  return resolveOcppAuthorizeDecision(mode, payload, readAllowlist(env));
}

export function idTokenInfoStatus(
  decision: OcppAuthorizeDecision,
): 'Accepted' | 'Invalid' | 'Blocked' {
  return decision;
}
