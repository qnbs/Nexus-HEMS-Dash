/**
 * Atomic settings batch: INCR version, HSET fields, XADD diff entries, trim stream.
 * ARGV[1] = entry count (N); then N × (key, valueJson, category, updatedAt);
 * ARGV[#ARGV-1] = version seed when KEYS[1] is missing; ARGV[#ARGV] = stream MAXLEN.
 */
export const APPLY_SETTINGS_BATCH_LUA = `
local maxlen = tonumber(ARGV[#ARGV])
local seed = ARGV[#ARGV - 1]
if redis.call('GET', KEYS[1]) == false then
  redis.call('SET', KEYS[1], seed)
end
local version = redis.call('INCR', KEYS[1])
local n = tonumber(ARGV[1])
local idx = 2
for _ = 1, n do
  local k = ARGV[idx]
  local v = ARGV[idx + 1]
  local cat = ARGV[idx + 2]
  local ts = ARGV[idx + 3]
  redis.call('HSET', KEYS[2], k, v)
  redis.call('XADD', KEYS[3], '*', 'key', k, 'value', v, 'category', cat, 'updatedAt', ts, 'version', tostring(version))
  idx = idx + 4
end
redis.call('XTRIM', KEYS[3], 'MAXLEN', maxlen)
return version
`;
