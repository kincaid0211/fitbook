import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { callModelJson } from "../lib/model.js";
import {
  curatorSystem,
  getNodeConfig,
  nodePrompt,
  buildDirectionsUserPayload,
} from "../lib/prompts.js";

function fallbackDirections(step) {
  const concepts = Array.isArray(step.concepts) ? step.concepts : [];
  const main = concepts[0] || step.title || "这一章";
  return [
    {
      label: "继续深入",
      text: `继续拆解「${main}」背后的关键问题`,
      reason: "这一章已经给出清晰入口，继续深入能把概念、证据和判断关系读得更完整。",
      zhihuQuery: main,
      globalQuery: `${main} 背景`,
      directionType: "深入",
    },
    {
      label: "换个角度",
      text: "寻找一个相邻视角，重新理解前面章节",
      reason: "换一个视角能避免章节线索过早收窄，也能帮助用户判断这条线索是否真正成立。",
      zhihuQuery: `${main} 争议`,
      globalQuery: `${main} 不同观点`,
      directionType: "观点挑战",
    },
    {
      label: "意外发现",
      text: `从「${main}」跳到相邻领域`,
      reason: "这一章的线索还可以向意外方向延展，让阅读保留跳出舒适区的机会。",
      zhihuQuery: `${main} 案例`,
      globalQuery: `${main} 应用`,
      directionType: "意外发现",
    },
  ];
}

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  try {
    const body = await readJson(req);
    const nodeConfig = getNodeConfig(body, "directions");
    const result = await callModelJson({
      system: nodePrompt(curatorSystem, nodeConfig),
      nodeConfig,
      user: buildDirectionsUserPayload({
        currentStep: body.currentStep,
        route: body.route,
        interestProfile: body.interestProfile,
      }),
    });

    const directions = Array.isArray(result.data.directions) ? result.data.directions.slice(0, 3) : [];

    // 如果 AI 返回的方向不足 3 条，用 fallback 补全
    if (directions.length < 3) {
      const fallback = fallbackDirections(body.currentStep || {});
      directions.push(...fallback.slice(directions.length, 3));
    }

    sendJson(res, 200, {
      ok: true,
      directions: directions.slice(0, 3),
      interestProfile: result.data.interestProfile || body.interestProfile || {},
      curatorMessage: result.data.curatorMessage || "你可以选择一个方向继续，也可以稍微拐向陌生处。",
      model: result.model,
      provider: result.provider,
    });
  } catch (error) {
    // AI 调用失败时，基于当前 step 生成本地默认方向，避免用户流程中断
    const fallback = fallbackDirections(body.currentStep || {});
    sendJson(res, 200, {
      ok: true,
      directions: fallback,
      interestProfile: body.interestProfile || {},
      curatorMessage: "AI 暂时有点卡，但我已经为你准备了几个可以继续的方向。",
      model: "fallback",
      provider: "local",
    });
  }
}
