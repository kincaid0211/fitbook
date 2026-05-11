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

「非书」的核心立意是重新设计知乎内容的阅读方式：它不是传统电子书，也不是简单收藏夹，而是一种兴趣驱动、启发引导式的主动阅读体验。用户从一个知乎问题、回答、文章或知识内容链接出发，在一条 10 站探索路线中不断选择下一站，连接更多相关观点和知识，突破熟悉的信息边界，并在完成后生成可保存、可分享、可推荐的个人知识读本。

当前版本为了保证演示稳定，使用 `src/mockData.js` 中的模拟数据完成核心流程展示；真实知乎 OpenAPI 相关能力保留在校验脚本和项目说明中，敏感 Key 只应通过本地环境变量或本地私有配置使用。

## 文件结构

```text
.
├── AGENTS.md                         # 项目协作、黑客松规则和 API 注意事项
├── PROJECT_GUIDE.md                  # 项目结构、部署和更新记录说明
├── README.md                         # GitHub 首页简介和运行入口
├── index.html                        # 本地开发入口
├── package.json                      # 项目脚本定义
├── assets/
│   ├── feishu-logo.png               # 非书横版品牌 Logo
│   └── ui/                           # 关键页面 UI 视觉稿图片
│       ├── feishu-detail-ui.png      # 非书详情页视觉稿
│       ├── feishu-landing-ui.png     # 落地页视觉稿
│       └── feishu-library-ui.png     # 我的非书视觉稿
├── dist/
│   └── demo.html                     # 可直接打开的单文件演示版本
├── docs/
│   └── UI_VISUALS.md                 # 非书关键页面 UI 视觉稿说明
├── scripts/
│   ├── build-standalone.mjs          # 生成 dist/demo.html
│   ├── dev-server.mjs                # 启动本地静态开发服务
│   ├── probe-zhihu-search.mjs        # 知乎搜索接口探测脚本
│   └── verify-zhihu-basics.mjs       # URL 解析和签名逻辑的本地冒烟检查
└── src/
    ├── app.js                        # 单页应用逻辑和界面渲染
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

该脚本只验证知乎链接解析和签名头字段生成，不读取真实密钥，也不会发起网络请求。

## 部署方式

### 方式一：静态托管单文件

1. 运行 `npm run build:standalone`。
2. 将 `dist/demo.html` 上传到支持静态 HTML 的平台。
3. 用平台生成的公开访问地址作为黑客松 Demo URL。

适合平台：GitHub Pages、Vercel、Netlify、Cloudflare Pages、任意对象存储静态网站。

### 方式二：托管整个仓库

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

- 新增 `docs/UI_VISUALS.md`，整理非书关键页面 UI 视觉稿，包括落地页、我的非书冷启动/示例路线页和非书详情页。
- 新增 `assets/ui/`，保存三张关键页面视觉稿：`feishu-landing-ui.png`、`feishu-library-ui.png`、`feishu-detail-ui.png`。
- 更新 `README.md`，加入关键页面 UI 视觉稿文档入口。

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

- 文件新增、删除、移动：更新“文件结构”。
- 运行命令、构建命令或部署平台变化：更新“本地运行”“构建演示文件”“部署方式”。
- 新增功能或重要修复：更新“本次更新内容”。
- 涉及知乎 OpenAPI、密钥、发布、评论、点赞等能力：补充合规说明，并确认敏感信息不进入 Git。
- 每次有明确项目讨论、产品决策、实现进展、验证结果或阻塞，都要在 `note/zhihuhackathon/工作日志/` 下新增一篇 Markdown 工作日志，命名格式为 `YYYY-MM-DD-HHMM-简短主题.md`。
