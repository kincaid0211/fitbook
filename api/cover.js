import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { callModelJson } from "../lib/model.js";
import {
  curatorSystem,
  getNodeConfig,
  nodePrompt,
  buildCoverUserPayload,
} from "../lib/prompts.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  try {
    const body = await readJson(req);
    const nodeConfig = getNodeConfig(body, "cover");
    const result = await callModelJson({
      system: nodePrompt(curatorSystem, nodeConfig),
      nodeConfig,
      user: buildCoverUserPayload({ book: body.book }),
    });

    sendJson(res, 200, {
      ok: true,
      coverConcept: result.data,
      message: "封面方案已经生成。",
      model: result.model,
      provider: result.provider,
    });
  } catch (error) {
    handleApiError(res, error, "封面方案生成失败。");
  }
}
