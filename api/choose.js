import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { callModelJson } from "../lib/model.js";
import {
  curatorSystem,
  getNodeConfig,
  nodePrompt,
  buildChooseWithDirectionsUserPayload,
  fallbackDirections,
} from "../lib/prompts.js";

function fallbackChoosePayload(body) {
  const candidate = body?.candidate || {};
  const previousStep = body?.previousStep || {};
  const concepts = (candidate.fitTags?.length
    ? candidate.fitTags
    : candidate.concepts || []
  )
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
  const route = Array.isArray(body?.route) ? body.route : [];
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
      directions: fallbackDirections(step, route.length, body?.interestProfile || {}),
    },
    bridge,
    directions: fallbackDirections(step, route.length, body?.interestProfile || {}),
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
    const configuredNode = getNodeConfig(body, "choose") || { key: "choose", timeoutSeconds: 25 };
    const nodeConfig = {
      ...configuredNode,
      timeoutSeconds: Math.min(45, Number(configuredNode.timeoutSeconds || 25)),
    };
    const route = Array.isArray(body.route) ? body.route : [];
    const isLastStep = route.length >= 9;
    const chapterProgress = body.chapterProgress || {
      currentIndex: route.length,
      maxSteps: 10,
    };

    const result = await callModelJson({
      system: nodePrompt(curatorSystem, nodeConfig),
      nodeConfig,
      user: buildChooseWithDirectionsUserPayload({
        previousStep: body.previousStep,
        candidate: body.candidate,
        route,
        interestProfile: body.interestProfile,
        isLastStep,
        chapterProgress,
      }),
    });

    const data = result.data;

    // 字段缺失容错补全
    if (!data.step) data.step = {};
    if (!data.step.title) data.step.title = body.candidate?.title || "下一章";
    if (!data.step.author) data.step.author = body.candidate?.author || body.candidate?.sourceLabel || "资料来源";
    if (!data.step.url) data.step.url = body.candidate?.url || "";
    if (!data.step.sourceType) data.step.sourceType = body.candidate?.sourceType || "external";
    if (!data.step.summary) data.step.summary = body.candidate?.summary || "这一章提供了一个可以继续阅读的入口。";
    if (!Array.isArray(data.step.concepts)) {
      data.step.concepts = (body.candidate?.fitTags || body.candidate?.concepts || []).filter(Boolean).slice(0, 5);
    }
    if (!data.step.curatorNote) data.step.curatorNote = "这一章已经根据候选内容整理为导读式章节。";
    if (!data.step.originalEntryLabel) {
      data.step.originalEntryLabel = body.candidate?.sourceType === "zhihu" ? "去读原文" : "查看来源";
    }
    if (!data.bridge) {
      data.bridge = `从「${body.previousStep?.title || "上一章"}」到「${data.step.title}」的知识桥。`;
    }
    if (!data.interestProfile) data.interestProfile = body.interestProfile || {};
    if (!data.curatorMessage) data.curatorMessage = "这一章已收入你的非书。";

    if (!isLastStep) {
      if (!Array.isArray(data.directions) || data.directions.length < 3) {
        data.directions = fallbackDirections(data.step, route.length, body.interestProfile || {});
      }
      if (!data.nextCuratorMessage) data.nextCuratorMessage = "你可以选择一个方向继续。";
    }

    // 最终校验
    if (!data.step.title) {
      const error = new Error("AI 没有生成有效章节。");
      error.statusCode = 502;
      error.publicMessage = "章节导读生成失败，请重试。";
      throw error;
    }

    sendJson(res, 200, {
      ok: true,
      step: {
        ...data.step,
        bridge: data.bridge,
        directions: isLastStep ? [] : (data.directions || []),
      },
      bridge: data.bridge,
      directions: isLastStep ? [] : (data.directions || []),
      interestProfile: data.interestProfile || body.interestProfile || {},
      curatorMessage: data.curatorMessage || "这一章已经收入你的非书。",
      nextCuratorMessage: isLastStep ? "" : (data.nextCuratorMessage || "你可以选择一个方向继续。"),
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
