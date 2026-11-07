/**
 * Atomically claim a new physical-command pending replay in Redis.
 * KEYS[1] = command record key, KEYS[2] = idempotency alias key.
 * ARGV[1] = pending JSON payload, ARGV[2] = TTL seconds, ARGV[3] = commandId (alias value).
 * Returns: 0 = both keys set; 1 = command key already held; 2 = idempotency alias already held;
 *          3 = SET failed after checks (compensating DEL on partial write).
 */
export const BEGIN_PHYSICAL_COMMAND_REPLAY_LUA = `
local ttl = tonumber(ARGV[2])
if ttl == nil or ttl <= 0 then
  return 3
end
if redis.call('GET', KEYS[2]) then
  return 2
end
if redis.call('GET', KEYS[1]) then
  return 1
end
local okRecord = pcall(function()
  return redis.call('SET', KEYS[1], ARGV[1], 'EX', ttl)
end)
if not okRecord then
  return 3
end
local okAlias = pcall(function()
  return redis.call('SET', KEYS[2], ARGV[3], 'EX', ttl)
end)
if not okAlias then
  redis.call('DEL', KEYS[1])
  return 3
end
return 0
`;

/**
 * Atomically transition pending → terminal when the stored JSON still matches the caller snapshot.
 * KEYS[1] = command record, KEYS[2] = idempotency alias.
 * ARGV[1] = terminal JSON, ARGV[2] = expected pending JSON (byte-equal), ARGV[3] = TTL seconds,
 * ARGV[4] = commandId (alias must hold this value).
 * Returns: 0 = updated; 1 = snapshot mismatch or not pending; 2 = record missing.
 */
export const COMPLETE_PHYSICAL_COMMAND_REPLAY_LUA = `
local cur = redis.call('GET', KEYS[1])
if cur == false then
  return 2
end
if cur ~= ARGV[2] then
  return 1
end
local aliasVal = redis.call('GET', KEYS[2])
if aliasVal == false or aliasVal ~= ARGV[4] then
  return 1
end
local ttl = tonumber(ARGV[3])
if ttl == nil or ttl <= 0 then
  return 1
end
redis.call('SET', KEYS[1], ARGV[1], 'EX', ttl)
redis.call('SET', KEYS[2], ARGV[4], 'EX', ttl)
return 0
`;

/**
 * Atomically drop pending claim when the stored JSON still matches the caller snapshot.
 * KEYS[1] = command record, KEYS[2] = idempotency alias.
 * ARGV[1] = expected pending JSON (byte-equal), ARGV[2] = commandId (alias must hold this value).
 * Returns: 0 = deleted; 1 = snapshot mismatch or not pending; 2 = record missing.
 */
export const ABANDON_PHYSICAL_COMMAND_PENDING_LUA = `
local cur = redis.call('GET', KEYS[1])
if cur == false then
  return 2
end
if cur ~= ARGV[1] then
  return 1
end
local aliasVal = redis.call('GET', KEYS[2])
if aliasVal == false or aliasVal ~= ARGV[2] then
  return 1
end
redis.call('DEL', KEYS[1])
redis.call('DEL', KEYS[2])
return 0
`;

/**
 * Atomically transition pending → unknown when record and alias ownership match.
 * ARGV[1] = unknown JSON, ARGV[2] = expected pending JSON, ARGV[3] = TTL seconds, ARGV[4] = commandId.
 * Returns: 0 = updated; 1 = mismatch; 2 = record missing.
 */
export const MARK_PHYSICAL_COMMAND_UNKNOWN_LUA = `
local cur = redis.call('GET', KEYS[1])
if cur == false then
  return 2
end
if cur ~= ARGV[2] then
  return 1
end
local aliasVal = redis.call('GET', KEYS[2])
if aliasVal == false or aliasVal ~= ARGV[4] then
  return 1
end
local ttl = tonumber(ARGV[3])
if ttl == nil or ttl <= 0 then
  return 1
end
redis.call('SET', KEYS[1], ARGV[1], 'EX', ttl)
redis.call('SET', KEYS[2], ARGV[4], 'EX', ttl)
return 0
`;
