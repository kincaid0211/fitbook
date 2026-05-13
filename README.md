# 非书

读出自己的书。

「非书」是一个面向知乎黑客松的 H5/Web 原型。它从任意一篇文章或一段文本出发，由 AI 知识策展人陪用户选择下一章，在知乎与全网内容中生成自己的知识读本。

产品希望重新设计知识内容的阅读方式：用户不是被动刷到下一篇，而是围绕自己的兴趣起点，在问题、回答、文章、观点和背景资料之间持续探索，突破熟悉的信息边界，并把阅读过程沉淀为可保存、可分享、可推荐的「非书」。

Logo 已定稿并保存在 `assets/feishu-logo.png`，演示页面导航栏会使用该横版品牌标识。

核心 AI 功能逻辑已整理在 [docs/AI_FUNCTION_LOGIC.md](docs/AI_FUNCTION_LOGIC.md)。主流程和 Kimi / Vercel 技术方案已整理在 [docs/TECHNICAL_PLAN.md](docs/TECHNICAL_PLAN.md)。关键页面 UI 视觉稿已整理在 [docs/UI_VISUALS.md](docs/UI_VISUALS.md)，包含落地页、我的非书和非书详情页。持续更新时请参考 [docs/DESIGN_GUIDE.md](docs/DESIGN_GUIDE.md) 中的设计风格、中文排版和组件规范。

## 三种启动方式

1. **粘贴链接或文本**：在起点页输入任意文章链接，或直接粘贴标题、摘要和正文片段。
2. **点击知乎热榜**：起点页底部展示 6 条实时知乎热榜内容，支持一键刷新，零输入直接启动。
3. **Bookmarklet 书签**：在落地页拖拽「生成非书」到浏览器书签栏，浏览任意网页时点击即可一键开启探索。

此外，支持通过 URL 参数直接启动：`https://your-domain/?url=文章链接` 或 `?text=文本内容`。

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
- SiliconFlow OpenAI-compatible chat completions as the LLM backend.
- `dist/demo.html` as a backup standalone demo.

**Production URLs:**

- Custom domain: `https://flybook2.space`
- Vercel default: `https://feishu-zhihu-hackathon-5wu2zu75d-kincaid0211-1062s-projects.vercel.app`

Required environment variables:

```text
ZHIHU_ACCESS_SECRET=...
SILICONFLOW_API_KEY=...
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=THUDM/GLM-4-32B-0414
SILICONFLOW_START_MODEL=THUDM/GLM-4-32B-0414
SILICONFLOW_CANDIDATES_MODEL=THUDM/GLM-4-32B-0414
SILICONFLOW_DIRECTIONS_MODEL=THUDM/GLM-4-32B-0414
SILICONFLOW_CHOOSE_MODEL=THUDM/GLM-4-32B-0414
SILICONFLOW_BOOK_MODEL=Qwen/Qwen3-30B-A3B-Instruct-2507
SILICONFLOW_COVER_MODEL=THUDM/GLM-4-32B-0414
```

## Notes

- The current demo uses mock data to guarantee a stable hackathon presentation.
- The prototype now presents article-link or pasted-text starts, AI-curated directions, candidate selection, early book generation, chapter-guide boundaries, and cover concept generation.
- The first real API flow is implemented under `/api/*`: start, directions, candidates, choose, book, cover, and hotlist.
- Candidate lists are generated from Zhihu/global search results and can be AI-wrapped for presentation; SiliconFlow models generate directions, chapter guides, bridges, books, and cover concepts.
- AI node prompts and model choices can be edited at `/admin.html`; settings are stored in browser localStorage and sent with API requests.
- AI prompts have been consolidated under `lib/prompts/`: a strengthened curator system prompt plus node user-payload builders enforce field shape, length limits, direction-type diversity, and candidate fidelity. Current node model choices are documented in `docs/SILICONFLOW_MODEL_BENCHMARK.md`.
- Long-running AI steps show explicit progress messages and elapsed waiting time.
- SiliconFlow can be used as a test or backup OpenAI-compatible model provider.
- Kimi/API failures should show a clear failure message instead of silently falling back to mock data.
- Sensitive local notes and API materials under `note/` are intentionally excluded from Git.
- See [PROJECT_GUIDE.md](PROJECT_GUIDE.md) for the file structure, deployment flow, update log, and documentation maintenance rules.
- See [CLAUDE.md](CLAUDE.md) for the Claude Code working context, technical stack cheat sheet, current progress snapshot, and collaboration conventions.
- AI service efficiency optimizations (2026-05-13): `/api/start` now returns initial directions directly, cutting one serial AI call from the start phase; `/api/book` generates only book metadata instead of rewriting full chapters; `/api/candidates` uses zero AI calls with pure rule-based presentation and `Promise.allSettled` for fault tolerance; node timeouts tightened to 15–30s with fallback兜底; `max_tokens` added per node to control output length.
- Entry experience enhancements (2026-05-13): URL param prefill (`?url=` / `?text=`), Zhihu hotlist live fetch with refresh on the start page, 6 featured start cards as fallback, and a draggable Bookmarklet on the landing page for one-click exploration from any webpage.
