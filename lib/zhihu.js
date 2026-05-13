import { getZhihuSecret } from "./env.js";
import { getCache, setCache } from "./cache.js";

const baseUrl = "https://developer.zhihu.com";

function normalizeItem(item, sourceType) {
  return {
    sourceType,
    title: item.Title || item.title || "",
    contentType: item.ContentType || "",
    contentId: item.ContentID || "",
    summary: item.ContentText || item.Summary || "",
    url: item.Url || "",
    author: item.AuthorName || "",
    authorAvatar: item.AuthorAvatar || "",
    authorBadge: item.AuthorBadge || "",
    authorBadgeText: item.AuthorBadgeText || "",
    commentCount: Number(item.CommentCount || 0),
    voteUpCount: Number(item.VoteUpCount || 0),
    authorityLevel: item.AuthorityLevel || "",
    rankingScore: item.RankingScore || "",
    thumbnailUrl: item.ThumbnailUrl || "",
    editTime: item.EditTime || item.PublishTime || "",
  };
}

export async function searchZhihuContent({ apiName = "zhihu_search", query, count = 5 }) {
  const accessSecret = getZhihuSecret();
  if (!accessSecret) {
    const error = new Error("尚未配置知乎内容 API Access Secret。");
    error.statusCode = 503;
    error.publicMessage = "知乎搜索服务还没有配置完成。";
    throw error;
  }

  const cacheKey = `zhihu:${apiName}:${query}:${count}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams();
  if (query) params.set("Query", query);
  if (count) params.set("Count", String(count));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    response = await fetch(`${baseUrl}/api/v1/content/${apiName}?${params}`, {
      headers: {
        Authorization: `Bearer ${accessSecret}`,
        "X-Request-Timestamp": `${Math.floor(Date.now() / 1000)}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    const isTimeout = error.name === "AbortError";
    const apiError = new Error(isTimeout ? "知乎搜索请求超时。" : "知乎搜索连接失败。");
    apiError.statusCode = isTimeout ? 504 : 502;
    apiError.publicMessage = isTimeout ? "知乎搜索响应较慢，请稍后重试。" : "知乎搜索连接失败，请稍后重试。";
    throw apiError;
  } finally {
    clearTimeout(timeout);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.Code !== 0) {
    const error = new Error(payload?.Message || "知乎内容 API 调用失败。");
    error.statusCode = response.status || 502;
    error.publicMessage = "知乎内容搜索失败，请稍后重试。";
    throw error;
  }

  const items = Array.isArray(payload.Data?.Items) ? payload.Data.Items : [];
  const normalized = {
    hasMore: Boolean(payload.Data?.HasMore),
    searchHashId: payload.Data?.SearchHashId || "",
    items: items.map((item) => normalizeItem(item, apiName === "global_search" ? "global" : "zhihu")),
  };

  return setCache(cacheKey, normalized, 8 * 60 * 1000);
}

export async function getHotList() {
  const cacheKey = "zhihu:hot_list";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const result = await searchZhihuContent({ apiName: "hot_list", query: "", count: "" });
  return setCache(cacheKey, result, 10 * 60 * 1000);
}
