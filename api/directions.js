import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { callModelJson } from "../lib/model.js";
import {
  curatorSystem,
  getNodeConfig,
  nodePrompt,
  buildDirectionsUserPayload,
  fallbackDirections,
} from "../lib/prompts.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  try {
    const body = await readJson(req);
    const nodeConfig = getNodeConfig(body, "directions");
    const route = Array.isArray(body.route) ? body.route : [];
    const chapterProgress = body.chapterProgress || {
      currentIndex: route.length,
      maxSteps: 10,
    };

    const result = await callModelJson({
      system: nodePrompt(curatorSystem, nodeConfig),
      nodeConfig,
      user: buildDirectionsUserPayload({
        currentStep: body.currentStep,
        route,
        interestProfile: body.interestProfile,
        chapterProgress,
      }),
    });

    const directions = Array.isArray(result.data.directions)
      ? result.data.directions.slice(0, 3)
      : [];

    // 如果 AI 返回的方向不足 3 条，用 fallback 补全
    if (directions.length < 3) {
      const fallback = fallbackDirections(
        body.currentStep || {},
        route.length,
        body.interestProfile || {}
      );
      directions.push(...fallback.slice(directions.length, 3));
    }

    sendJson(res, 200, {
      ok: true,
      directions: directions.slice(0, 3),
      interestProfile: result.data.interestProfile || body.interestProfile || {},
      curatorMessage:
        result.data.curatorMessage || "你可以选择一个方向继续，也可以稍微拐向陌生处。",
      model: result.model,
      provider: result.provider,
    });
  } catch (error) {
    // AI 调用失败时，基于当前 step 生成本地默认方向
    const route = Array.isArray(body?.route) ? body.route : [];
    const fallback = fallbackDirections(
      body?.currentStep || {},
      route.length,
      body?.interestProfile || {}
    );
    sendJson(res, 200, {
      ok: true,
      directions: fallback,
      interestProfile: body?.interestProfile || {},
      curatorMessage: "AI 暂时有点卡，但我已经为你准备了几个可以继续的方向。",
      model: "fallback",
      provider: "local",
    });
  }
}
