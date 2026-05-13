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

function fallbackStartPayload(parsed, hotItem) {
  const title = parsed.title || hotItem?.title || "未命名起点";
  const excerpt = parsed.contentExcerpt || hotItem?.summary || "";

  // 从 excerpt 提取简单 concepts：按标点分词，取长度适中的片段
  let concepts = [];
  if (excerpt.length >= 10) {
    concepts = excerpt
      .split(/[，,、；;。．]/g)
      .map((s) => s.trim())
      .filter((s) => s.length >= 4 && s.length <= 14)
      .slice(0, 6);
  }
  if (concepts.length === 0 && title.length >= 4) {
    concepts = [title.slice(0, 14)];
  }
  if (concepts.length === 0) {
    concepts = ["阅读起点"];
  }

  const understanding = {
    summary: excerpt.slice(0, 180) || "从用户提供的起点出发。",
    concepts,
    peopleWorksCases: [],
    controversies: [],
    extensionDirections: [],
    searchKeywords: [],
  };

  const knowledgeCards = concepts.map((concept) => ({
    title: concept,
    concept,
    summary: `从起点中提炼出的核心概念「${concept}」，是后续探索的重要入口。`,
    extractionReason: `这一概念直接来自起点内容，可作为深入探索的锚点。`,
    explorationValue: `围绕「${concept}」可以深入机制、跨界应用或寻找反方观点。`,
    suggestedQuery: concept.slice(0, 14),
  }));

  return {
    ok: true,
    fallback: true,
    source: parsed.source,
    title,
    author: parsed.author,
    url: parsed.url,
    contentExcerpt: parsed.contentExcerpt,
    isFullText: parsed.isFullText,
    basedOnUserText: parsed.basedOnUserText,
    needsUserText: parsed.needsUserText,
    parseWarning: parsed.parseWarning || "",
    understanding,
    interestProfile: {},
    curatorMessage: "我已经从你的起点中提取了一些线索。如果愿意，你可以继续探索，或者重新输入更具体的内容。",
    knowledgeCards,
    directions: buildInitialDirections(understanding),
    model: "fallback",
    provider: "local",
  };
}

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  let parsed = null;
  let hotItem = null;

  try {
    const body = await readJson(req);
    const nodeConfig = getNodeConfig(body, "start");
    parsed = await parseStartContent({ url: body.url || "", text: body.text || "" });
    hotItem = body.hotItem || null;

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
    // 解析成功但 AI 失败时，返回基础版本让用户至少能继续
    if (parsed && (parsed.title || parsed.contentExcerpt)) {
      sendJson(res, 200, fallbackStartPayload(parsed, hotItem));
      return;
    }
    handleApiError(res, error, "起点解析失败。");
  }
}
