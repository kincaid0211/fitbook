import crypto from "node:crypto";
import { getCircleAuth } from "./env.js";

const circleBaseUrl = "https://openapi.zhihu.com";

function signRequest({ appKey, appSecret, timestamp, logId, extraInfo = "" }) {
  const signStr = `app_key:${appKey}|ts:${timestamp}|logid:${logId}|extra_info:${extraInfo}`;
  const hmac = crypto.createHmac("sha256", appSecret);
  hmac.update(signStr);
  return hmac.digest("base64");
}

export async function publishPin({ content, ringId = "" }) {
  const { appKey, appSecret } = getCircleAuth();
  if (!appKey || !appSecret) {
    const error = new Error("尚未配置知乎圈子 API 密钥（ZHIHU_APP_KEY / ZHIHU_APP_SECRET）。");
    error.statusCode = 503;
    error.publicMessage = "知乎发布服务还没有配置完成，请联系管理员配置圈子 API 密钥。";
    throw error;
  }

  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const logId = `pin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const sign = signRequest({ appKey, appSecret, timestamp, logId });

  const body = {
    content,
    ...(ringId ? { ring_id: ringId } : {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${circleBaseUrl}/openapi/publish/pin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Key": appKey,
        "X-Timestamp": timestamp,
        "X-Log-Id": logId,
        "X-Sign": sign,
        "X-Extra-Info": "",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.status !== 0) {
      const error = new Error(payload?.msg || "知乎想法发布失败。");
      error.statusCode = response.status || 502;
      error.publicMessage = "发布到知乎失败，请稍后重试。";
      throw error;
    }

    return payload.data || {};
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === "AbortError") {
      const apiError = new Error("知乎发布请求超时。");
      apiError.statusCode = 504;
      apiError.publicMessage = "知乎发布响应较慢，请稍后重试。";
      throw apiError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
