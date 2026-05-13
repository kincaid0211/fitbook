import crypto from "node:crypto";
import { getModelConfig, loadLocalEnv } from "./env.js";
import { getCache, setCache } from "./cache.js";

function extractJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  }
}

function hashPayload(system, user) {
  return crypto.createHash("md5").update(system + "\n" + user).digest("hex");
}

function resolveNodeModel(nodeConfig = {}) {
  if (nodeConfig?.model) return nodeConfig;

  const fastNodes = ["start", "directions", "cover"];
  const key = nodeConfig?.key || "";
  if (!fastNodes.includes(key)) return nodeConfig;

  loadLocalEnv();

  const provider = nodeConfig?.provider || (process.env.MOONSHOT_API_KEY ? "kimi" : "siliconflow");
  const fastModel = provider === "kimi"
    ? process.env.KIMI_FAST_MODEL
    : process.env.SILICONFLOW_FAST_MODEL;

  if (!fastModel) return nodeConfig;
  return { ...nodeConfig, model: fastModel };
}

const defaultMaxTokens = {
  start: 900,
  directions: 700,
  choose: 1400,
  book: 1100,
  cover: 700,
};

export async function callModelJson({ system, user, temperature = 0.4, nodeConfig = null, enableCache = true, maxTokens = null }) {
  const effectiveConfig = resolveNodeModel(nodeConfig);
  const config = getModelConfig(effectiveConfig || {});
  if (!config) {
    const error = new Error("尚未配置 Kimi 或硅基流动模型 API Key。");
    error.statusCode = 503;
    error.publicMessage = "AI 服务还没有配置完成，请稍后重试。";
    throw error;
  }

  const cacheKey = enableCache
    ? `ai:${config.provider}:${config.model}:${hashPayload(system, user)}`
    : null;
  if (cacheKey) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
  }

  const controller = new AbortController();
  const defaultTimeouts = { start: 70, directions: 45, choose: 60, book: 70, cover: 45 };
  const timeoutMs = Math.max(5, Number(nodeConfig?.timeoutSeconds || defaultTimeouts[nodeConfig?.key] || 35)) * 1000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const finalMaxTokens = maxTokens || defaultMaxTokens[nodeConfig?.key] || 1200;

  let response;
  try {
    response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: Number(nodeConfig?.temperature ?? temperature),
        max_tokens: finalMaxTokens,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `${system}\n\n你必须只返回合法 JSON，不要返回 Markdown，不要解释。`,
          },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    const apiError = new Error(error.name === "AbortError" ? "AI 服务请求超时。" : "AI 服务连接失败。");
    apiError.statusCode = 504;
    apiError.publicMessage = "AI 服务暂时没有响应，请稍后重试。";
    throw apiError;
  } finally {
    clearTimeout(timeout);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || "AI 服务调用失败。");
    error.statusCode = response.status;
    error.publicMessage = "AI 服务调用失败，请稍后重试。";
    throw error;
  }

  const content = payload?.choices?.[0]?.message?.content;
  const parsed = extractJson(content);
  if (!parsed) {
    const error = new Error("AI 返回内容不是有效 JSON。");
    error.statusCode = 502;
    error.publicMessage = "AI 返回格式异常，请重试。";
    throw error;
  }

  const result = {
    provider: config.provider,
    model: config.model,
    data: parsed,
  };

  if (cacheKey) {
    setCache(cacheKey, result, 8 * 60 * 1000);
  }

  return result;
}
