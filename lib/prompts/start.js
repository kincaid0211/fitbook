import { compactRouteForContext, directionSchema, interestProfileSchema } from "./_shared.js";

export function buildInitialDirections(understanding = {}) {
  const concepts = understanding.concepts || [];
  const keywords = understanding.searchKeywords || [];
  const extensions = understanding.extensionDirections || [];
  const mainConcept = concepts[0] || "当前主题";
  const mainKeyword = keywords[0] || mainConcept;

  return [
    {
      label: "继续深入",
      text: `继续拆解「${mainConcept}」背后的关键问题`,
      reason: `这一章已经给出清晰入口，继续深入能把「${mainConcept}」的概念、证据和判断关系读得更完整。`,
      zhihuQuery: mainKeyword.slice(0, 14),
      globalQuery: `${mainKeyword} 背景`.slice(0, 14),
      directionType: "深入",
    },
    {
      label: "换个角度",
      text: `换一个视角重新理解「${mainConcept}」`,
      reason: "换一个视角能避免章节线索过早收窄，也能帮助用户判断这条线索是否真正成立。",
      zhihuQuery: (extensions[0] || `${mainKeyword} 争议`).slice(0, 14),
      globalQuery: `${mainKeyword} 不同观点`.slice(0, 14),
      directionType: "观点挑战",
    },
    {
      label: "意外发现",
      text: extensions[1] ? `${extensions[1]}`.slice(0, 45) : `从「${mainConcept}」跳到相邻领域`,
      reason: "这一章的线索还可以向意外方向延展，让阅读保留跳出舒适区的机会。",
      zhihuQuery: (extensions[1] || `${mainKeyword} 案例`).slice(0, 14),
      globalQuery: (keywords[1] || `${mainKeyword} 应用`).slice(0, 14),
      directionType: "意外发现",
    },
  ];
}

export function buildStartUserPayload({ parsed, hotItem = null }) {
  return JSON.stringify({
    node: "understand_article",
    task: hotItem
      ? "你是起点定调节点。用户从知乎热榜选择了一个话题作为起点。请基于热榜提供的问题标题和摘要，提取3-6张「知识卡片」。每张卡片是一个值得深入探索的知识切入点——不是全文摘要，而是一个可以生长出后续章节的'种子'。用户必须选择其中一张作为整本非书的「锚点」，后续探索将围绕锚点展开。"
      : "你是起点定调节点。从用户给出的起点（文章、链接、粘贴文本）中，提取3-6张「知识卡片」。每张卡片是一个值得深入探索的知识切入点——不是全文摘要，而是一个可以生长出后续章节的'种子'。用户必须选择其中一张作为整本非书的「锚点」，后续探索将围绕锚点展开。请基于实际可获取的材料进行提炼，不编造未提及的细节。",
    requirements: [
      "knowledgeCards 3-6 张。根据输入复杂度判断：信息丰富则5-6张，简短则3张。必须穷尽所有值得探索的知识点。",
      "每张 knowledgeCard 包含以下字段（全部面向用户，中文）：",
      "  - title: 6-14 字，卡片主题，像一个可展开的小标题。",
      "  - concept: 6-14 字，核心概念，从原文提炼。",
      "  - summary: 40-80 字导读摘要，说明这个知识点的具体内容及重要性。不要重写正文。",
      "  - extractionReason: 30-60 字，说明这个概念为何从原文中被挑出、与输入的关联。",
      "  - explorationValue: 30-60 字，说明若选为锚点，后续可向哪些方向展开。",
      "  - suggestedQuery: 6-14 字，适合作为知乎搜索的首个 query。",
      "knowledgeCards 之间必须互相区分，代表独立的探索入口，避免高度重叠。",
      "summary 一句话 30-80 字，概括全文核心。",
      "concepts 3-6 个，可与 knowledgeCards 的 concept 对应。",
      "searchKeywords 4-8 个，适合搜索用。",
      "interestProfile 推断用户兴趣画像。",
      "curatorMessage 30-60 字开场，温暖克制，像策展人开门，提示有几个入口可选。不要罗列概念。",
    ],
    requiredShape: {
      title: "string",
      summary: "string",
      concepts: ["string"],
      peopleWorksCases: ["string"],
      controversies: ["string"],
      extensionDirections: ["string"],
      searchKeywords: ["string"],
      interestProfile: interestProfileSchema,
      curatorMessage: "string",
      knowledgeCards: [
        {
          title: "string",
          concept: "string",
          summary: "string",
          extractionReason: "string",
          explorationValue: "string",
          suggestedQuery: "string",
        },
      ],
    },
    content: {
      source: parsed.source,
      title: parsed.title,
      author: parsed.author,
      url: parsed.url,
      contentExcerpt: parsed.contentExcerpt,
      isFullText: parsed.isFullText,
      basedOnUserText: parsed.basedOnUserText,
      hotItem: hotItem ? {
        title: hotItem.title,
        excerpt: hotItem.excerpt,
        tag: hotItem.tag,
      } : null,
    },
  });
}
