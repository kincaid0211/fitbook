export const aiConfigStorageKey = "feishu-ai-node-config";

export const aiNodeDefaults = {
  start: {
    label: "起点理解",
    description: "解析并理解用户提供的起点文章或文本，提炼摘要、关键概念、争议点、可延展方向和初始兴趣画像。",
    provider: "siliconflow",
    model: "Pro/moonshotai/Kimi-K2.6",
    temperature: 0.25,
    timeoutSeconds: 60,
    prompt:
      "理解用户给出的文章或文本片段，提炼摘要、关键概念、争议点、可延展方向和初始兴趣画像。输出要短、准、适合开启阅读路线。",
  },
  directions: {
    label: "下一站方向",
    description: "基于当前站内容、路线历史和兴趣画像，生成 3 个互相区分的下一站探索方向，至少包含一个意外发现选项。",
    provider: "siliconflow",
    model: "Pro/moonshotai/Kimi-K2.6",
    temperature: 0.35,
    timeoutSeconds: 45,
    prompt:
      "基于当前站、路线历史和兴趣画像，生成 3 个下一站方向。方向必须互相区分，并至少包含一个意外发现选项。",
  },
  choose: {
    label: "章节导读与知识桥",
    description: "用户选择候选内容后，生成章节导读、知识桥、策展人反馈，并更新兴趣画像。",
    provider: "siliconflow",
    model: "Pro/moonshotai/Kimi-K2.6",
    temperature: 0.35,
    timeoutSeconds: 75,
    prompt:
      "用户已经选择候选内容。生成章节导读、知识桥、策展人反馈和更新后的兴趣画像。不要重写全文，只做导读和连接。",
  },
  book: {
    label: "非书生成",
    description: "把已完成的阅读路线包装成一本「非书」，生成书名、序言、目录、章节导读、路线标签和探索总结。",
    provider: "siliconflow",
    model: "Pro/moonshotai/Kimi-K2.6",
    temperature: 0.45,
    timeoutSeconds: 90,
    prompt:
      "把已完成路线包装成一本非书，生成书名、副标题、序言、目录、章节导读、路线标签和探索总结。不要补造未读章节。",
  },
  cover: {
    label: "封面方案",
    description: "为非书生成结构化封面概念，包括主视觉、色彩、构图和图像生成提示词，不生成真实图片。",
    provider: "siliconflow",
    model: "Pro/moonshotai/Kimi-K2.6",
    temperature: 0.55,
    timeoutSeconds: 45,
    prompt:
      "为非书生成稳定 CSS 封面组件可用的封面方案，包括主视觉、色彩、构图和图像生成提示词。不生成真实图片。",
  },
};

export function mergeAiConfig(config = {}) {
  return Object.fromEntries(
    Object.entries(aiNodeDefaults).map(([key, defaults]) => [
      key,
      {
        ...defaults,
        ...(config[key] || {}),
        key,
      },
    ]),
  );
}
