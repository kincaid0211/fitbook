# 非书项目说明

更新日期：2026-05-12

## 项目概览

「非书」是面向知乎黑客松的 H5/Web 原型。

产品主 slogan：

```text
读出自己的书。
```

产品副标题：

```text
从一个知乎问题出发，在启发式阅读和主动探索中生成你的知识读本。
```

「非书」的核心立意是重新设计知识内容的阅读方式：它不是传统电子书，也不是简单收藏夹，而是一种兴趣驱动、启发引导式的主动阅读体验。用户可以从任意文章链接、知乎内容链接或直接粘贴的文章片段出发，在最多 10 站的探索路线中不断选择下一站，连接更多相关观点和知识，突破熟悉的信息边界，并在完成或中途结束时生成可保存、可分享、可推荐的个人知识读本。

当前版本为了保证演示稳定，使用 `src/mockData.js` 中的模拟数据完成核心流程展示；真实知乎 OpenAPI 相关能力保留在校验脚本和项目说明中，敏感 Key 只应通过本地环境变量或本地私有配置使用。

## 文件结构

```text
.
├── AGENTS.md                         # 项目协作、黑客松规则和 API 注意事项
├── CLAUDE.md                         # Claude Code 常驻上下文与协作约定
├── PROJECT_GUIDE.md                  # 项目结构、部署和更新记录说明
├── README.md                         # GitHub 首页简介和运行入口
├── admin.html                        # 独立 AI 节点配置入口
├── index.html                        # 本地开发入口
├── package-lock.json                 # npm 依赖锁定文件
├── package.json                      # 项目脚本定义
├── 非书项目Todo与时间计划.md          # 公开版项目 Todo、时间计划和进度盘点
├── api/                              # Vercel Serverless API
│   ├── book.js                       # 生成非书读本
│   ├── candidates.js                 # 搜索并生成候选内容
│   ├── choose.js                     # 生成章节导读和知识桥
│   ├── cover.js                      # 生成 AI 封面方案
│   ├── directions.js                 # 生成下一站方向
│   ├── models.js                     # 拉取硅基流动可用模型列表
│   └── start.js                      # 解析起点并生成起点理解
├── assets/
│   ├── feishu-logo.png               # 非书横版品牌 Logo
│   └── ui/                           # 关键页面 UI 视觉稿图片
│       ├── feishu-detail-ui.png      # 非书详情页视觉稿
│       ├── feishu-landing-ui.png     # 落地页视觉稿
│       └── feishu-library-ui.png     # 我的非书视觉稿
├── dist/
│   └── demo.html                     # 可直接打开的单文件演示版本
├── docs/
│   ├── AI_FUNCTION_LOGIC.md          # 非书核心 AI 功能逻辑、流程、边界和兜底策略
│   ├── TECHNICAL_PLAN.md             # 主流程、Kimi、Vercel 和 API 实现技术方案
│   └── UI_VISUALS.md                 # 非书关键页面 UI 视觉稿说明
├── lib/                              # 服务端共享模块
│   ├── cache.js                      # Serverless 内存缓存
│   ├── env.js                        # 本地/线上环境变量读取
│   ├── http.js                       # API 请求/响应工具
│   ├── model.js                      # Kimi/硅基流动 OpenAI 兼容模型调用
│   ├── parser.js                     # 网页正文解析
│   ├── prompts.js                    # AI 策展人 system + 5 个节点 user payload 构造器
│   └── zhihu.js                      # 知乎内容 API 代理
├── scripts/
│   ├── build-standalone.mjs          # 生成 dist/demo.html
│   ├── dev-server.mjs                # 启动本地静态开发服务
│   ├── probe-zhihu-content.mjs       # 知乎内容数据接口探测脚本
│   └── verify-zhihu-basics.mjs       # URL 解析和签名逻辑的本地冒烟检查
└── src/
    ├── admin.css                     # AI 配置页样式
    ├── admin.js                      # AI 配置页逻辑
    ├── app.js                        # 单页应用逻辑和界面渲染
    ├── aiNodeConfig.js               # AI 节点默认配置
    ├── mockData.js                   # 演示用非书探索路线数据
    └── styles.css                    # 页面样式
```

未提交到 Git 的本地资料：

- `note/`：黑客松资料、API Key 等敏感或本地参考材料。
- `.env`、`.env.*`：本地环境变量文件。

本地讨论记录：

- `note/zhihuhackathon/非书项目规划.md`：非书产品定位、MVP 范围、核心玩法、页面结构、数据结构、AI 能力拆分和里程碑规划。
- `note/zhihuhackathon/非书项目Todo与时间计划.md`：比赛截止前的任务清单、优先级和每日时间计划。
- `note/zhihuhackathon/非书API验证记录.md`：知乎链接解析、OpenAPI 签名、真实接口探测和当前阻塞记录。
- `note/zhihuhackathon/非书命名与品牌文案讨论记录.md`：产品命名、slogan 和副标题讨论过程，作为参赛介绍材料的本地参考。
- `docs/AI_FUNCTION_LOGIC.md`：公开版核心 AI 功能逻辑文档，说明 AI 角色、用户流程、兴趣挖掘、搜索边界、非书生成、封面生成和失败兜底。
- `docs/TECHNICAL_PLAN.md`：公开版技术实现方案，说明 Vercel 部署、Kimi 接入、API 设计、环境变量、错误处理和实施顺序。
- `note/zhihuhackathon/工作日志/`：每次重要项目讨论、决策、实现、阻塞和验证结果的本地工作日志目录，适用于所有后续会话。

## 本地运行

项目不依赖前端框架和打包器，使用 Node.js 脚本即可运行。

```bash
npm run dev
```

默认访问地址：

```text
http://127.0.0.1:5173
```

如需指定端口：

```bash
PORT=3000 npm run dev
```

本地开发服务现在也支持 `/api/*`，会动态加载 `api/` 下的 Serverless 函数。真实 AI 流程需要本地 `.env.local` 或环境变量中配置模型与知乎 API 密钥。

## 构建演示文件

生成一个可直接打开、便于上传静态托管平台的单文件版本：

```bash
npm run build:standalone
```

生成文件：

```text
dist/demo.html
```

该文件会内联当前的 CSS、模拟数据和应用逻辑，适合用于黑客松演示链接或静态页面托管。

## 检查脚本

运行本地冒烟检查：

```bash
npm run check
```

该脚本只验证知乎链接解析和新版 Bearer 请求头字段生成，不读取真实密钥，也不会发起网络请求。

真实知乎搜索接口探测：

```bash
npm run probe:zhihu-search
```

该脚本调用 `https://developer.zhihu.com/api/v1/content/zhihu_search`，使用 `Authorization: Bearer <access_secret>` 与 `X-Request-Timestamp`，默认查询 `心理学`、`Count=5`。真实 `access_secret` 只从 `ZHIHU_ACCESS_SECRET` 环境变量或本地 ignored 的 `note/zhihuhackathon/知乎API Key.md` 读取，不能写入前端代码、公开仓库或文档。

真实全网搜索接口探测：

```bash
npm run probe:global-search
```

该脚本调用 `https://developer.zhihu.com/api/v1/content/global_search`，同样使用 Bearer 鉴权，默认查询 `ChatGPT`、`Count=5`。

## 部署方式

### 方式一：Vercel 正式部署

1. 将仓库推送到 GitHub。
2. 在 Vercel 中导入该仓库。
3. 配置环境变量：

```text
MOONSHOT_API_KEY=...
KIMI_BASE_URL=https://api.moonshot.cn/v1
KIMI_MODEL=kimi-k2.6
ZHIHU_ACCESS_SECRET=...
SILICONFLOW_API_KEY=...
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=Pro/moonshotai/Kimi-K2.6
```

4. 正式访问入口使用：

```text
/
```

5. 后端 API 使用 Vercel Serverless Functions，路径为 `/api/*`。

注意：

- 不要把 `MOONSHOT_API_KEY`、`ZHIHU_ACCESS_SECRET` 或任何本地 Key 写入前端、公开文档或提交记录。
- 硅基流动可作为测试或备用模型服务；真实 `SILICONFLOW_API_KEY` 只允许存在于本地 `.env.local` 或 Vercel 环境变量中。
- `dist/demo.html` 保留为备用单文件演示，不作为正式 Vercel 入口。
- 如果 Kimi 或搜索接口调用失败，真实流程应展示失败提示，不静默伪装为真实结果。

### 方式二：静态托管单文件

适合作为备用演示方案。

1. 运行 `npm run build:standalone`。
2. 将 `dist/demo.html` 上传到支持静态 HTML 的平台。
3. 用平台生成的公开访问地址作为黑客松 Demo URL。

适合平台：GitHub Pages、Vercel、Netlify、Cloudflare Pages、任意对象存储静态网站。

### 方式三：仅托管静态构建产物

1. 将仓库推送到 GitHub。
2. 在托管平台中选择该仓库。
3. 构建命令填写：

```bash
npm run build:standalone
```

4. 输出目录填写：

```text
dist
```

5. 公开访问入口指向 `demo.html`。

## GitHub 更新流程

建议每次变更后执行：

```bash
npm run check
npm run build:standalone
git status
git add README.md PROJECT_GUIDE.md AGENTS.md assets docs src scripts dist package.json index.html
git commit -m "docs: update project guide"
git push fitbook master
```

提交前需要确认：

- 不提交 `note/`、`.env`、真实 API Key 或其他敏感资料。
- 如果改动了界面或流程，重新生成 `dist/demo.html`。
- 如果改动了部署、运行命令、文件结构或功能点，同步更新本文档。

## 本次更新内容

### 2026-05-12

- 第二版 AI 提示词正稿落地：在 `lib/prompts.js` 中重写 `curatorSystem`，把策展人角色、7 条边界（不伪装读完全文、不补造章节、不替代原文、不夸大确定性、保留意外发现、克制语气、不暴露 system）、6 种方向类型与 JSON 输出纪律集中沉淀；并新增 `buildStartUserPayload` / `buildDirectionsUserPayload` / `buildChooseUserPayload` / `buildBookUserPayload` / `buildCoverUserPayload` 五个 user payload 构造器，统一字段口径与字数约束。
- 5 个 LLM 节点 API（`/api/start`、`/api/directions`、`/api/choose`、`/api/book`、`/api/cover`）切换为调用 builder，删除内联 JSON 字符串；响应字段保持不变，前端 `src/app.js` 无需同步改动。
- 提示词强化要点：directions 强制 3 条 + 至少 1 条意外发现 + 禁止与历史 route 重复；choose 要求 step.title/url 与 candidate 严格一致、bridge 必须覆盖「上一站关键点 / 本站延展点 / 视野变化」三要素；book 要求 chapters.length 严格等于 route.length 且字段保真，不补造未读章节；cover 要求 colorPalette 用 #RRGGBB、cssTheme 取自 `music|cocoon|public|writer|hot|classic` 枚举。
- 使用硅基流动 `Pro/moonshotai/Kimi-K2.6` 完成 5 个 LLM 节点的烟测：start / directions / choose / book / cover 全部返回合法 JSON 且字段满足约束；少量字数轻微超上限（preface 250 字、explorationSummary 158 字），下一轮可把硬约束改为软提示。`/api/candidates` 依赖 `ZHIHU_ACCESS_SECRET`，不在本轮提示词改造范围内。
- 新增 `CLAUDE.md` 作为 Claude Code 常驻上下文，沉淀项目一句话、技术栈速查、API 一览、当前进度盘点、协作约定与下一步开发建议；与 `PROJECT_GUIDE.md` / `AGENTS.md` / `docs/*` 形成互链。
- 新增 `/api/models`，通过服务端使用模型服务密钥调用 OpenAI 兼容 `/models` 接口；`admin.html` 会从该接口动态读取硅基流动可用模型列表，失败时回落到内置备用模型列表。
- AI 节点配置页中，当供应商选择"硅基流动聚合平台"时，模型字段改为下拉列表，内置 Moonshot/Kimi 系列常用模型选项，并保留"自定义模型名"入口。
- 新增独立 AI 节点配置页 `admin.html`，可编辑每个 AI 节点的供应商、模型名、温度、超时时间和提示词；配置保存在浏览器本地，并随主流程 API 请求发送给服务端。
- 主流程接入节点级模型配置：`/api/start`、`/api/directions`、`/api/choose`、`/api/book`、`/api/cover` 会读取对应节点配置，支持用轻量模型承载快速节点，用较强模型承载深度节点。
- 优化等待体验：前端在文章理解、方向生成、候选筛选、知识桥生成和非书装订阶段显示明确状态，并在等待较久时展示已等待秒数，避免用户误以为页面卡死。
- 明确性能策略：候选内容节点不再二次调用大模型，而是由知乎搜索、全网搜索和服务端规则稳定生成；用户选择候选后再由模型生成章节导读和知识桥。
- 实现主流程和 AI 功能的第一版服务端 API：新增 `/api/start`、`/api/directions`、`/api/candidates`、`/api/choose`、`/api/book`、`/api/cover`，覆盖起点解析、方向生成、候选内容、章节导读、知识桥、非书生成和封面方案。
- 新增 `lib/` 服务端共享模块：本地环境变量读取、Kimi/硅基流动 OpenAI 兼容调用、知乎内容搜索代理、网页正文解析、内存缓存和 API 工具。
- 前端主流程接入真实 `/api/*`：开始探索默认调用 AI 服务；失败时显示明确错误；保留"使用演示路线"按钮作为手动备用入口，不静默伪装 mock 为真实结果。
- 候选内容接口当前采用"知乎搜索 + 全网搜索 + 规则化包装"稳定产出候选，避免模型二次筛选耗时过长；用户选定候选后，再由 Kimi 生成章节导读、知识桥和兴趣画像更新。
- 新增依赖 `@mozilla/readability` 和 `jsdom`，用于任意文章链接的正文解析；新增 `package-lock.json` 锁定依赖版本。
- 本地开发服务 `scripts/dev-server.mjs` 新增 `/api/*` 动态路由支持，便于本地测试 Vercel Serverless 函数。
- 已用硅基流动备用模型完成 API 烟测：`/api/start`、`/api/candidates`、`/api/choose`、`/api/book` 和 `/api/cover` 均能返回结构化结果；`/api/candidates` 同时成功调用知乎搜索和全网搜索。
- 新增 `docs/TECHNICAL_PLAN.md`，记录已确认的完整技术方案：Vercel 部署、Kimi `kimi-k2.6`、Serverless API、网页解析依赖、知乎/全网搜索代理、localStorage 存储、错误处理和实施顺序。
- 明确 Vercel 正式入口使用 `/`，`dist/demo.html` 作为备用单文件演示；环境变量包括 `MOONSHOT_API_KEY`、`KIMI_BASE_URL`、`KIMI_MODEL` 和 `ZHIHU_ACCESS_SECRET`。
- 新增硅基流动作为测试/备用模型服务的配置说明：`SILICONFLOW_API_KEY`、`SILICONFLOW_BASE_URL` 和 `SILICONFLOW_MODEL`；真实密钥只保存在本地 ignored 环境文件或 Vercel 环境变量。
- 明确 Kimi 调用失败时直接给用户失败提示，不静默回退到 mock；mock 路线只作为用户手动选择的演示备用入口。
- 按核心 AI 功能逻辑更新原型界面：落地页和起点页从"知乎链接起点"调整为"任意文章链接或粘贴文本起点"，突出 AI 知识策展人、兴趣驱动探索、候选内容选择和自动封面生成。
- 探索页新增策展人反馈、兴趣浮现标签、候选内容三选一、全网背景/意外发现候选说明，以及第 3 站后中途生成非书的入口；进度说明改为"最多 10 站，也可以中途装订"。
- 非书详情页新增 AI 封面方案模块，并明确章节为导读式章节，包含摘要、知识桥、策展人点评和原文入口，不替代原文全文。
- 重新生成 `dist/demo.html`，保持单文件演示版本与最新 AI 功能逻辑界面一致。
- 新增 `docs/AI_FUNCTION_LOGIC.md`，整理非书核心 AI 功能逻辑：AI 定位为"知识策展人"，支持任意文章链接或粘贴正文作为起点，采用"方向选择 -> 候选内容选择 -> 知识桥生成"的两层选择流程，路线最多 10 站且允许中途生成非书。
- 明确真实接口返回内容边界：`zhihu_search`、`global_search` 和 `hot_list` 当前可返回标题、链接、作者/来源、互动信号、摘要或内容片段，但不应视为全文；非书章节默认呈现章节导读、摘要、知识桥、策展人点评和原文入口，不生成替代原文的完整正文。
- 在 AI 功能逻辑中加入兴趣挖掘、情绪价值、全网搜索角色、封面自动生成和失败兜底策略；全网搜索默认用于背景补充和方向生成，最终章节主体优先使用知乎内容。
- 按 `docs/UI_VISUALS.md` 中的关键页面视觉稿，重设计 Demo 页面 UI：落地页改为蓝白品牌首屏、价值说明、流程说明和示例路线书架；「我的非书」加入冷启动状态和 6 本示例路线；非书详情页加入大封面、统计信息、目录、作者贡献和阅读路线。
- 在 `src/app.js` 中新增示例非书数据、作者信息、封面组件和书架卡片组件；在 `src/styles.css` 中重写蓝白视觉系统、响应式布局、书封面、书架、详情页和探索页样式。
- 重新生成 `dist/demo.html`，保持单文件演示版本与最新 UI 一致。
- 使用 Codex 内置浏览器访问 `http://127.0.0.1:5173` 完成落地页、开始探索页、探索流程、我的非书冷启动页和示例详情页的视觉与交互检查；修复从书单进入详情页时保留滚动位置的问题，页面切换现在会自动回到顶部。
- 新增 `docs/UI_VISUALS.md`，整理非书关键页面 UI 视觉稿，包括落地页、我的非书冷启动/示例路线页和非书详情页。
- 新增 `assets/ui/`，保存三张关键页面视觉稿：`feishu-landing-ui.png`、`feishu-library-ui.png`、`feishu-detail-ui.png`。
- 更新 `README.md`，加入关键页面 UI 视觉稿文档入口。
- 新增根目录公开版 `非书项目Todo与时间计划.md`，同步本地 Todo 和进度盘点；公开版不包含具体 API token 或 secret。
- 重新核对新版知乎搜索 API 文档：内容搜索应使用 `https://developer.zhihu.com/api/v1/content/zhihu_search`、Bearer `access_secret`、`X-Request-Timestamp` 和 `Query/Count` 参数；浏览器无鉴权直连已返回 `Authorization failed`，说明新路由存在并进入鉴权层，后续真实接入应走服务端 Bearer 代理并避免暴露密钥。
- 将旧搜索探针改为 `scripts/probe-zhihu-content.mjs` 通用内容数据接口探针，从旧 `openapi.zhihu.com` HMAC 签名探测改为新版 `developer.zhihu.com` Bearer 鉴权探测；将 `npm run check` 的本地冒烟检查同步为 Bearer 头字段检查，并新增 `npm run probe:zhihu-search`、`npm run probe:global-search` 便于复测真实接口。
- 使用 Bearer 鉴权成功复测知乎搜索：`GET https://developer.zhihu.com/api/v1/content/zhihu_search?Query=心理学&Count=5` 返回 HTTP 200、业务 `Code=0`、`Message=success`、`Items` 数量 5；同步更新 `AGENTS.md`，将内容数据 API 规则改为新版 Bearer 方案，并保留圈子 OpenAPI 的旧签名说明。
- 使用 Bearer 鉴权成功复测全网搜索：`GET https://developer.zhihu.com/api/v1/content/global_search?Query=ChatGPT&Count=5` 返回 HTTP 200、业务 `Code=0`、`Message=success`、`Items` 数量 5；实际返回字段包含 `Data.HasMore`、`Data.SearchHashId`、`Data.Items`，条目字段与知乎搜索基本兼容。

### 2026-05-11

- 产品命名确定为「非书」，主 slogan 确定为「读出自己的书。」。
- 产品副标题确定为「从一个知乎问题出发，在启发式阅读和主动探索中生成你的知识读本。」。
- 产品横版 Logo 定稿并保存为 `assets/feishu-logo.png`，页面导航栏已接入该品牌标识。
- 项目定位更新为兴趣驱动、启发引导式、主动探索的新型知乎阅读体验，强调通过探索发现突破认知茧房，并将阅读过程沉淀为个人知识读本。
- 同步更新本地 `note/zhihuhackathon/` 下的主项目文档，将项目规划、Todo 与时间计划、API 验证记录迁移为「非书」命名。
- 新增本地讨论记录 `note/zhihuhackathon/非书命名与品牌文案讨论记录.md`，该文件位于被 Git 忽略的 `note/` 目录下，不应作为公开提交内容。
- 新增 `PROJECT_GUIDE.md`，说明项目结构、本地运行、构建、部署和 GitHub 更新流程。
- 更新 `README.md`，加入完整项目说明文档入口。
- 更新 `AGENTS.md`，要求后续每次项目变更都同步维护 `PROJECT_GUIDE.md`。

## 后续更新维护规则

每次更新代码、页面、部署方式、脚本或数据结构后，都要检查并更新本文档对应部分：

- 文件新增、删除、移动：更新"文件结构"。
- 运行命令、构建命令或部署平台变化：更新"本地运行""构建演示文件""部署方式"。
- 新增功能或重要修复：更新"本次更新内容"。
- 涉及知乎 OpenAPI、密钥、发布、评论、点赞等能力：补充合规说明，并确认敏感信息不进入 Git。
- 每次有明确项目讨论、产品决策、实现进展、验证结果或阻塞，都要在 `note/zhihuhackathon/工作日志/` 下新增一篇 Markdown 工作日志，命名格式为 `YYYY-MM-DD-HHMM-简短主题.md`。
