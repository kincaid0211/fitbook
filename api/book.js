import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { callModelJson } from "../lib/model.js";
import {
  curatorSystem,
  getNodeConfig,
  nodePrompt,
  buildBookUserPayload,
} from "../lib/prompts.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  try {
    const body = await readJson(req);
    const nodeConfig = getNodeConfig(body, "book");
    const route = Array.isArray(body.route) ? body.route : [];
    if (route.length < 1) {
      const error = new Error("还没有可装订的章节，无法生成非书。");
      error.statusCode = 400;
      error.publicMessage = error.message;
      throw error;
    }

    const result = await callModelJson({
      system: nodePrompt(curatorSystem, nodeConfig),
      nodeConfig,
      user: buildBookUserPayload({
        route,
        interestProfile: body.interestProfile,
      }),
    });

    sendJson(res, 200, {
      ok: true,
      book: {
        id: `book_${Date.now()}`,
        title: result.data.title || "我读出的一本非书",
        subtitle: result.data.subtitle || `${route.length} 章串起的一本策展读本`,
        preface: result.data.preface || "",
        tags: Array.isArray(result.data.tags) ? result.data.tags : [],
        style: result.data.style || "AI 知识策展",
        explorationSummary: result.data.explorationSummary || "",
        steps: route,
        sourceAuthors: Array.isArray(result.data.sourceAuthors) ? result.data.sourceAuthors : [],
        createdAt: new Date().toLocaleString("zh-CN"),
      },
      message: "非书已经生成。",
      model: result.model,
      provider: result.provider,
    });
  } catch (error) {
    handleApiError(res, error, "非书生成失败。");
  }
}
