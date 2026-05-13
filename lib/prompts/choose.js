import {
  compactRouteForContext,
  directionSchema,
  interestProfileSchema,
  directionsBaseRequirements,
} from "./_shared.js";

export function buildChooseWithDirectionsUserPayload({
  previousStep,
  candidate,
  route,
  interestProfile,
  isLastStep = false,
  chapterProgress,
}) {
  const baseRequirements = [
    "step.title 必须与 selectedCandidate.title 一致。",
    "step.author 来自 selectedCandidate.author / source；没有写 \"未知\"。",
    "step.url 必须与 selectedCandidate.url 一致，不要替换。",
    "step.sourceType 取值：zhihu | global | user_text | external，依据 selectedCandidate 的来源。",
    "step.summary 是「导读式」摘要，60–160 字。必须覆盖：候选讲了什么核心内容 / 为什么重要 / 有什么值得继续追问的细节钩子。禁止全文重写。",
    "step.concepts 3–5 个，每个 6–14 字，从候选内容实质提炼，不是从标题机械提取。",
    "step.curatorNote 30–80 字。必须结合已有 route 线索，指出这一章的放置带来了什么新的张力或呼应。禁止泛泛评价（如「这章很好」）。",
    "step.originalEntryLabel 4–10 字按钮文案，例如「去读原文」「看这条回答」。",
    "bridge 60–140 字知识桥。必须回答三个问题：上一章留了什么线索/问题（引用具体概念）→ 本章从哪个角度接续（引用具体切入点）→ 读者视野发生了什么变化。禁止模板句（如「这一章延续了上一章的主题」）。",
    "interestProfile 增量更新，不删除既有字段。",
    "curatorMessage 一句反馈语，承接 bridge 的情绪，但禁止与 bridge 内容 verbatim 重复。",
  ];

  const lastStepExtra = isLastStep
    ? [
        "最后一章：语气带收束感，帮用户意识到 10 站线索已经成形。curatorMessage 可暗示「这是最后一站」，但不要直白说「这是最后一章」。bridge 可轻轻回顾起点或前几章的呼应。",
      ]
    : [];

  const directionsRequirements = isLastStep ? [] : directionsBaseRequirements();

  const requiredShape = {
    step: {
      title: "string",
      author: "string",
      url: "string",
      sourceType: "zhihu|global|user_text|external",
      summary: "string",
      concepts: ["string"],
      curatorNote: "string",
      originalEntryLabel: "string",
    },
    bridge: "string",
    interestProfile: interestProfileSchema,
    curatorMessage: "string",
    ...(isLastStep ? {} : {
      directions: [directionSchema],
      nextCuratorMessage: "string",
    }),
  };

  return JSON.stringify({
    node: isLastStep ? "generate_bridge" : "generate_bridge_and_directions",
    task: isLastStep
      ? "用户选择了候选内容。生成新一章的章节导读、知识桥与策展反馈，并更新兴趣画像。这是最后一章（第10站），不需要生成下一章方向。语气带收束感。"
      : "用户选择了候选内容。先生成新一章的章节导读、知识桥与策展反馈并更新兴趣画像；然后基于新的章节线索，生成 3 个下一章方向。",
    requirements: [...baseRequirements, ...lastStepExtra, ...directionsRequirements],
    requiredShape,
    previousStep,
    selectedCandidate: candidate,
    route: compactRouteForContext(route),
    interestProfile: interestProfile || {},
    chapterProgress: chapterProgress || {},
  });
}
