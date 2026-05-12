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
        task: "用户选择了候选内容。生成新的章节导读、知识桥和更新后的兴趣画像。章节不是全文重写，而是导读和原文入口。",
        requiredShape: {
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
          interestProfile: "object",
          curatorMessage: "string",
        },
        previousStep: body.previousStep,
        selectedCandidate: body.candidate,
        route: compactRoute(body.route),
        interestProfile: body.interestProfile || {},
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
