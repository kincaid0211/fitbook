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
    "step.author 来自 selectedCandidate.author / source；没有写 \"。",
    "step.url 必须与 selectedCandidate.url 一致，不要替换。",
    "step.sourceType 取值：zhihu | global | user_text | external，依据 selectedCandidate 的来源。",
    "step.summary 是「导读式」摘要，60–160 字，覆盖候选讲了什么、为何重要、有什么细节钩子；不要重写正文。",
    "step.concepts 3–5 个，每个 6–14 字。",
    "step.curatorNote 30–80 字策展点评，可指出候选与已有章节线索的契合或张力。",
    "step.originalEntryLabel 4–10 字按钮文案，例如「去读原文」「看这条回答」。",
    "bridge 60–140 字知识桥，需覆盖：上一章关键点 / 本章延展点 / 视野变化。",
    "interestProfile 增量更新，不删除既有字段。",
    "curatorMessage 一句反馈语，承接 bridge，不要重复 bridge 内容。",
  ];

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
      ? "用户选择了候选内容。生成新一章的章节导读、知识桥与策展反馈，并更新兴趣画像。这是最后一章，不需要生成下一章方向。"
      : "用户选择了候选内容。先生成新一章的章节导读、知识桥与策展反馈并更新兴趣画像；然后基于新的章节线索，生成 3 个下一章方向。",
    requirements: [...baseRequirements, ...directionsRequirements],
    requiredShape,
    previousStep,
    selectedCandidate: candidate,
    route: compactRouteForContext(route),
    interestProfile: interestProfile || {},
    chapterProgress: chapterProgress || {},
  });
}
