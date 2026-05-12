const store = new Map();

export function getCache(key) {
  const item = store.get(key);
  if (!item) return null;
  if (item.expiresAt && item.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return item.value;
}

export function setCache(key, value, ttlMs = 10 * 60 * 1000) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
  return value;
}
