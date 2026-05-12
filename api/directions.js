import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { callModelJson } from "../lib/model.js";
import { compactRoute, curatorSystem } from "../lib/prompts.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  try {
    const body = await readJson(req);
    const result = await callModelJson({
      system: curatorSystem,
      user: JSON.stringify({
        task: "基于当前站和已走路线生成 3 个下一站方向。必须包含一个略微跳出舒适区的意外发现选项。",
        requiredShape: {
          directions: [
            {
              label: "string",
              text: "string",
              reason: "string",
              zhihuQuery: "string",
              globalQuery: "string",
              directionType: "深入|跨界|人物作品案例|观点挑战|回到生活|意外发现",
            },
          ],
          interestProfile: "object",
          curatorMessage: "string",
        },
        currentStep: body.currentStep,
        route: compactRoute(body.route),
        interestProfile: body.interestProfile || {},
      }),
    });

    const directions = Array.isArray(result.data.directions) ? result.data.directions.slice(0, 3) : [];
    if (directions.length < 3) {
      const error = new Error("AI 没有生成足够的下一站方向。");
      error.statusCode = 502;
      error.publicMessage = "下一站方向生成失败，请重试。";
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
    handleApiError(res, error, "下一站方向生成失败。");
  }
}
