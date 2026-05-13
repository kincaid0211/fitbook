import { interestProfileSchema } from "./_shared.js";

export function buildBookUserPayload({ route, interestProfile }) {
  const requirements = [
    "title 8–18 字书名，点出主题 + 视角/调性。避免教科书风格（如「XX入门」「XX指南」「XX基础」「XX概论」）。示例：好=「被算法驯化的注意力」差=「信息茧房入门指南」",
    "subtitle 14–28 字副标题，呼应章节线索的风格。可以提及章节数量、探索跨度或核心张力。",
    "preface 100–180 字序言。结构建议：①从起点出发（用户最初关注什么）②线索推进（引用 1-2 个关键知识桥说明视野变化）③阅读收获（这条路径的独特价值）。禁止写成每章摘要的堆砌。",
    "tags 3–6 个 2–6 字章节线索标签。必须是这条具体路径的特征标签，不是通用分类。示例：好=[「算法驯化」「注意力经济」「跨界阅读」] 差=[「心理学」「技术」「社会」]",
    "style 6–18 字章节线索风格总结，概括探索气质。示例：「从机制分析走向日常体验的跨界阅读」",
    "explorationSummary 80–140 字探索总结。复盘关键视角转换，不是流水账。可结合 interestProfile 点出用户探索风格。",
    "sourceAuthors 列出 route 中所有原文作者/来源，去重；空写 []。",
  ];

  return JSON.stringify({
    node: "generate_feishu_book_meta",
    task: "为已完成章节生成非书的元信息（书名、序言、标签等）。章节数据已由服务端提供，不需要你重写。序言和探索总结应充分利用每章的 bridge（知识桥）、summary（章节导读）和 curatorNote（策展点评）来串联线索，体现这条路径的独特性，不要仅依赖标题。",
    requirements,
    requiredShape: {
      title: "string",
      subtitle: "string",
      preface: "string",
      tags: ["string"],
      style: "string",
      explorationSummary: "string",
      sourceAuthors: ["string"],
    },
    route: route.map((step, index) => ({
      index: index + 1,
      title: step.title,
      author: step.author,
      concepts: step.concepts || [],
      bridge: (step.bridge || "").slice(0, 120),
      summary: (step.summary || "").slice(0, 80),
      curatorNote: (step.curatorNote || "").slice(0, 50),
      sourceType: step.sourceType || "unknown",
    })),
    chapterCount: route.length,
    interestProfile: interestProfile || {},
  });
}
