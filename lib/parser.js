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
      contentExcerpt: trimmedText.slice(0, 1800),
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

  const response = await fetch(trimmedUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    const error = new Error("文章链接暂时无法解析，请粘贴标题、摘要或正文片段。");
    error.statusCode = 422;
    error.publicMessage = error.message;
    throw error;
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url: trimmedUrl });
  const article = new Readability(dom.window.document).parse();
  const title = article?.title || dom.window.document.title || "";
  const content = article?.textContent?.replace(/\s+/g, " ").trim() || "";

  if (content.length < 120) {
    const error = new Error("文章正文解析不足，请粘贴标题、摘要或正文片段。");
    error.statusCode = 422;
    error.publicMessage = error.message;
    throw error;
  }

  const parsed = {
    source: new URL(trimmedUrl).hostname.replace(/^www\./, ""),
    title,
    author: article?.byline || "",
    url: trimmedUrl,
    content,
    contentExcerpt: content.slice(0, 2200),
    isFullText: content.length >= 800,
    basedOnUserText: false,
    needsUserText: false,
  };

  return setCache(cacheKey, parsed, 30 * 60 * 1000);
}
