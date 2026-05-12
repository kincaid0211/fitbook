import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { parseStartContent } from "../lib/parser.js";
import { callModelJson } from "../lib/model.js";
import { curatorSystem } from "../lib/prompts.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  try {
    const body = await readJson(req);
    const parsed = await parseStartContent({ url: body.url || "", text: body.text || "" });

    const result = await callModelJson({
      system: curatorSystem,
      user: JSON.stringify({
        task: "理解用户起点内容，输出非书探索第一站。",
        requiredShape: {
          title: "string",
          summary: "string",
          concepts: ["string"],
          peopleWorksCases: ["string"],
          controversies: ["string"],
          extensionDirections: ["string"],
          searchKeywords: ["string"],
          interestProfile: {
            preferredAngles: ["string"],
            curiositySignals: ["string"],
            explorationStyle: "string",
          },
          curatorMessage: "string",
        },
        content: {
          source: parsed.source,
          title: parsed.title,
          author: parsed.author,
          url: parsed.url,
          contentExcerpt: parsed.contentExcerpt,
          isFullText: parsed.isFullText,
          basedOnUserText: parsed.basedOnUserText,
        },
      }),
    });

    const data = result.data;
    sendJson(res, 200, {
      ok: true,
      source: parsed.source,
      title: data.title || parsed.title || "未命名起点",
      author: parsed.author,
      url: parsed.url,
      contentExcerpt: parsed.contentExcerpt,
      isFullText: parsed.isFullText,
      basedOnUserText: parsed.basedOnUserText,
      understanding: {
        summary: data.summary || parsed.contentExcerpt.slice(0, 180),
        concepts: Array.isArray(data.concepts) ? data.concepts.slice(0, 6) : [],
        peopleWorksCases: Array.isArray(data.peopleWorksCases) ? data.peopleWorksCases : [],
        controversies: Array.isArray(data.controversies) ? data.controversies : [],
        extensionDirections: Array.isArray(data.extensionDirections) ? data.extensionDirections : [],
        searchKeywords: Array.isArray(data.searchKeywords) ? data.searchKeywords : [],
      },
      interestProfile: data.interestProfile || {},
      curatorMessage: data.curatorMessage || "我已经读到了一个可以展开的兴趣起点。",
      model: result.model,
      provider: result.provider,
    });
  } catch (error) {
    handleApiError(res, error, "起点解析失败。");
  }
}
