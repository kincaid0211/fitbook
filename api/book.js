import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { callModelJson } from "../lib/model.js";
import {
  curatorSystem,
  getNodeConfig,
  nodePrompt,
  buildBookUserPayload,
} from "../lib/prompts.js";

function fallbackBookPayload(route) {
  const chapterCount = route.length;
  const firstStep = route[0] || {};
  const lastStep = route[route.length - 1] || {};
  const allConcepts = route.flatMap((s) => s.concepts || []);
  const uniqueConcepts = [...new Set(allConcepts)].filter(Boolean);

  const mainTheme = firstStep.concepts?.[0] || firstStep.title || "主题";
  const title = `${mainTheme.slice(0, 10)}的${chapterCount}章阅读`;
  const subtitle = `从「${firstStep.title?.slice(0, 12) || "起点"}」出发，经${chapterCount}站探索，最终抵达「${lastStep.title?.slice(0, 12) || "终点"}」。`;

  const preface = `这本非书从「${firstStep.title || "一篇文章"}」出发，经过${chapterCount}站策展阅读，逐步从起点走向更丰富的视角。每一章的选择都反映了阅读过程中的兴趣推进，最终形成一条独特的知识路径。`;

  const tags = uniqueConcepts.slice(0, 6).map((c) => c.slice(0, 6));
  const style = chapterCount >= 8 ? "围绕核心主题的深度阅读" : "自由漫游式探索阅读";

  const explorationSummary =
    `阅读路径跨越${chapterCount}章，从「${firstStep.title?.slice(0, 10) || "起点"}」出发，最终抵达「${lastStep.title?.slice(0, 10) || "终点"}」。` +
    (chapterCount >= 8
      ? "这是一条聚焦型深度阅读路径，围绕核心主题逐层深入。"
      : "这是一条开放型探索路径，在不同视角间自由切换。");

  const sourceAuthors = [...new Set(route.map((s) => s.author).filter(Boolean))];

  return {
    ok: true,
    fallback: true,
    book: {
      id: `book_${Date.now()}`,
      title,
      subtitle,
      preface,
      tags,
      style,
      explorationSummary,
      sourceAuthors,
      steps: route,
      createdAt: new Date().toLocaleString("zh-CN"),
    },
    message: "非书已生成（本地基础版本）。",
    model: "fallback",
    provider: "local",
  };
}

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
    const route = Array.isArray(body?.route) ? body.route : [];
    if (route.length > 0) {
      sendJson(res, 200, fallbackBookPayload(route));
      return;
    }
    handleApiError(res, error, "非书生成失败。");
  }
}
