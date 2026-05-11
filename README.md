# 非书

读出自己的书。

「非书」是一个面向知乎黑客松的 H5/Web 原型。它从一个知乎问题出发，在启发式阅读和主动探索中生成用户自己的知识读本。

产品希望重新设计知乎内容的阅读方式：用户不是被动刷到下一篇，而是围绕自己的兴趣起点，在问题、回答、文章和观点之间持续探索，突破熟悉的信息边界，并把阅读过程沉淀为可保存、可分享、可推荐的「非书」。

Logo 已定稿并保存在 `assets/feishu-logo.png`，演示页面导航栏会使用该横版品牌标识。

关键页面 UI 视觉稿已整理在 [docs/UI_VISUALS.md](docs/UI_VISUALS.md)，包含落地页、我的非书和非书详情页。

## Run

```bash
npm run build:standalone
```

Then open:

```text
dist/demo.html
```

If local port listening is available:

```bash
npm run dev
```

## Notes

- The current demo uses mock data to guarantee a stable hackathon presentation.
- Sensitive local notes and API materials under `note/` are intentionally excluded from Git.
- See [PROJECT_GUIDE.md](PROJECT_GUIDE.md) for the file structure, deployment flow, update log, and documentation maintenance rules.
