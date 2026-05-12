# 非书

读出自己的书。

「非书」是一个面向知乎黑客松的 H5/Web 原型。它从任意一篇文章或一段文本出发，由 AI 知识策展人陪用户选择下一站，在知乎与全网内容中生成自己的知识读本。

产品希望重新设计知识内容的阅读方式：用户不是被动刷到下一篇，而是围绕自己的兴趣起点，在问题、回答、文章、观点和背景资料之间持续探索，突破熟悉的信息边界，并把阅读过程沉淀为可保存、可分享、可推荐的「非书」。

Logo 已定稿并保存在 `assets/feishu-logo.png`，演示页面导航栏会使用该横版品牌标识。

核心 AI 功能逻辑已整理在 [docs/AI_FUNCTION_LOGIC.md](docs/AI_FUNCTION_LOGIC.md)。主流程和 Kimi / Vercel 技术方案已整理在 [docs/TECHNICAL_PLAN.md](docs/TECHNICAL_PLAN.md)。关键页面 UI 视觉稿已整理在 [docs/UI_VISUALS.md](docs/UI_VISUALS.md)，包含落地页、我的非书和非书详情页。

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

## Deployment Plan

The confirmed implementation plan uses Vercel as the official deployment target:

- `/` as the public demo entry.
- `/admin.html` as the standalone AI node configuration page.
- `/api/*` as Vercel Serverless Functions.
- Kimi `kimi-k2.6` as the LLM backend.
- `dist/demo.html` as a backup standalone demo.

Required environment variables:

```text
MOONSHOT_API_KEY=...
KIMI_BASE_URL=https://api.moonshot.cn/v1
KIMI_MODEL=kimi-k2.6
ZHIHU_ACCESS_SECRET=...
SILICONFLOW_API_KEY=...
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=Pro/moonshotai/Kimi-K2.6
```

## Notes

- The current demo uses mock data to guarantee a stable hackathon presentation.
- The prototype now presents article-link or pasted-text starts, AI-curated directions, candidate selection, early book generation, chapter-guide boundaries, and cover concept generation.
- The first real API flow is implemented under `/api/*`: start, directions, candidates, choose, book, and cover.
- Candidate lists are currently generated from Zhihu/global search results with stable server-side rules; Kimi generates directions, chapter guides, bridges, books, and cover concepts.
- AI node prompts and model choices can be edited at `/admin.html`; settings are stored in browser localStorage and sent with API requests.
- AI prompts have been consolidated in `lib/prompts.js`: a strengthened curator system prompt plus five node user-payload builders enforce field shape, length limits, direction-type diversity, candidate fidelity, and `chapters.length === route.length`. Verified end-to-end against SiliconFlow `Pro/moonshotai/Kimi-K2.6` on 2026-05-12.
- Long-running AI steps show explicit progress messages and elapsed waiting time.
- SiliconFlow can be used as a test or backup OpenAI-compatible model provider.
- Kimi/API failures should show a clear failure message instead of silently falling back to mock data.
- Sensitive local notes and API materials under `note/` are intentionally excluded from Git.
- See [PROJECT_GUIDE.md](PROJECT_GUIDE.md) for the file structure, deployment flow, update log, and documentation maintenance rules.
- See [CLAUDE.md](CLAUDE.md) for the Claude Code working context, technical stack cheat sheet, current progress snapshot, and collaboration conventions.
