import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { parseStartContent } from "../lib/parser.js";
import { callModelJson } from "../lib/model.js";
import {
  curatorSystem,
  getNodeConfig,
  nodePrompt,
  buildStartUserPayload,
} from "../lib/prompts.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  try {
    const body = await readJson(req);
    const nodeConfig = getNodeConfig(body, "start");
    const parsed = await parseStartContent({ url: body.url || "", text: body.text || "" });

    const result = await callModelJson({
      system: nodePrompt(curatorSystem, nodeConfig),
      nodeConfig,
      user: buildStartUserPayload({ parsed }),
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
      needsUserText: parsed.needsUserText,
      parseWarning: parsed.parseWarning || "",
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
