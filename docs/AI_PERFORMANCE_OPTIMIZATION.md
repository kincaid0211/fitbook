# 非书 AI 执行过程与性能优化方案

更新日期：2026-05-12

## 1. 结论摘要

当前真实流程的主要耗时不是单个搜索接口，而是用户可感知链路里存在多次串行 AI 等待：

1. 起点阶段：`/api/start` 完成链接解析和起点理解后，前端又串行调用 `/api/directions`。
2. 每站推进：`/api/choose` 一次性生成章节导读、知识桥、兴趣画像和下一站方向，输出长，模型等待容易超过 10 秒。
3. 装订阶段：`/api/book` 会重新包装整条路线，输入随路线变长，输出也长；虽然已和 `/api/cover` 并行，但 book 仍是长尾节点。
4. 超时策略：`lib/model.js` 对模型请求设置了 `Math.max(15, timeoutSeconds)`，即使节点配置为 10 秒以下，服务端仍至少等 15 秒才超时。
5. 缺少运行时耗时指标：当前无法从响应里稳定看到每个节点的实际耗时、缓存命中、模型名和降级路径，难以定位真实慢点。

如果目标是“每个用户可见等待尽量低于 10 秒”，建议不要只换模型，而要改成：

- 首屏/下一步先给可用结果。
- AI 长文本生成改短输出、改增量、改后台补齐。
- 搜索与下一站候选尽量预取。
- 每个节点设置 8-10 秒硬预算，超过预算返回规则化兜底或已有缓存。

### 2026-05-13 硅基流动模型复测结论

已拉取硅基流动 `/models` 当前可用模型列表，共 102 个模型；针对项目真实 AI 节点完成结构化 JSON 响应测试，详见 `docs/SILICONFLOW_MODEL_BENCHMARK.md`。

推荐线上默认模型：

| 节点 | 推荐模型 | 目标 |
| --- | --- | --- |
| `start` | `THUDM/GLM-4-32B-0414` | 起点知识卡片约 12 秒返回，控制在半分钟内 |
| `candidates` | `THUDM/GLM-4-32B-0414` | 候选包装约 5-8 秒 |
| `directions` | `THUDM/GLM-4-32B-0414` | 下一章方向约 4-5 秒 |
| `choose` | `THUDM/GLM-4-32B-0414` | 章节导读与知识桥约 8-10 秒 |
| `book` | `Qwen/Qwen3-30B-A3B-Instruct-2507` | 非书元信息约 4 秒 |
| `cover` | `THUDM/GLM-4-32B-0414` | 封面方案约 3-4 秒 |

重要注意：管理页保存的长节点 `systemPrompt` 会明显拖慢部分模型，甚至导致 JSON 不可解析。主流程默认路径应优先使用公共 `curatorSystem` + 节点 user payload + 节点模型表，长提示词只保留为人工调试材料。

## 2. 当前主流程

### 2.1 开始探索

前端入口：`src/app.js` `startAdventure()`

当前顺序：

1. 用户提交 URL 或粘贴文本。
2. 前端调用 `POST /api/start`。
3. 服务端 `api/start.js` 调用 `parseStartContent()`。
4. 如果是 URL，`lib/parser.js` 抓取网页 HTML 并用 Readability 提取正文。
5. `api/start.js` 调用 `callModelJson()`，执行 `understand_article`。
6. 前端拿到第一站后，继续调用 `refreshDirections()`。
7. `refreshDirections()` 调用 `POST /api/directions`。
8. `api/directions.js` 再调用一次模型，执行 `generate_directions`。

瓶颈：

- 起点阶段最少 1 次网页请求 + 2 次串行 AI 调用。
- URL 抓取没有显式超时，外部网页慢时会拖住整个起点。
- 起点理解已经生成 `extensionDirections` 和 `searchKeywords`，但前端没有直接用这些结果快速生成第一批方向。

10 秒内优化：

- 将 `/api/start` 改为直接返回 3 个首站方向，复用起点理解里的 `extensionDirections/searchKeywords`，取消首站后的串行 `/api/directions`。
- 给 `parseStartContent()` 增加 4 秒抓取预算；超过后提示用户粘贴文本，或基于已拿到的标题/摘要继续。
- 起点模型输出压缩为摘要、概念、搜索词、3 个方向四类字段，移除人物案例/争议等非首屏必需字段，后续后台补齐。
- 起点节点使用小模型或极速模型，`max_tokens` 控制在 600-900。
- 用户粘贴文本时跳过网页解析，目标 4-8 秒；URL 起点目标 6-10 秒。

### 2.2 选择方向并生成候选

前端入口：`src/app.js` `chooseDirection()`

当前顺序：

1. 用户选择某个方向。
2. 前端调用 `POST /api/candidates`。
3. `api/candidates.js` 并行调用 `zhihu_search` 和 `global_search`。
4. 服务端用规则包装候选，不再调用 AI。
5. 前端展示候选卡片。

优点：

- 当前这个节点已经没有 AI 调用，是主流程里最接近 10 秒内目标的部分。
- 两个搜索接口使用 `Promise.all` 并行。

瓶颈：

- 任一搜索接口失败会使整个接口失败，无法先展示部分候选。
- 搜索没有超时预算，外部接口慢时用户仍会等待。
- 用户点击方向后才开始搜索，没有利用用户阅读当前站时的空闲时间预热候选。

10 秒内优化：

- 给每个搜索请求设置 4-6 秒超时。
- 使用 `Promise.allSettled`，知乎搜索成功就先展示知乎候选，全网搜索失败只显示背景缺失提示。
- 在方向生成完成后，后台预取 3 个方向的候选；用户真正点击时优先读缓存。
- 搜索结果缓存 TTL 从 8 分钟延长到 30-60 分钟，并增加客户端 session 级缓存。
- 目标等待：缓存命中 0.1-0.5 秒，冷启动搜索 2-6 秒，单侧接口失败时不超过 6 秒返回部分结果。

### 2.3 选择候选并进入下一站

前端入口：`src/app.js` `goNext()`

当前顺序：

1. 用户选择候选。
2. 前端调用 `POST /api/choose`。
3. `api/choose.js` 调用模型。
4. 模型一次性输出：
   - 新章节 step
   - bridge
   - interestProfile
   - curatorMessage
   - directions
   - nextCuratorMessage
5. 前端一次性进入下一站。

已做优化：

- 已把旧的 `choose` 后再调 `directions` 合并为一次模型调用。
- 已用 `compactRouteForContext()` 压缩较早路线历史。

瓶颈：

- 合并减少了调用次数，但让单次输出变大；模型需要同时完成“写章节”和“想下一步”两个任务。
- 用户必须等全部 JSON 完成后才能看到下一站，即使章节导读本身已经可以用候选摘要规则生成。
- `choose` 仍使用深度模型，不在 `fastNodes` 中。

10 秒内优化：

- 改为“两段式用户体验”：
  - 立即用候选内容生成基础 step：标题、作者、URL、摘要、来源、初始概念可以全部由搜索结果和规则生成，0.1 秒进入下一站。
  - 同步或后台调用一个更短的 `bridge` 节点，只生成 60-100 字知识桥和一句策展反馈，预算 5-8 秒。
  - 下一站方向用轻量模型或规则先给，再后台刷新。
- 如果仍保留一个 `/api/choose`，必须压缩输出：
  - `step.summary` 优先复用 candidate.summary，不让模型重写。
  - 模型只返回 `bridge`、`curatorNote`、`concepts`、`directions`。
  - `max_tokens` 控制在 900-1200。
  - 将 `choose` 加入快速模型候选，或新增 `CHOOSE_FAST_MODEL`。
- 对同一候选加 in-flight 去重，避免连续点击重复触发模型。
- 目标等待：进入下一站 0.1-1 秒；知识桥补齐 5-8 秒；方向冷生成 5-8 秒，超过 8 秒使用规则化方向。

### 2.4 生成非书

前端入口：`src/app.js` `finishBook()`

当前顺序：

1. 前端先构造 `localBook`。
2. 并行调用：
   - `POST /api/book`
   - `POST /api/cover`
3. `book` 成功则使用 AI 结果，否则退回 `localBook`。
4. `cover` 成功则补封面方案，否则使用默认封面说明。

优点：

- book 和 cover 已经并行，不再互相阻塞。
- book 失败时已有本地书兜底。

瓶颈：

- `/api/book` 让模型重新处理整条 route，并重新生成 chapters。路线越长，输入和输出越长。
- 章节在每站推进时已经生成过，再让 book 重写章节是重复劳动。
- `/api/cover` 对 Demo 来说不是关键路径；等待封面方案不应阻塞用户看到成书。

10 秒内优化：

- 装订按钮点击后立即展示 `localBook`，后台刷新 AI 书名、序言、标签和封面。
- `/api/book` 不再生成完整 `chapters`，只生成：
  - title
  - subtitle
  - preface
  - tags
  - style
  - explorationSummary
  - sourceAuthors
- chapters 直接使用 route，最多只做字段清洗，不让模型重写。
- book 输入只传每章 `title + concepts + bridge`，摘要最多截断 80 字。
- `/api/cover` 改为可选增强：CSS theme 可由标签规则即时决定，AI 封面提示词后台补。
- 目标等待：即时成书 0.1-1 秒；AI polish 5-9 秒；封面增强 3-6 秒，不阻塞主体验。

## 3. AI 节点逐项分析

| 节点 | 当前接口 | 当前实现 | 主要耗时来源 | 优先级 | 10 秒内方案 |
| --- | --- | --- | --- | --- | --- |
| `parse_start_content` | `/api/start` 内部 | URL 抓取 + Readability；粘贴文本直返 | 外部网页无超时 | P0 | URL 抓取 4 秒预算；失败要求粘贴或只用标题摘要 |
| `understand_article` | `/api/start` | 大模型结构化理解起点 | 输入可能 2200 字，输出字段较多 | P0 | 缩短字段；首站方向一并返回；小模型 + `max_tokens` |
| `generate_directions` | `/api/directions` 或 `/api/choose` 内 | 模型生成 3 个方向 | 与 start/choose 串行或合并后输出变长 | P0 | 规则方向先出；AI 后台刷新；预取候选 |
| `search_content` | `/api/candidates` | 知乎 + 全网并行搜索 | 外部 API 慢或失败 | P1 | `allSettled` + 4-6 秒超时 + 部分结果返回 |
| `rank_candidates` | `/api/candidates` | 规则包装，无 AI | 基本不慢 | P2 | 保持规则化；增加简单打分即可 |
| `generate_bridge` | `/api/choose` | 与 step/directions 合并生成 | 单次 JSON 输出过长 | P0 | 从 choose 中拆成短 bridge；候选 step 即时生成 |
| `update_interest_profile` | `/api/choose` | 模型增量更新 | 与 choose 绑定 | P2 | 简化为规则计数；AI 只偶尔压缩总结 |
| `generate_feishu_book` | `/api/book` | 重写书名、序言、章节、总结 | 长 route 输入 + 长 chapters 输出 | P0 | 不重写 chapters，只生成书籍元信息 |
| `generate_cover_concept` | `/api/cover` | 模型生成封面方案 | 非关键路径 AI 等待 | P2 | CSS theme 规则即时生成；AI prompt 后台补 |

## 4. 关键代码问题

### 4.1 超时下限阻止 10 秒预算

`lib/model.js` 当前逻辑：

```js
const timeoutMs = Math.max(15, Number(nodeConfig?.timeoutSeconds || 90)) * 1000;
```

影响：

- 即使配置页把某个节点设为 8 秒，服务端仍会等至少 15 秒。
- 要实现“节点等待 10 秒内”，需要改为 `Math.max(3, ...)` 或在业务层用 `Promise.race` 做 8-10 秒降级返回。

建议：

- 模型硬超时允许低于 10 秒。
- 每个节点增加 `fallbackOnTimeout`：
  - start：返回解析摘要 + 规则方向。
  - candidates：返回已完成搜索或缓存。
  - choose：返回候选基础 step，bridge 标记为“稍后补齐”。
  - book：返回 localBook。

### 4.2 没有 `max_tokens`

`callModelJson()` 只传了 `model`、`temperature`、`response_format`、`messages`。

影响：

- 长节点可能输出过多内容。
- book/choose 这种结构化长 JSON 容易拖慢。

建议按节点增加：

| 节点 | 建议 max tokens |
| --- | --- |
| start | 700-900 |
| directions | 500-700 |
| choose-bridge | 500-800 |
| choose-with-directions | 900-1200 |
| book-meta | 800-1100 |
| cover | 500-700 |

### 4.3 缓存只在 Serverless 内存中

`lib/cache.js` 使用进程内 `Map`。

影响：

- 本地开发有效。
- Vercel Serverless 冷启动、实例切换后缓存可能丢失。

建议：

- 前端增加 session 级缓存：同一用户同一路线重复点击时直接复用。
- 服务端继续保留内存缓存。
- 若时间允许，接入一个轻量持久 KV/Redis 缓存，至少缓存搜索结果和 AI start/directions。

### 4.4 缺少耗时观测

建议所有 `/api/*` 响应增加 `meta`：

```json
{
  "meta": {
    "node": "choose",
    "durationMs": 7320,
    "provider": "siliconflow",
    "model": "Pro/moonshotai/Kimi-K2.6",
    "cacheHit": false,
    "fallback": false
  }
}
```

并在服务端打印结构化日志：

```text
ai_node=choose duration_ms=7320 cache_hit=false fallback=false model=...
```

没有指标时，“慢”只能靠体感；有指标后才能决定是模型慢、网页慢、搜索慢，还是输出太长。

## 5. 推荐改造路线

### P0：当天必须做

1. 去掉模型调用 15 秒超时下限，节点预算统一设为 8-10 秒。
2. `/api/start` 直接返回首站方向，前端取消起点后的串行 `/api/directions`。
3. `/api/book` 改为只生成书籍元信息，不再让模型重写 chapters。
4. `/api/candidates` 改为 `Promise.allSettled`，搜索接口超时后返回部分结果。
5. 前端给所有提交按钮加 `state.loading` 防重复点击，避免重复模型请求。

### P1：体验明显提升

1. 方向生成后预取 3 个方向候选。
2. `goNext()` 先用候选即时进入下一站，再后台补 bridge 和 directions。
3. 增加每个 API 的 `durationMs/cacheHit/fallback` 元信息。
4. 为 `callModelJson()` 增加节点级 `max_tokens`。
5. 给 URL 解析增加 4 秒超时和更清晰的降级提示。

### P2：演示稳定性增强

1. 客户端缓存 start/directions/candidates/choose 的结果。
2. 预置 2-3 条高质量 Demo 起点的缓存结果，评审常见路径可秒开。
3. 封面 AI 改后台增强，首屏先用 CSS theme。
4. 加一个轻量“性能面板”，只在本地或 admin 页面展示节点耗时。

## 6. 目标耗时表

| 用户动作 | 当前可感知等待 | 优化后目标 | 核心手段 |
| --- | --- | --- | --- |
| 开始探索 | URL 解析 + start AI + directions AI，可能 20-60 秒 | 6-10 秒 | start 直接产出首站方向，解析限时，小模型 |
| 选择方向 | 搜索冷启动，通常可控但可能被慢接口拖住 | 0.5-6 秒 | 预取、缓存、部分结果返回 |
| 选择候选进入下一站 | choose 大 JSON，可能 15-60 秒 | 0.1-8 秒 | 候选 step 即时进入，bridge/directions 后台补齐 |
| 生成非书 | book 长输出 + cover，并行但 book 长尾明显 | 0.1-9 秒 | localBook 即时展示，book 只生成元信息 |
| 封面方案 | 非关键 AI 调用 | 0.1-6 秒 | CSS 规则即时，AI 后台增强 |

## 7. 建议后的新主流程

```text
开始探索
  -> /api/start
      - 解析 URL 有 4 秒预算
      - AI 起点理解有 8 秒预算
      - 直接返回第一站 + 3 个方向
  -> 前端展示探索页
  -> 后台预取 3 个方向候选

选择方向
  -> 优先读预取缓存
  -> 缓存无命中时 /api/candidates
      - zhihu/global allSettled
      - 4-6 秒内返回部分候选

选择候选
  -> 前端立即基于 candidate 生成 step 并进入下一站
  -> 后台 /api/choose-bridge 生成 bridge/curatorNote
  -> 后台 /api/directions 或规则方向生成下一站方向
  -> 结果回来后更新当前站

生成非书
  -> 立即展示 localBook
  -> 后台 /api/book-meta 生成书名/序言/标签/总结
  -> 后台 /api/cover 生成封面增强
```

## 8. 最小代码改动建议

如果不想大改接口，最小可落地版本是：

1. 修改 `lib/model.js`：
   - 允许 8-10 秒超时。
   - 增加 `max_tokens`。
   - 返回 `durationMs/cacheHit`。
2. 修改 `api/start.js`：
   - 在 start 返回里加入 `directions`，前端不用再立即调 `/api/directions`。
3. 修改 `api/book.js` 和 prompt：
   - 不再要求 `chapters`，直接用 route 作为 chapters。
4. 修改 `api/candidates.js`：
   - 搜索改 `Promise.allSettled`，允许部分成功。
5. 修改 `src/app.js`：
   - `startAdventure()` 使用 start 返回的 directions。
   - `finishBook()` 先展示 localBook，再用 AI 结果更新。
   - loading 时禁用方向、候选和提交按钮。

这组改动能在不重构产品形态的情况下，把最容易超过 10 秒的首站和装订压下来；下一轮再做“候选即时进站 + bridge 后台补齐”，就能把每站推进也压到 10 秒以内。
