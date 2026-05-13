import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { getCache, setCache } from "./cache.js";

function isHttpUrl(input) {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function fallbackParsedUrl(trimmedUrl, reason = "") {
  const parsedUrl = new URL(trimmedUrl);
  const host = parsedUrl.hostname.replace(/^www\./, "");
  const isZhihu = /(^|\.)zhihu\.com$/.test(parsedUrl.hostname);
  const title = isZhihu ? "一篇知乎内容引出的阅读起点" : "一个文章链接引出的阅读起点";
  const content = isZhihu
    ? "用户提供了一个知乎内容链接。当前环境暂时无法直接读取原文正文，因此先把它作为一个知乎讨论入口来理解：这通常意味着一个具体问题、回答或文章，可以继续延展出相关概念、争议、案例和下一章阅读方向。请保持克制，不要伪装已经读完原文。"
    : `用户提供了一个来自 ${host} 的文章链接。当前环境暂时无法直接读取原文正文，因此先把它作为一个待展开的阅读入口来理解：可以围绕链接来源、文章类型和用户的起点意图，生成谨慎的章节导读和下一章方向。请保持克制，不要伪装已经读完原文。`;

  return {
    source: host,
    title,
    author: "",
    url: trimmedUrl,
    content,
    contentExcerpt: content,
    isFullText: false,
    basedOnUserText: false,
    needsUserText: true,
    parseWarning: reason,
  };
}

export async function parseStartContent({ url = "", text = "" }) {
  const trimmedText = text.trim();
  const trimmedUrl = url.trim();

  if (trimmedText.length >= 20) {
    return {
      source: "user_text",
      title: "用户粘贴的文章片段",
      author: "",
      url: "",
      content: trimmedText,
      contentExcerpt: trimmedText.slice(0, 1200),
      isFullText: trimmedText.length >= 800,
      basedOnUserText: true,
      needsUserText: false,
    };
  }

  if (!trimmedUrl || !isHttpUrl(trimmedUrl)) {
    const error = new Error("请输入有效文章链接，或粘贴标题、摘要、正文片段。");
    error.statusCode = 400;
    error.publicMessage = error.message;
    throw error;
  }

  const cacheKey = `parse:${trimmedUrl}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  let response;
  try {
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 8000);
    response = await fetch(trimmedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(fetchTimeout);
  } catch {
    const parsed = fallbackParsedUrl(trimmedUrl, "文章链接暂时无法直接访问，已按链接入口生成保底起点。");
    return setCache(cacheKey, parsed, 5 * 60 * 1000);
  }

  if (!response.ok) {
    const parsed = fallbackParsedUrl(trimmedUrl, "文章链接暂时无法直接解析，已按链接入口生成保底起点。");
    return setCache(cacheKey, parsed, 5 * 60 * 1000);
  }

  let html = await response.text();
  // 限制 HTML 大小，避免超大页面拖慢 JSDOM 解析
  const MAX_HTML_SIZE = 300 * 1024;
  if (html.length > MAX_HTML_SIZE) {
    html = html.slice(0, MAX_HTML_SIZE);
  }

  // 去除 script/style/noscript 等无关标签，降低 JSDOM 解析负担
  html = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "");

  const dom = new JSDOM(html, { url: trimmedUrl });
  const article = new Readability(dom.window.document).parse();
  const title = article?.title || dom.window.document.title || "";
  const content = article?.textContent?.replace(/\s+/g, " ").trim() || "";

  if (content.length < 120) {
    const parsed = fallbackParsedUrl(trimmedUrl, "文章正文解析不足，已按链接入口生成保底起点。");
    return setCache(cacheKey, parsed, 5 * 60 * 1000);
  }

  const parsed = {
    source: new URL(trimmedUrl).hostname.replace(/^www\./, ""),
    title,
    author: article?.byline || "",
    url: trimmedUrl,
    content,
    contentExcerpt: content.slice(0, 1200),
    isFullText: content.length >= 800,
    basedOnUserText: false,
    needsUserText: false,
  };

  return setCache(cacheKey, parsed, 30 * 60 * 1000);
}
