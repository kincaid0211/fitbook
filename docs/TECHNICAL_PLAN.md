# 非书主流程与 AI 功能技术方案

更新日期：2026-05-12

## 1. 最终技术选型

### 前端

- 继续使用当前轻量 H5 单页原型。
- 页面入口使用根路径 `/`。
- `dist/demo.html` 保留为备用单文件演示版本。
- 路线和非书在 MVP 阶段保存在浏览器 `localStorage`。

### 后端

- 使用 Vercel Serverless Functions 承载 `/api/*`。
- 所有 Kimi、知乎内容 API、全网搜索 API 和网页解析请求都通过服务端代理完成。
- 前端不直接接触任何 API Key、Access Secret 或签名材料。

### 大模型

- 模型底座：Kimi。
- 默认模型：`kimi-k2.6`。
- 调用方式：OpenAI 兼容 Chat Completions。
- 所有核心 AI 节点优先使用结构化 JSON 输出。
- 测试/备用模型服务：硅基流动，模型 `Pro/moonshotai/Kimi-K2.6`，同样按 OpenAI 兼容接口接入。

### 快慢模型分层

为了改善端到端体验，AI 节点按响应要求分层：

- 快速节点：起点理解、下一站方向、封面方案。建议使用更轻量、响应更快的模型。
- 深度节点：章节导读与知识桥、最终非书生成。可以保留更强模型。
- 非模型节点：候选内容生成先由知乎搜索、全网搜索和服务端规则稳定产出，避免每一步都等待大模型。

项目新增独立配置页：

```text
/admin.html
```

该页面可编辑每个 AI 节点的：

- 供应商。
- 模型名。
- 温度。
- 超时时间。
- 节点提示词。

配置保存在当前浏览器 `localStorage`，主流程请求 `/api/*` 时会把配置随请求发送给服务端。服务端仍只读取环境变量中的 API Key，前端配置页不会保存密钥。

### 网页解析

- 允许新增 npm 依赖。
- 计划使用：
  - `@mozilla/readability`
  - `jsdom`
- 解析失败时不强行基于 URL 生成内容，提示用户粘贴标题、摘要或正文片段。

### 封面生成

- 第一阶段只实现“AI 封面方案 + 稳定 CSS 封面组件”。
- 不在本阶段接入真实图片生成服务。

## 2. 环境变量

Vercel 和本地 `.env` 需要配置：

```text
MOONSHOT_API_KEY=...
KIMI_BASE_URL=https://api.moonshot.cn/v1
KIMI_MODEL=kimi-k2.6
ZHIHU_ACCESS_SECRET=...
SILICONFLOW_API_KEY=...
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=Pro/moonshotai/Kimi-K2.6
```

说明：

- `MOONSHOT_API_KEY`：Kimi / Moonshot API Key。
- `KIMI_BASE_URL`：默认使用 `https://api.moonshot.cn/v1`，必要时可切换到其他兼容域名。
- `KIMI_MODEL`：默认 `kimi-k2.6`。
- `ZHIHU_ACCESS_SECRET`：知乎数据开放平台 Bearer Access Secret。
- `SILICONFLOW_API_KEY`：硅基流动 API Key，用于测试或作为 Kimi 官方 Key 未配置时的备用模型服务。
- `SILICONFLOW_BASE_URL`：硅基流动 OpenAI 兼容接口地址。
- `SILICONFLOW_MODEL`：硅基流动上的 Kimi-K2.6 模型名。
- `.env`、`.env.*`、本地 `note/` 下的密钥材料不得提交到 Git。

## 3. 主流程

### 3.1 起点

用户可以输入：

- 任意文章链接。
- 知乎问题、回答、文章或知识内容链接。
- 直接粘贴标题、摘要或正文片段。

系统优先解析链接内容；如果无法解析，则要求用户粘贴文本片段，不做低质量猜测。

### 3.2 文章理解

服务端调用 Kimi，对起点内容做结构化理解：

- 标题。
- 来源。
- 是否全文。
- 一句话摘要。
- 关键概念。
- 人物 / 作品 / 案例。
- 争议点。
- 可延展方向。
- 初始兴趣画像。

### 3.3 方向生成

每一站生成 3 个下一站方向：

- 继续深入。
- 横向跨界。
- 人物 / 作品 / 案例。
- 观点挑战。
- 回到生活。
- 意外发现。

每个方向包含：

- 方向标题。
- 说明。
- 推荐理由。
- 知乎搜索关键词。
- 全网背景关键词。

### 3.4 候选内容

用户选择方向后，服务端调用：

- `zhihu_search`：用于最终章节主体候选。
- `global_search`：默认用于背景补充。
- `hot_list`：可用于热点相关路线的候选补充。

候选区不单独设置“开放探索”开关，而是直接提供不同类型候选：

- 知乎优先。
- 全网背景。
- 意外发现。

默认最终章节优先使用知乎内容。只有用户主动选择全网候选时，全网内容才进入最终章节，并且必须明确标注来源。

当前实现为了保证主流程响应速度，候选列表由服务端搜索结果和规则化包装稳定产出；用户选择候选后，再由 Kimi 生成章节导读、知识桥和兴趣画像更新。

### 3.5 选择与知识桥

用户选择候选后，服务端调用 Kimi 生成：

- 章节导读。
- 关键概念。
- 本章为什么被选中。
- 与上一站的知识桥。
- 策展人反馈。
- 更新后的兴趣画像。

### 3.6 生成非书

用户可以：

- 走满 10 站后生成非书。
- 第 3 站后中途生成非书。

服务端调用 Kimi 生成：

- 书名。
- 副标题。
- 序言。
- 目录。
- 章节导读。
- 路线标签。
- 探索总结。
- 作者或来源列表。
- 封面方案。

中途生成时只基于已完成路线，不补造未读章节。

## 4. API 设计

### `POST /api/start`

输入：

- `url`
- `text`

输出：

- `ok`
- `source`
- `title`
- `author`
- `contentExcerpt`
- `isFullText`
- `basedOnUserText`
- `understanding`
- `interestProfile`
- `message`

### `POST /api/directions`

输入：

- `currentStep`
- `route`
- `interestProfile`

输出：

- `ok`
- `directions`
- `interestProfile`
- `curatorMessage`

### `POST /api/candidates`

输入：

- `currentStep`
- `direction`
- `route`
- `interestProfile`

输出：

- `ok`
- `candidates`
- `backgroundNotes`
- `message`

实现说明：

- 当前版本不在该接口内调用 Kimi，以免搜索结果二次筛选耗时过长。
- 该接口基于知乎搜索和全网搜索结果生成“知乎优先 / 全网背景 / 意外发现”候选。
- AI 策展判断延后到 `/api/choose`，由用户选定候选后生成知识桥。

### `POST /api/choose`

输入：

- `previousStep`
- `candidate`
- `route`
- `interestProfile`

输出：

- `ok`
- `step`
- `bridge`
- `interestProfile`
- `curatorMessage`

### `POST /api/book`

输入：

- `route`
- `interestProfile`

输出：

- `ok`
- `book`
- `message`

### `POST /api/cover`

输入：

- `book`

输出：

- `ok`
- `coverConcept`
- `message`

## 5. 错误处理策略

### Kimi 调用失败

- 直接给用户失败提示。
- 不静默回退到 mock 数据。
- 前端提示用户稍后重试或改用演示路线。

### 等待提示

- 前端在每个长耗时节点展示明确的阶段提示。
- 等待超过数秒后显示已等待秒数。
- 用户可以知道当前是在解析文章、生成方向、搜索候选、生成知识桥还是装订非书，避免误以为页面卡死。

### 链接解析失败

- 返回明确失败原因。
- 提示用户粘贴标题、摘要或正文片段。
- 不基于 URL 域名强行生成路线。

### 搜索接口失败

- 返回失败提示。
- 如果已有缓存，可以提示使用缓存结果。
- 不将搜索失败伪装为真实推荐。

### JSON 输出异常

- 服务端做字段校验。
- 必要时重试一次。
- 仍失败则返回可读错误提示。

## 6. 缓存与限流

MVP 阶段使用轻量内存缓存即可：

- 搜索结果按 `api + query + count` 缓存。
- 起点解析按 URL 缓存。
- AI 生成结果可按请求摘要短期缓存。

缓存目的：

- 降低 Kimi 和知乎 API 重复调用。
- 避免触发知乎 API 频率限制。
- 提高演示稳定性。

注意：Vercel Serverless 内存缓存不保证长期存在，只作为短期优化，不作为产品数据存储。

## 7. 部署方案

Vercel 正式入口：

```text
/
```

备用单文件演示：

```text
dist/demo.html
```

部署前需要：

- 在 Vercel 配置环境变量。
- 确认 `MOONSHOT_API_KEY` 和 `ZHIHU_ACCESS_SECRET` 可用。
- 运行本地检查和构建。
- 确认 `/api/*` 不会把密钥返回到前端。

## 8. 实施顺序

1. 搭建 Vercel 兼容的 API 目录。
2. 新增 Kimi 调用层和结构化 JSON 工具。
3. 新增网页解析服务。
4. 新增知乎搜索和全网搜索服务端代理。
5. 实现 `/api/start`。
6. 实现 `/api/directions`。
7. 实现 `/api/candidates`。
8. 实现 `/api/choose`。
9. 实现 `/api/book` 和 `/api/cover`。
10. 将前端主流程从 mock 接入真实 API。
11. 保留手动演示路线入口。
12. 更新部署文档并完成 Vercel 验证。
