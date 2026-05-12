import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { searchZhihuContent } from "../lib/zhihu.js";

function topItems(items, count) {
  return items.slice(0, count).map((item) => ({
    sourceType: item.sourceType,
    title: item.title,
    author: item.author,
    summary: item.summary,
    url: item.url,
    contentType: item.contentType,
    voteUpCount: item.voteUpCount,
    commentCount: item.commentCount,
    authorityLevel: item.authorityLevel,
    rankingScore: item.rankingScore,
  }));
}

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  try {
    const body = await readJson(req);
    const direction = body.direction || {};
    const zhihuQuery = direction.zhihuQuery || direction.text || direction.label;
    const globalQuery = direction.globalQuery || direction.text || direction.label;

    const [zhihu, global] = await Promise.all([
      searchZhihuContent({ apiName: "zhihu_search", query: zhihuQuery, count: 5 }),
      searchZhihuContent({ apiName: "global_search", query: globalQuery, count: 4 }),
    ]);

    const zhihuItems = topItems(zhihu.items, 3);
    const globalItems = topItems(global.items, 2);
    const candidates = [
      ...zhihuItems.slice(0, 2).map((item, index) => ({
        ...item,
        sourceLabel: index === 0 ? "知乎优先" : "知乎延展",
        concepts: [direction.directionType || "知乎内容", direction.label || "下一站"].filter(Boolean),
        reason:
          index === 0
            ? "这条候选来自知乎站内内容，优先作为最终章节入口。"
            : "这条候选可以提供同一方向下的另一个知乎视角。",
        bridgePreview: `它可以承接当前站的“${body.currentStep?.title || "起点"}”，继续推进到“${direction.text || direction.label}”。`,
      })),
      ...globalItems.slice(0, 1).map((item) => ({
        ...item,
        sourceLabel: "全网背景",
        concepts: [direction.directionType || "背景补充", direction.label || "全网搜索"].filter(Boolean),
        reason: "这条候选来自全网搜索，默认作为背景补充；只有你主动选择时才进入最终章节。",
        bridgePreview: "它能帮助你先补足背景，再决定是否把路线带向知乎之外。",
      })),
    ];

    if (globalItems[1]) {
      candidates.push({
        ...globalItems[1],
        sourceLabel: "意外发现",
        concepts: ["意外发现", direction.directionType || "跨界"].filter(Boolean),
        reason: "这条候选略微跳出当前舒适区，让路线保留一点发现感。",
        bridgePreview: "它不一定最顺路，但可能让你的兴趣出现新的分叉。",
      });
    }

    if (!candidates.length) {
      const error = new Error("没有搜索到有效候选。");
      error.statusCode = 502;
      error.publicMessage = "候选内容生成失败，请换个方向重试。";
      throw error;
    }

    sendJson(res, 200, {
      ok: true,
      candidates,
      backgroundNotes: globalItems.map((item) => item.summary).filter(Boolean).slice(0, 2),
      message: "我为你筛出了一组可以继续阅读的候选。",
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
