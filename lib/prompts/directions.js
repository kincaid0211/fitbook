import { compactRouteForContext, directionSchema, interestProfileSchema } from "./_shared.js";

export function buildDirectionsUserPayload({ currentStep, route, interestProfile }) {
  return JSON.stringify({
    node: "generate_directions",
    task: "为当前章生成 3 个下一章方向，并刷新兴趣画像。3 个方向必须互相区分，至少包含一个「意外发现」选项。",
    requirements: [
      "directions 恰好 3 条。",
      "每条 directionType 在 {深入, 跨界, 人物作品案例, 观点挑战, 回到生活, 意外发现} 中取值，3 条不能全部相同。",
      "至少 1 条 directionType = 意外发现。",
      "label 4–10 字，作为按钮标题。",
      "text 一句方向说明，15–45 字。",
      "reason 一句推荐理由，30–80 字，要结合当前章或已有章节线索。",
      "zhihuQuery 6–14 字关键词，适合知乎搜索，不要长句。",
      "globalQuery 6–14 字关键词，适合全网搜索；与 zhihuQuery 不能完全相同。",
      "禁止推荐已在 route 中出现的标题或链接。",
      "interestProfile 在已有画像基础上增量更新，不删除既有字段。",
      "curatorMessage 一句方向引导语，不要重复列举三个方向。",
    ],
    requiredShape: {
      directions: [directionSchema],
      interestProfile: interestProfileSchema,
      curatorMessage: "string",
    },
    currentStep,
    route: compactRouteForContext(route),
    interestProfile: interestProfile || {},
  });
}
