import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { searchZhihuContent } from "../lib/zhihu.js";

function formatCount(value) {
  const count = Number(value || 0);
  if (!count) return "";
  if (count >= 10000) return `${(count / 10000).toFixed(count >= 100000 ? 0 : 1)} 万`;
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
}

function authorityLabel(level) {
  if (!level) return "";
  const value = String(level);
  if (/high|高|expert|优/i.test(value)) return "权威度高";
  if (/medium|中|较/i.test(value)) return "权威度较高";
  return `权威度 ${value}`;
}

function relevanceLabel(score) {
  const value = Number(score);
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value >= 0.8 || value >= 80) return "相关度高";
  if (value >= 0.55 || value >= 55) return "方向匹配";
  return "可作补充";
}

function sourceLabel(item) {
  if (item.sourceType === "global") return "全网背景";
  if (item.contentType?.includes("article")) return "知乎文章";
  if (item.contentType?.includes("answer")) return "知乎回答";
  return item.sourceType === "zhihu" ? "知乎内容" : "资料补充";
}

function trustSignals(item) {
  return [
    sourceLabel(item),
    item.author ? `作者 ${item.author}` : "",
    item.authorBadgeText || "",
    authorityLabel(item.authorityLevel),
    item.voteUpCount ? `${formatCount(item.voteUpCount)} 赞同` : "",
    item.commentCount ? `${formatCount(item.commentCount)} 评论` : "",
    relevanceLabel(item.rankingScore),
  ].filter(Boolean).slice(0, 6);
}

function topItems(items, count) {
  return items.slice(0, count).map((item) => ({
    sourceType: item.sourceType,
    title: item.title,
    author: item.author,
    authorAvatar: item.authorAvatar,
    authorBadge: item.authorBadge,
    authorBadgeText: item.authorBadgeText,
    summary: item.summary,
    url: item.url,
    contentType: item.contentType,
    voteUpCount: item.voteUpCount,
    commentCount: item.commentCount,
    authorityLevel: item.authorityLevel,
    rankingScore: item.rankingScore,
    thumbnailUrl: item.thumbnailUrl,
    editTime: item.editTime,
    sourceLabel: sourceLabel(item),
    trustSignals: trustSignals(item),
  }));
}

function enrichedPresentation(candidate, direction, currentStep, index) {
  const directionType = direction.directionType || direction.label || "下一章";
  const concept = (candidate.concepts || [])[0] || direction.label || "当前主题";
  const currentTitle = currentStep?.title || "当前章";

  const connections = {
    深入: `它从「${currentTitle}」的核心问题继续往下拆，把阅读带到更具体的证据和判断里。`,
    跨界: `它把「${concept}」放到相邻领域里重新看，让这本非书保持开放。`,
    人物作品案例: `它围绕「${concept}」展开一个具体案例，给抽象问题找到落脚点。`,
    观点挑战: `它不顺着最舒服的方向走，而是把「${currentTitle}」放到反方视角里检验。`,
    回到生活: `它把「${concept}」拉回日常经验，让前面的抽象理解变得可用。`,
    意外发现: `它略微跳出当前线索，给非书保留一个旁支视角和新的发现空间。`,
  };

  const gains = [
    `读完这一章，你会更清楚「${concept}」如何延展当前主题，也能判断这条线索是否值得继续深入。`,
    `读完这一章，你会获得一个补充视角，帮助理解「${currentTitle}」在什么条件下成立、在什么条件下需要修正。`,
    `读完这一章，你可能会获得一个旁支视角，重新理解前面章节里看似确定的问题。`,
  ];

  const connection = connections[directionType] || connections["深入"];
  const readerGain = gains[index] || gains[0];

  return {
    ...candidate,
    curatedTitle: candidate.title,
    connection,
    readerGain,
    fitTags: [directionType, ...(candidate.concepts || [])].filter(Boolean).slice(0, 3),
    originalTitle: candidate.title,
    previousTitle: currentTitle,
  };
}

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  try {
    const body = await readJson(req);
    const direction = body.direction || {};
    const route = Array.isArray(body.route) ? body.route : [];
    const currentStep = body.currentStep || route[route.length - 1] || {};
    const zhihuQuery = direction.zhihuQuery || direction.text || direction.label;
    const globalQuery = direction.globalQuery || direction.text || direction.label;

    const [zhihuResult, globalResult] = await Promise.allSettled([
      searchZhihuContent({ apiName: "zhihu_search", query: zhihuQuery, count: 5 }),
      searchZhihuContent({ apiName: "global_search", query: globalQuery, count: 4 }),
    ]);

    if (zhihuResult.status === "rejected") {
      console.error("Zhihu search failed:", zhihuResult.reason);
    }
    if (globalResult.status === "rejected") {
      console.error("Global search failed:", globalResult.reason);
    }

    const zhihu = zhihuResult.status === "fulfilled" ? zhihuResult.value : { items: [] };
    const global = globalResult.status === "fulfilled" ? globalResult.value : { items: [] };

    const zhihuItems = topItems(zhihu.items, 3);
    const globalItems = topItems(global.items, 2);
    const rawCandidates = [
      ...zhihuItems.slice(0, 2).map((item, index) => ({
        ...item,
        sourceLabel: index === 0 ? "知乎优先" : "知乎延展",
        concepts: [direction.directionType || "知乎内容", direction.label || "下一章"].filter(Boolean),
        reason:
          index === 0
            ? "这条候选来自知乎站内内容，优先作为最终章节入口。"
            : "这条候选可以提供同一方向下的另一个知乎视角。",
        bridgePreview: `它可以承接当前章的"${currentStep.title || "起点"}"，继续推进到"${direction.text || direction.label}"。`,
      })),
      ...globalItems.slice(0, 1).map((item) => ({
        ...item,
        sourceLabel: "全网背景",
        concepts: [direction.directionType || "背景补充", direction.label || "全网搜索"].filter(Boolean),
        reason: "这条候选来自全网搜索，默认作为背景补充；只有你主动选择时才进入最终章节。",
        bridgePreview: "它能帮助你先补足背景，再决定是否把非书带向知乎之外。",
      })),
    ];

    if (!rawCandidates.length) {
      const error = new Error("没有搜索到有效候选。");
      error.statusCode = 502;
      error.publicMessage = "候选内容生成失败，请换个方向重试。";
      throw error;
    }

    const candidates = rawCandidates.slice(0, 3).map((candidate, index) =>
      enrichedPresentation(candidate, direction, currentStep, index)
    );

    sendJson(res, 200, {
      ok: true,
      candidates,
      backgroundNotes: globalItems.map((item) => item.summary).filter(Boolean).slice(0, 2),
      message: "我为你整理了 3 个可以继续写下去的章节。",
      rawCounts: {
        zhihu: zhihu.items.length,
        global: global.items.length,
      },
      provider: "search",
    });
  } catch (error) {
    handleApiError(res, error, "候选内容生成失败。");
  }
}
