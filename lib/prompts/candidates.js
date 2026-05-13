import { compactRouteForContext } from "./_shared.js";

export function buildCurateCandidatesPayload({ currentStep, direction, candidates, route, interestProfile }) {
  return JSON.stringify({
    node: "curate_candidates",
    task: "为 2-3 个搜索候选生成策展式包装信息，让候选列表看起来像策展人的推荐单。",
    requirements: [
      "candidates 数组长度与输入 candidates 一致，逐一对应。",
      "每个候选的 curatedTitle 6-20 字，重新提炼切入点，不能照搬原始标题。",
      "curatorPreview 40-80 字，说明核心内容、挑选理由、与当前方向的契合点。",
      "connection 30-60 字，具体承接上一章的概念/问题，说明本章延展点。非模板化。",
      "readerGain 30-60 字，预告阅读后的认知收获。",
      "fitTags 2-4 个 2-6 字标签，基于内容实质。",
      "保持术语与上一章一致。",
      "三篇候选的包装互相区分，代表不同切入角度。",
      "不编造候选摘要中未提及的细节。",
    ],
    requiredShape: {
      candidates: [
        {
          curatedTitle: "string",
          curatorPreview: "string",
          connection: "string",
          readerGain: "string",
          fitTags: ["string"],
        },
      ],
    },
    currentStep: {
      title: currentStep?.title || "",
      summary: currentStep?.summary || "",
      concepts: currentStep?.concepts || [],
    },
    direction: {
      label: direction?.label || "",
      text: direction?.text || "",
      reason: direction?.reason || "",
      directionType: direction?.directionType || "",
    },
    inputCandidates: candidates.map((c) => ({
      originalTitle: c.title || "",
      author: c.author || "",
      sourceLabel: c.sourceLabel || "",
      summary: c.summary || "",
      url: c.url || "",
    })),
    routeContext: compactRouteForContext(route || []).slice(-2),
    interestProfile: interestProfile || {},
  });
}
