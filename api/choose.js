import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { callModelJson } from "../lib/model.js";
import {
  curatorSystem,
  getNodeConfig,
  nodePrompt,
  buildChooseUserPayload,
} from "../lib/prompts.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  try {
    const body = await readJson(req);
    const nodeConfig = getNodeConfig(body, "choose");
    const result = await callModelJson({
      system: nodePrompt(curatorSystem, nodeConfig),
      nodeConfig,
      user: buildChooseUserPayload({
        previousStep: body.previousStep,
        candidate: body.candidate,
        route: body.route,
        interestProfile: body.interestProfile,
      }),
    });

    if (!result.data.step?.title || !result.data.bridge) {
      const error = new Error("AI 没有生成有效章节。");
      error.statusCode = 502;
      error.publicMessage = "章节导读生成失败，请重试。";
      throw error;
    }

    sendJson(res, 200, {
      ok: true,
      step: {
        ...result.data.step,
        bridge: result.data.bridge,
        directions: [],
      },
      bridge: result.data.bridge,
      interestProfile: result.data.interestProfile || body.interestProfile || {},
      curatorMessage: result.data.curatorMessage || "这一站已经装进你的路线。",
      model: result.model,
      provider: result.provider,
    });
  } catch (error) {
    handleApiError(res, error, "章节导读生成失败。");
  }
}
