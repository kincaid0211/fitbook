import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { parseStartContent } from "../lib/parser.js";
import { callModelJson } from "../lib/model.js";
import {
  curatorSystem,
  getNodeConfig,
  nodePrompt,
  buildStartUserPayload,
  buildInitialDirections,
} from "../lib/prompts.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  try {
    const body = await readJson(req);
    const nodeConfig = getNodeConfig(body, "start");
    const parsed = await parseStartContent({ url: body.url || "", text: body.text || "" });
    const hotItem = body.hotItem || null;

    const result = await callModelJson({
      system: nodePrompt(curatorSystem, nodeConfig),
      nodeConfig,
      user: buildStartUserPayload({ parsed, hotItem }),
    });

    const data = result.data;

    // 知识卡片回退：若 AI 未返回或返回空，从 concepts 生成默认卡片
    let knowledgeCards = Array.isArray(data.knowledgeCards) ? data.knowledgeCards : [];
    if (!knowledgeCards.length && Array.isArray(data.concepts)) {
      knowledgeCards = data.concepts.map((concept) => ({
        title: concept,
        concept,
        summary: `从起点中提炼出的核心概念「${concept}」，是后续探索的重要入口。`,
        extractionReason: `这一概念直接来自原文，具有向多个方向展开的可能。`,
        explorationValue: `围绕「${concept}」可以深入机制、跨界应用或寻找反方观点。`,
        suggestedQuery: concept.slice(0, 14),
      }));
    }

    const understanding = {
      summary: data.summary || parsed.contentExcerpt.slice(0, 180),
      concepts: Array.isArray(data.concepts) ? data.concepts.slice(0, 6) : [],
      peopleWorksCases: Array.isArray(data.peopleWorksCases) ? data.peopleWorksCases : [],
      controversies: Array.isArray(data.controversies) ? data.controversies : [],
      extensionDirections: Array.isArray(data.extensionDirections) ? data.extensionDirections : [],
      searchKeywords: Array.isArray(data.searchKeywords) ? data.searchKeywords : [],
    };

    sendJson(res, 200, {
      ok: true,
      source: parsed.source,
      title: data.title || parsed.title || "未命名起点",
      author: parsed.author,
      url: parsed.url,
      contentExcerpt: parsed.contentExcerpt,
      isFullText: parsed.isFullText,
      basedOnUserText: parsed.basedOnUserText,
      needsUserText: parsed.needsUserText,
      parseWarning: parsed.parseWarning || "",
      understanding,
      interestProfile: data.interestProfile || {},
      curatorMessage: data.curatorMessage || "我已经读到了一个可以展开的兴趣起点。",
      knowledgeCards,
      directions: buildInitialDirections(understanding),
      model: result.model,
      provider: result.provider,
    });
  } catch (error) {
    handleApiError(res, error, "起点解析失败。");
  }
}
