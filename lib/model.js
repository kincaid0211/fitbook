import { getModelConfig } from "./env.js";

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

export async function callModelJson({ system, user, temperature = 0.4, nodeConfig = null }) {
  const config = getModelConfig(nodeConfig || {});
  if (!config) {
    const error = new Error("尚未配置 Kimi 或硅基流动模型 API Key。");
    error.statusCode = 503;
    error.publicMessage = "AI 服务还没有配置完成，请稍后重试。";
    throw error;
  }

  const controller = new AbortController();
  const timeoutMs = Math.max(15, Number(nodeConfig?.timeoutSeconds || 90)) * 1000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

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

  return {
    provider: config.provider,
    model: config.model,
    data: parsed,
  };
}
