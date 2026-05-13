import { interestProfileSchema } from "./_shared.js";

export function buildBookUserPayload({ route, interestProfile }) {
  return JSON.stringify({
    node: "generate_feishu_book_meta",
    task: "为已完成章节生成非书的元信息（书名、序言、标签等）。章节数据已由服务端提供，不需要你重写。",
    requirements: [
      "title 8–18 字书名，点出本书的主题或视角。",
      "subtitle 14–28 字副标题，呼应章节线索的风格。",
      "preface 100–180 字序言，说明这些章节怎么连起来、读者会得到什么。",
      "tags 3–6 个 2–6 字章节线索标签。",
      "style 6–18 字章节线索风格总结。",
      "explorationSummary 80–140 字探索总结，复盘读过的章节。",
      "sourceAuthors 列出所有原文作者/来源，去重；空写 []。",
    ],
    requiredShape: {
      title: "string",
      subtitle: "string",
      preface: "string",
      tags: ["string"],
      style: "string",
      explorationSummary: "string",
      sourceAuthors: ["string"],
    },
    routeSummary: route.map((step, index) => ({
      index: index + 1,
      title: step.title,
      concepts: (step.concepts || []).slice(0, 3),
      bridge: (step.bridge || "").slice(0, 60),
    })),
    chapterCount: route.length,
    interestProfile: interestProfile || {},
  });
}
