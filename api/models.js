import { getModelConfig } from "../lib/env.js";
import { getCache, setCache } from "../lib/cache.js";
import { methodGuard, sendJson, handleApiError } from "../lib/http.js";

function normalizeModel(model) {
  const id = typeof model === "string" ? model : model?.id;
  if (!id) return null;
  return {
    id,
    label: id,
    ownedBy: model?.owned_by || model?.ownedBy || "",
  };
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, "GET")) return;

  try {
    const url = new URL(req.url || "/api/models", "http://localhost");
    const provider = url.searchParams.get("provider") || "siliconflow";
    const cacheKey = `models:${provider}`;
    const cached = getCache(cacheKey);
    if (cached) {
      sendJson(res, 200, { ok: true, provider, models: cached, cached: true });
      return;
    }

    const config = getModelConfig({ provider });
    if (!config) {
      const error = new Error("模型服务尚未配置。");
      error.statusCode = 503;
      error.publicMessage = "模型服务尚未配置，请先配置 API Key。";
      throw error;
    }

    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/models`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(payload?.error?.message || "模型列表获取失败。");
      error.statusCode = response.status;
      error.publicMessage = "模型列表获取失败，请稍后重试。";
      throw error;
    }

    const rawModels = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.models) ? payload.models : [];
    const models = rawModels.map(normalizeModel).filter(Boolean).sort((a, b) => a.id.localeCompare(b.id));

    setCache(cacheKey, models, 30 * 60 * 1000);
    sendJson(res, 200, { ok: true, provider, models, cached: false });
  } catch (error) {
    handleApiError(res, error, "模型列表获取失败。");
  }
}
