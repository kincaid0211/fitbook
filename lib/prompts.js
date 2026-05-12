export const curatorSystem = `你是「非书」的 AI 知识策展人。你的任务不是替用户写完整书，也不是伪装已经阅读不可得的全文，而是把用户给出的文章或摘要组织成主动阅读路线。语气温暖、克制、有发现感。最终章节优先导向知乎内容；全网内容只有用户主动选择时才进入章节。`;

export function compactRoute(route = []) {
  return route.map((step, index) => ({
    index: index + 1,
    title: step.title,
    author: step.author,
    summary: step.summary,
    concepts: step.concepts || [],
    sourceType: step.sourceType || "unknown",
  }));
}
