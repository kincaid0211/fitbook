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

  if (process.env.SILICONFLOW_API_KEY) {
    return {
      provider: "siliconflow",
      apiKey: process.env.SILICONFLOW_API_KEY,
      baseUrl: override.baseUrl || process.env.SILICONFLOW_BASE_URL || "https://api.siliconflow.cn/v1",
      model: override.model || process.env.SILICONFLOW_MODEL || "THUDM/GLM-4-32B-0414",
    };
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

export function getCircleAuth() {
  loadLocalEnv();
  const appKey = process.env.ZHIHU_APP_KEY || null;
  const appSecret = process.env.ZHIHU_APP_SECRET || null;
  return { appKey, appSecret };
}
