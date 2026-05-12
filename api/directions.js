import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { callModelJson } from "../lib/model.js";
import {
  curatorSystem,
  getNodeConfig,
  nodePrompt,
  buildDirectionsUserPayload,
} from "../lib/prompts.js";

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
    if (directions.length < 3) {
      const error = new Error("AI 没有生成足够的下一章方向。");
      error.statusCode = 502;
      error.publicMessage = "下一章方向生成失败，请重试。";
      throw error;
    }

    sendJson(res, 200, {
      ok: true,
      directions,
      interestProfile: result.data.interestProfile || body.interestProfile || {},
      curatorMessage: result.data.curatorMessage || "你可以选择一个方向继续，也可以稍微拐向陌生处。",
      model: result.model,
      provider: result.provider,
    });
  } catch (error) {
    handleApiError(res, error, "下一章方向生成失败。");
  }
}
