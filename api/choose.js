import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { callModelJson } from "../lib/model.js";
import {
  curatorSystem,
  getNodeConfig,
  nodePrompt,
  buildChooseWithDirectionsUserPayload,
} from "../lib/prompts.js";

function fallbackDirections(step) {
  const concepts = Array.isArray(step.concepts) ? step.concepts : [];
  const main = concepts[0] || step.title || "这一章";
  return [
    {
      label: "继续深入",
      text: `继续拆解「${main}」背后的关键问题`,
      reason: "这一章已经给出清晰入口，继续深入能把概念、证据和判断关系读得更完整。",
      zhihuQuery: main,
      globalQuery: `${main} 背景`,
      directionType: "深入",
    },
    {
      label: "换个角度",
      text: "寻找一个相邻视角，重新理解前面章节",
      reason: "换一个视角能避免章节线索过早收窄，也能帮助用户判断这条线索是否真正成立。",
      zhihuQuery: `${main} 争议`,
      globalQuery: `${main} 不同观点`,
      directionType: "观点挑战",
    },
    {
      label: "回到生活",
      text: "把这一章放回日常经验和具体案例",
      reason: "回到生活能让抽象理解变得更容易使用，也让非书更适合继续阅读和分享。",
      zhihuQuery: `${main} 案例`,
      globalQuery: `${main} 应用`,
      directionType: "回到生活",
    },
  ];
}

function fallbackChoosePayload(body) {
  const candidate = body?.candidate || {};
  const previousStep = body?.previousStep || {};
  const concepts = (candidate.fitTags?.length ? candidate.fitTags : candidate.concepts || [])
    .filter(Boolean)
    .slice(0, 5);
  const title = candidate.curatedTitle || candidate.title || "新的章节";
  const bridge =
    candidate.connection ||
    candidate.bridgePreview ||
    `这一章接住「${previousStep.title || "上一章"}」留下的问题，继续把阅读推进到更具体的内容。`;
  const summary =
    candidate.readerGain ||
    candidate.summary ||
    "这一章提供了一个可以继续阅读的入口，帮助你判断当前线索是否值得收入非书。";
  const step = {
    title,
    author: candidate.author || candidate.sourceLabel || candidate.source || "资料来源",
    url: candidate.url || "",
    sourceType: candidate.sourceType || "external",
    summary,
    concepts: concepts.length ? concepts : ["下一章", "章节衔接", "继续阅读"],
    curatorNote: candidate.readerGain || "这一章已经根据候选内容整理为导读式章节。",
    originalEntryLabel: candidate.sourceType === "zhihu" ? "去读原文" : "查看来源",
    bridge,
  };

  return {
    ok: true,
    fallback: true,
    step: {
      ...step,
      directions: fallbackDirections(step),
    },
    bridge,
    directions: fallbackDirections(step),
    interestProfile: body?.interestProfile || {},
    curatorMessage: "这一章已收入你的非书。",
    nextCuratorMessage: "你可以选择一个方向继续。",
    model: "fallback",
    provider: "local",
  };
}

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  let body = {};

  try {
    body = await readJson(req);
    const configuredNode = getNodeConfig(body, "choose") || { key: "choose" };
    const nodeConfig = {
      ...configuredNode,
      timeoutSeconds: Math.min(45, Number(configuredNode.timeoutSeconds || 45)),
    };
    const route = Array.isArray(body.route) ? body.route : [];
    const isLastStep = route.length >= 9;

    const result = await callModelJson({
      system: nodePrompt(curatorSystem, nodeConfig),
      nodeConfig,
      user: buildChooseWithDirectionsUserPayload({
        previousStep: body.previousStep,
        candidate: body.candidate,
        route,
        interestProfile: body.interestProfile,
        isLastStep,
      }),
    });

    if (!result.data.step?.title || !result.data.bridge) {
      const error = new Error("AI 没有生成有效章节。");
      error.statusCode = 502;
      error.publicMessage = "章节导读生成失败，请重试。";
      throw error;
    }

    if (!isLastStep && (!Array.isArray(result.data.directions) || result.data.directions.length < 3)) {
      const error = new Error("AI 没有生成足够的下一章方向。");
      error.statusCode = 502;
      error.publicMessage = "下一章方向生成失败，请重试。";
      throw error;
    }

    sendJson(res, 200, {
      ok: true,
      step: {
        ...result.data.step,
        bridge: result.data.bridge,
        directions: isLastStep ? [] : (result.data.directions || []),
      },
      bridge: result.data.bridge,
      directions: isLastStep ? [] : (result.data.directions || []),
      interestProfile: result.data.interestProfile || body.interestProfile || {},
      curatorMessage: result.data.curatorMessage || "这一章已经收入你的非书。",
      nextCuratorMessage: isLastStep ? "" : (result.data.nextCuratorMessage || "你可以选择一个方向继续。"),
      model: result.model,
      provider: result.provider,
    });
  } catch (error) {
    if (body?.candidate && Number(error.statusCode || 500) >= 500) {
      sendJson(res, 200, fallbackChoosePayload(body));
      return;
    }
    handleApiError(res, error, "章节导读生成失败。");
  }
}
