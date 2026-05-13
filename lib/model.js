import crypto from "node:crypto";
import { getModelConfig, loadLocalEnv } from "./env.js";
import { getCache, setCache } from "./cache.js";

function extractJson(text) {
  if (!text) return null;

  // Step 1: 清理 Markdown 代码块标记和前后空白
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/gim, "")
    .replace(/```/g, "")
    .trim();

  // Step 2: 尝试直接 parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // Step 3: 大括号深度匹配定位最外层 JSON 对象
    const firstBrace = cleaned.indexOf("{");
    if (firstBrace === -1) return null;

    let depth = 0;
    let lastBrace = -1;
    for (let i = firstBrace; i < cleaned.length; i++) {
      if (cleaned[i] === "{") depth++;
      else if (cleaned[i] === "}") {
        depth--;
        if (depth === 0) {
          lastBrace = i;
          break;
        }
      }
    }

    if (lastBrace === -1) return null;

    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
}

function hashPayload(system, user) {
  return crypto.createHash("md5").update(system + "\n" + user).digest("hex");
}

const defaultNodeModels = {
  start: "THUDM/GLM-4-32B-0414",
  candidates: "THUDM/GLM-4-32B-0414",
  directions: "THUDM/GLM-4-32B-0414",
  choose: "THUDM/GLM-4-32B-0414",
  book: "Qwen/Qwen3-30B-A3B-Instruct-2507",
  cover: "THUDM/GLM-4-32B-0414",
};

const nodeModelEnvKeys = {
  start: "SILICONFLOW_START_MODEL",
  candidates: "SILICONFLOW_CANDIDATES_MODEL",
  directions: "SILICONFLOW_DIRECTIONS_MODEL",
  choose: "SILICONFLOW_CHOOSE_MODEL",
  book: "SILICONFLOW_BOOK_MODEL",
  cover: "SILICONFLOW_COVER_MODEL",
};

const legacyFastModelNodes = new Set(["start", "candidates", "directions", "cover"]);

function resolveNodeModel(nodeConfig = {}) {
  const key = nodeConfig?.key || "";

  if (nodeConfig?.model) return nodeConfig;
  if (!key) return nodeConfig;

  loadLocalEnv();

  const nodeEnvKey = nodeModelEnvKeys[key];
  if (nodeEnvKey && process.env[nodeEnvKey]) {
    return { ...nodeConfig, model: process.env[nodeEnvKey] };
  }

  const envFastModel = process.env.SILICONFLOW_FAST_MODEL;
  if (envFastModel && legacyFastModelNodes.has(key)) {
    return { ...nodeConfig, model: envFastModel };
  }

  return { ...nodeConfig, model: defaultNodeModels[key] };
}

const defaultMaxTokens = {
  start: 900,
  candidates: 700,
  directions: 700,
  choose: 1200,
  book: 1000,
  cover: 700,
};

export async function callModelJson({ system, user, temperature = 0.4, nodeConfig = null, enableCache = true, maxTokens = null }) {
  const effectiveConfig = resolveNodeModel(nodeConfig);
  const config = getModelConfig(effectiveConfig || {});
  if (!config) {
    const error = new Error("尚未配置硅基流动模型 API Key。");
    error.statusCode = 503;
    error.publicMessage = "AI 服务还没有配置完成，请稍后重试。";
    throw error;
  }

  const cacheKey = enableCache
    ? `ai:${config.provider}:${config.model}:${hashPayload(system, user)}`
    : null;

  async function execute(attempt) {
    // 只有首次尝试才读缓存；重试时跳过缓存
    if (cacheKey && attempt === 1) {
      const cached = getCache(cacheKey);
      if (cached) return cached;
    }

    const controller = new AbortController();
    const defaultTimeouts = { start: 35, directions: 30, choose: 35, book: 35, cover: 30, candidates: 25 };
    const timeoutMs = Math.max(5, Number(nodeConfig?.timeoutSeconds || defaultTimeouts[nodeConfig?.key] || 30)) * 1000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const finalMaxTokens = maxTokens || defaultMaxTokens[nodeConfig?.key] || 1000;

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
          temperature: Number(nodeConfig?.temperature ?? temperature) + (attempt > 1 ? 0.05 : 0),
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
      const isTimeout = error.name === "AbortError";
      const apiError = new Error(isTimeout ? "AI 服务请求超时。" : "AI 服务连接失败。");
      apiError.statusCode = isTimeout ? 504 : 502;
      apiError.publicMessage = "AI 服务暂时没有响应，请稍后重试。";
      apiError.retryable = isTimeout;
      throw apiError;
    } finally {
      clearTimeout(timeout);
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(payload?.error?.message || "AI 服务调用失败。");
      error.statusCode = response.status;
      error.publicMessage = "AI 服务调用失败，请稍后重试。";
      // 5xx 服务端错误可重试，4xx 客户端错误不重试
      error.retryable = response.status >= 500;
      throw error;
    }

    const content = payload?.choices?.[0]?.message?.content;
    const parsed = extractJson(content);
    if (!parsed) {
      const error = new Error("AI 返回内容不是有效 JSON。");
      error.statusCode = 502;
      error.publicMessage = "AI 返回格式异常，请重试。";
      error.retryable = true;
      throw error;
    }

    return {
      provider: config.provider,
      model: config.model,
      data: parsed,
    };
  }

  try {
    const result = await execute(1);
    if (cacheKey) setCache(cacheKey, result, 8 * 60 * 1000);
    return result;
  } catch (error) {
    if (error.retryable) {
      try {
        const result = await execute(2);
        if (cacheKey) setCache(cacheKey, result, 8 * 60 * 1000);
        return result;
      } catch (retryError) {
        // 抛出更严重的错误（服务端错误优先于格式错误）
        throw retryError.statusCode >= 500 ? retryError : error;
      }
    }
    throw error;
  }
}
