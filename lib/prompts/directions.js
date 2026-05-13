import {
  compactRouteForContext,
  directionSchema,
  interestProfileSchema,
  directionsBaseRequirements,
  chapterProgressHint,
} from "./_shared.js";

export function buildDirectionsUserPayload({ currentStep, route, interestProfile, chapterProgress }) {
  const progressHint = chapterProgressHint(
    chapterProgress?.currentIndex,
    chapterProgress?.maxSteps
  );

  return JSON.stringify({
    node: "generate_directions",
    task: `为当前章生成 3 个下一章方向，并刷新兴趣画像。3 个方向必须互相区分，至少包含一个「意外发现」选项。\n\n${progressHint}`,
    requirements: directionsBaseRequirements(),
    requiredShape: {
      directions: [directionSchema],
      interestProfile: interestProfileSchema,
      curatorMessage: "string",
    },
    currentStep,
    route: compactRouteForContext(route),
    interestProfile: interestProfile || {},
    chapterProgress: chapterProgress || {},
  });
}
