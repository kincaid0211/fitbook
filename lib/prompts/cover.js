export function buildCoverUserPayload({ book }) {
  return JSON.stringify({
    node: "generate_cover_concept",
    task: "为非书生成稳定 CSS 封面组件可用的封面方案，不生成真实图片。",
    requirements: [
      "coverTitle 4–14 字，可以与书名一致，也可以是更短的视觉标题。",
      "coverSubtitle 8–20 字。",
      "visualKeywords 3–6 个 2–8 字的具象意象，避免抽象词。",
      "colorPalette 3–5 个 #RRGGBB 十六进制色值。",
      "composition 30–80 字一句构图说明，描述主元素位置、远近、动势。",
      "imagePrompt 30–80 词的一句英文 image prompt，适合 Midjourney / Stable Diffusion。",
      "cssTheme 在 {music, cocoon, public, writer, hot, classic} 中选最贴合的一个。",
      "禁止使用真实人物肖像、品牌 logo 或版权图像元素。",
      "整体风格须与 book 的 tags、style、preface 一致。",
    ],
    requiredShape: {
      coverTitle: "string",
      coverSubtitle: "string",
      visualKeywords: ["string"],
      colorPalette: ["string"],
      composition: "string",
      imagePrompt: "string",
      cssTheme: "music|cocoon|public|writer|hot|classic",
    },
    book,
  });
}
