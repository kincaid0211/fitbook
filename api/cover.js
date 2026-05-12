import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { callModelJson } from "../lib/model.js";
import { curatorSystem } from "../lib/prompts.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  try {
    const body = await readJson(req);
    const result = await callModelJson({
      system: curatorSystem,
      user: JSON.stringify({
        task: "为非书生成稳定 CSS 封面组件可用的封面方案，不生成真实图片。",
        requiredShape: {
          coverTitle: "string",
          coverSubtitle: "string",
          visualKeywords: ["string"],
          colorPalette: ["string"],
          composition: "string",
          imagePrompt: "string",
          cssTheme: "music|cocoon|public|writer|hot|classic",
        },
        book: body.book,
      }),
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
