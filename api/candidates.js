import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { callModelJson } from "../lib/model.js";
import { curatorSystem, getNodeConfig, nodePrompt } from "../lib/prompts.js";
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

function fallbackPresentation(candidate, direction, currentStep, index) {
  const connection = [
    "它能接住当前章节留下的问题，把阅读推进到更具体的经验里。",
    "它会把这一章的核心概念换到另一个场景中，让线索继续展开。",
    "它适合作为补充视角，帮助这本非书保留一点新的发现。",
  ][index] || "它能为下一章提供一个清晰入口。";

  return {
    ...candidate,
    curatedTitle: candidate.title,
    connection,
    readerGain:
      candidate.summary?.slice(0, 96) ||
      `读完这一章，你会更清楚“${direction.label || direction.text}”如何延展当前主题。`,
    fitTags: [direction.directionType || direction.label || "下一章", ...(candidate.concepts || [])].filter(Boolean).slice(0, 3),
    originalTitle: candidate.title,
    previousTitle: currentStep?.title || "",
  };
}

async function enrichCandidates({ candidates, currentStep, direction, route, body }) {
  const fallback = candidates.map((candidate, index) => fallbackPresentation(candidate, direction, currentStep, index));
  const nodeConfig = getNodeConfig(body, "candidates");

  try {
    const result = await callModelJson({
      system: nodePrompt(curatorSystem, nodeConfig),
      nodeConfig,
      temperature: 0.35,
      user: JSON.stringify({
        node: "curate_next_chapter_candidates",
        task:
          "把搜索返回的候选内容整理成“选择下一章”模态框可用的三选一推荐。不要写“AI 提炼”“推荐理由”“搜索结果”。",
        requirements: [
          "只为给定 candidates 生成展示文案，不改变候选的 url、sourceType、author。",
          "curatedTitle 是适合作为非书下一章的标题，8–22 字，能衔接当前章，不要照搬生硬搜索标题。",
          "connection 说明它如何接住当前章，28–58 字。",
          "readerGain 从用户收获角度说明读完会得到什么，35–80 字。",
          "fitTags 2–3 个，每个 2–6 字。",
          "三个候选要有差异，帮助用户做三选一判断。",
        ],
        requiredShape: {
          candidates: [
            {
              index: "number",
              curatedTitle: "string",
              connection: "string",
              readerGain: "string",
              fitTags: ["string"],
            },
          ],
        },
        currentStep,
        selectedDirection: direction,
        route: route.map((step, index) => ({
          index: index + 1,
          title: step.title,
          summary: step.summary,
          bridge: step.bridge || "",
        })),
        candidates: fallback.map((candidate, index) => ({
          index,
          title: candidate.title,
          sourceLabel: candidate.sourceLabel,
          author: candidate.author,
          summary: candidate.summary,
          trustSignals: candidate.trustSignals,
        })),
      }),
    });

    const aiCandidates = Array.isArray(result.data.candidates) ? result.data.candidates : [];
    return fallback.map((candidate, index) => {
      const enriched = aiCandidates.find((item) => Number(item.index) === index) || {};
      return {
        ...candidate,
        curatedTitle: enriched.curatedTitle || candidate.curatedTitle,
        connection: enriched.connection || candidate.connection,
        readerGain: enriched.readerGain || candidate.readerGain,
        fitTags: Array.isArray(enriched.fitTags) && enriched.fitTags.length ? enriched.fitTags : candidate.fitTags,
      };
    });
  } catch (error) {
    console.error("Candidate AI enrichment failed:", error);
    return fallback;
  }
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

    const [zhihu, global] = await Promise.all([
      searchZhihuContent({ apiName: "zhihu_search", query: zhihuQuery, count: 5 }),
      searchZhihuContent({ apiName: "global_search", query: globalQuery, count: 4 }),
    ]);

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
        bridgePreview: `它可以承接当前章的“${currentStep.title || "起点"}”，继续推进到“${direction.text || direction.label}”。`,
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

    const candidates = await enrichCandidates({
      candidates: rawCandidates.slice(0, 3),
      currentStep,
      direction,
      route,
      body,
    });

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
