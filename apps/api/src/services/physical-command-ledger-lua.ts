/**
 * Atomically claim a new physical-command pending replay in Redis.
 * KEYS[1] = command record key, KEYS[2] = idempotency alias key.
 * ARGV[1] = pending JSON payload, ARGV[2] = TTL seconds, ARGV[3] = commandId (alias value).
 * Returns: 0 = both keys set; 1 = command key already held; 2 = idempotency alias already held.
 */
export const BEGIN_PHYSICAL_COMMAND_REPLAY_LUA = `
local ttl = tonumber(ARGV[2])
if redis.call('GET', KEYS[2]) then
  return 2
end
if redis.call('GET', KEYS[1]) then
  return 1
end
redis.call('SET', KEYS[1], ARGV[1], 'EX', ttl)
redis.call('SET', KEYS[2], ARGV[3], 'EX', ttl)
return 0
`;
