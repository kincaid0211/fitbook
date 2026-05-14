const GLOBAL_KEY = Symbol.for("feishu.localShareStore");
if (!globalThis[GLOBAL_KEY]) {
  globalThis[GLOBAL_KEY] = new Map();
}
const localShareStore = globalThis[GLOBAL_KEY];

export async function safeKvSet(key, value, opts = {}) {
  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(key, value, opts);
  } catch {
    localShareStore.set(key, value);
    // 本地开发不设置 TTL（setTimeout 最大延迟 2^31-1 ms，30 天会溢出）
  }
}

export async function safeKvGet(key) {
  try {
    const { kv } = await import("@vercel/kv");
    return await kv.get(key);
  } catch {
    return localShareStore.get(key) || null;
  }
}
