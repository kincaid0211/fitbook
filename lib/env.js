import fs from "node:fs";

let loaded = false;

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) return null;
  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return [key, value];
}

export function loadLocalEnv() {
  if (loaded) return;
  loaded = true;

  for (const file of [".env.local", ".env"]) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      const [key, value] = parsed;
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

export function getModelConfig(override = {}) {
  loadLocalEnv();

  const preferredProvider = override.provider || (process.env.MOONSHOT_API_KEY ? "kimi" : "siliconflow");

  if (preferredProvider === "kimi" && process.env.MOONSHOT_API_KEY) {
    return {
      provider: "kimi",
      apiKey: process.env.MOONSHOT_API_KEY,
      baseUrl: override.baseUrl || process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1",
      model: override.model || process.env.KIMI_MODEL || "kimi-k2.6",
    };
  }

  if (preferredProvider === "siliconflow" && process.env.SILICONFLOW_API_KEY) {
    return {
      provider: "siliconflow",
      apiKey: process.env.SILICONFLOW_API_KEY,
      baseUrl: override.baseUrl || process.env.SILICONFLOW_BASE_URL || "https://api.siliconflow.cn/v1",
      model: override.model || process.env.SILICONFLOW_MODEL || "Pro/moonshotai/Kimi-K2.6",
    };
  }

  if (process.env.MOONSHOT_API_KEY || process.env.SILICONFLOW_API_KEY) {
    return getModelConfig({ ...override, provider: process.env.MOONSHOT_API_KEY ? "kimi" : "siliconflow" });
  }

  return null;
}

export function getZhihuSecret() {
  loadLocalEnv();
  if (process.env.ZHIHU_ACCESS_SECRET) return process.env.ZHIHU_ACCESS_SECRET;

  const localSecretPath = "note/zhihuhackathon/知乎API Key.md";
  if (fs.existsSync(localSecretPath)) {
    const value = fs.readFileSync(localSecretPath, "utf8").trim();
    return value || null;
  }

  return null;
}
