import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { callModelJson } from "../lib/model.js";
import { compactRoute, curatorSystem } from "../lib/prompts.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  try {
    const body = await readJson(req);
    const route = Array.isArray(body.route) ? body.route : [];
    if (route.length < 1) {
      const error = new Error("路线为空，无法生成非书。");
      error.statusCode = 400;
      error.publicMessage = error.message;
      throw error;
    }

    const result = await callModelJson({
      system: curatorSystem,
      user: JSON.stringify({
        task: "把已完成路线包装为一本非书。不要补造未读章节。章节为导读式内容，不替代原文全文。",
        requiredShape: {
          title: "string",
          subtitle: "string",
          preface: "string",
          tags: ["string"],
          style: "string",
          explorationSummary: "string",
          chapters: [
            {
              title: "string",
              author: "string",
              summary: "string",
              concepts: ["string"],
              bridge: "string",
              curatorNote: "string",
              url: "string",
            },
          ],
          sourceAuthors: ["string"],
        },
        route: compactRoute(route),
        fullRoute: route,
        interestProfile: body.interestProfile || {},
      }),
    });

    sendJson(res, 200, {
      ok: true,
      book: {
        id: `book_${Date.now()}`,
        title: result.data.title || "我读出的一本非书",
        subtitle: result.data.subtitle || `一条 ${route.length} 站的策展阅读路线`,
        preface: result.data.preface || "",
        tags: Array.isArray(result.data.tags) ? result.data.tags : [],
        style: result.data.style || "AI 知识策展",
        explorationSummary: result.data.explorationSummary || "",
        steps: Array.isArray(result.data.chapters) && result.data.chapters.length ? result.data.chapters : route,
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
