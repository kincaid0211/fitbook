# 非书（Feishu）项目测试用例

## 一、lib/ 共享模块 — 单元测试

### 1.1 lib/env.js

| 编号 | 场景 | 输入 | 预期输出 |
|------|------|------|----------|
| ENV-01 | 解析标准键值对 | `KEY=value` | `["KEY", "value"]` |
| ENV-02 | 解析带引号的值 | `KEY="hello world"` | `["KEY", "hello world"]` |
| ENV-03 | 解析单引号值 | `KEY='hello'` | `["KEY", "hello"]` |
| ENV-04 | 忽略空行 | `""` | `null` |
| ENV-05 | 忽略注释行 | `# comment` | `null` |
| ENV-06 | 忽略无等号行 | `KEYVALUE` | `null` |
| ENV-07 | loadLocalEnv 幂等性 | 连续调用两次 | 只读取一次文件 |
| ENV-08 | getModelConfig 优先 Kimi | `MOONSHOT_API_KEY=xxx` 存在 | provider="kimi" |
| ENV-09 | getModelConfig 回退 SiliconFlow | 无 Moonshot Key，有 SiliconFlow Key | provider="siliconflow" |
| ENV-10 | getModelConfig 无 Key | 无任何 Key | `null` |
| ENV-11 | getModelConfig 覆盖 provider | `override.provider="siliconflow"` | 返回 siliconflow 配置 |
| ENV-12 | getModelConfig 覆盖 model | `override.model="custom"` | model="custom" |
| ENV-13 | getZhihuSecret 从环境变量读取 | `ZHIHU_ACCESS_SECRET=xxx` | `"xxx"` |
| ENV-14 | getZhihuSecret 从本地文件读取 | `note/zhihuhackathon/知乎API Key.md` 存在 | 文件内容 |

### 1.2 lib/http.js

| 编号 | 场景 | 输入 | 预期输出 |
|------|------|------|----------|
| HTTP-01 | readJson 读取 req.body | `req.body = {a:1}` | `{a:1}` |
| HTTP-02 | readJson 解析 Buffer | chunks = ['{"a":1}'] | `{a:1}` |
| HTTP-03 | readJson 空请求体 | `""` | `{}` |
| HTTP-04 | readJson 非法 JSON | `"not json"` | 抛出 400 错误 |
| HTTP-05 | sendJson 正常响应 | status=200, payload={ok:true} | res.statusCode=200, Content-Type=application/json |
| HTTP-06 | methodGuard POST 请求 | `req.method="POST"` | `true` |
| HTTP-07 | methodGuard GET 请求 | `req.method="GET"` 期望 POST | 返回 405, `false` |
| HTTP-08 | handleApiError 自定义状态码 | error.statusCode=422 | 返回 422 + error.publicMessage |
| HTTP-09 | handleApiError 默认状态码 | 无 statusCode | 返回 500 + fallbackMessage |

### 1.3 lib/cache.js

| 编号 | 场景 | 输入 | 预期输出 |
|------|------|------|----------|
| CACHE-01 | getCache 命中 | 已存入 `"key": "value"` | `"value"` |
| CACHE-02 | getCache 未命中 | 未存入的 key | `null` |
| CACHE-03 | getCache TTL 过期 | 存入时 ttlMs=0, 延迟读取 | `null` |
| CACHE-04 | setCache 返回存入值 | `"value"` | `"value"` |
| CACHE-05 | setCache 默认 TTL | 不传入 ttlMs | 10 分钟后过期 |

### 1.4 lib/model.js

| 编号 | 场景 | 输入 | 预期输出 |
|------|------|------|----------|
| MODEL-01 | extractJson 纯 JSON | `"{\"a\":1}"` | `{a:1}` |
| MODEL-02 | extractJson Markdown 包裹 | `"```json\n{\"a\":1}\n```"` | `{a:1}` |
| MODEL-03 | extractJson 无 JSON | `"plain text"` | `null` |
| MODEL-04 | hashPayload 相同输入 | system="s", user="u" | 相同 MD5 |
| MODEL-05 | hashPayload 不同输入 | system="s1", user="u" | 不同 MD5 |
| MODEL-06 | resolveNodeModel fast 节点映射 | `nodeConfig={key:"start"}` + env.KIMI_FAST_MODEL | 返回带 fastModel 的配置 |
| MODEL-07 | resolveNodeModel 非 fast 节点 | `nodeConfig={key:"choose"}` | 原配置不变 |
| MODEL-08 | resolveNodeModel 已有 model | `nodeConfig={model:"custom"}` | 原配置不变 |
| MODEL-09 | callModelJson 无配置 | 无 API Key | 抛出 503 错误 |
| MODEL-10 | callModelJson 缓存命中 | 相同 system+user | 返回缓存结果，不发起请求 |
| MODEL-11 | callModelJson 超时处理 | timeoutSeconds=15 | AbortController 在 15s 后触发 |
| MODEL-12 | callModelJson API 错误 | 返回 429 | 抛出对应状态码错误 |
| MODEL-13 | callModelJson 非 JSON 响应 | content="not json" | 抛出 502 错误 |
| MODEL-14 | callModelJson 正常 JSON | content="{\"a\":1}" | `{provider, model, data:{a:1}}` |

### 1.5 lib/parser.js

| 编号 | 场景 | 输入 | 预期输出 |
|------|------|------|----------|
| PARSER-01 | isHttpUrl http | `"http://a.com"` | `true` |
| PARSER-02 | isHttpUrl https | `"https://a.com"` | `true` |
| PARSER-03 | isHttpUrl ftp | `"ftp://a.com"` | `false` |
| PARSER-04 | isHttpUrl 非 URL | `"hello"` | `false` |
| PARSER-05 | parseStartContent 粘贴文本 | text >= 20 字符 | source="user_text", basedOnUserText=true |
| PARSER-06 | parseStartContent 空输入 | url="", text="" | 抛出 400 错误 |
| PARSER-07 | parseStartContent 无效 URL | `"not-a-url"` | 抛出 400 错误 |
| PARSER-08 | parseStartContent 非 http 协议 | `"ftp://a.com"` | 抛出 400 错误 |
| PARSER-09 | parseStartContent 缓存命中 | 相同 URL | 返回缓存，不 fetch |
| PARSER-10 | parseStartContent 链接不可达 | fetch 返回 404 | 抛出 422 错误 |
| PARSER-11 | parseStartContent 正文过短 | content < 120 字符 | 抛出 422 错误 |
| PARSER-12 | parseStartContent 正常解析 | 有效 HTML 链接 | source=hostname, content>=120 |
| PARSER-13 | parseStartContent 内容裁剪 | content=3000 字符 | contentExcerpt=前 2200 字符 |

### 1.6 lib/zhihu.js

| 编号 | 场景 | 输入 | 预期输出 |
|------|------|------|----------|
| ZHIHU-01 | normalizeItem 完整字段 | 含 Title/ContentType/AuthorName 等 | 标准化对象 |
| ZHIHU-02 | normalizeItem 缺失字段 | 仅有 title | 缺失字段为空字符串/0 |
| ZHIHU-03 | searchZhihuContent 无 Secret | `ZHIHU_ACCESS_SECRET` 缺失 | 抛出 503 错误 |
| ZHIHU-04 | searchZhihuContent 缓存命中 | 相同 apiName+query+count | 返回缓存 |
| ZHIHU-05 | searchZhihuContent API 失败 | Code!=0 | 抛出 502 错误 |
| ZHIHU-06 | searchZhihuContent 正常响应 | Code=0, 有 Items | 标准化 items 列表 |
| ZHIHU-07 | searchZhihuContent global_search | apiName="global_search" | sourceType="global" |
| ZHIHU-08 | getHotList 缓存命中 | 已缓存 | 返回缓存 |
| ZHIHU-09 | getHotList 正常调用 | 有 Secret | 返回 hot_list 结果 |

### 1.7 lib/prompts.js

| 编号 | 场景 | 输入 | 预期输出 |
|------|------|------|----------|
| PROMPT-01 | nodePrompt 无附加 | nodeConfig=null | 返回 basePrompt |
| PROMPT-02 | nodePrompt 有附加 | nodeConfig.prompt="extra" | basePrompt + extra |
| PROMPT-03 | getNodeConfig 无配置 | body.aiConfig=null | `null` |
| PROMPT-04 | getNodeConfig 有配置无 key | `{model:"m"}` | `{model:"m", key:"start"}` |
| PROMPT-05 | getNodeConfig 有配置有 key | `{key:"start", model:"m"}` | 原配置 |
| PROMPT-06 | compactRoute 正常压缩 | 3 站 route | 每站含 index/title/author/summary/concepts/sourceType/bridge/url |
| PROMPT-07 | compactRouteForContext 最近 3 站完整 | route.length=5 | 最近 3 站含完整字段，前 2 站仅 index/title/bridge |
| PROMPT-08 | buildStartUserPayload 结构 | parsed 对象 | 含 node/task/requirements/requiredShape/content |
| PROMPT-09 | buildDirectionsUserPayload 结构 | currentStep/route/interestProfile | 含 directions(3 条)/interestProfile/curatorMessage |
| PROMPT-10 | buildChooseUserPayload 结构 | previousStep/candidate/route | 含 step/bridge/interestProfile/curatorMessage |
| PROMPT-11 | buildBookUserPayload chapters 长度 | route.length=5 | requiredShape.chapters 为单元素模板 |
| PROMPT-12 | buildCoverUserPayload cssTheme 枚举 | book 对象 | requiredShape.cssTheme 为 music/cocoon/public/writer/hot/classic |

---

## 二、API 端点 — 集成测试

### 2.1 POST /api/start

| 编号 | 场景 | 请求体 | 预期响应 |
|------|------|--------|----------|
| API-START-01 | 有效 URL 起点 | `{url:"https://..."}` | 200, ok=true, 含 title/author/understanding/interestProfile/curatorMessage |
| API-START-02 | 粘贴文本起点 | `{text:"超过20字符的文本..."}` | 200, basedOnUserText=true |
| API-START-03 | 空输入 | `{url:"", text:""}` | 400/422, ok=false |
| API-START-04 | 无效 URL | `{url:"not-a-url"}` | 400, ok=false |
| API-START-05 | 链接不可达 | `{url:"https://dead-link.test"}` | 422, ok=false |
| API-START-06 | 携带 aiConfig | `{url:"...", aiConfig:{start:{model:"custom"}}}` | 使用 nodeConfig 调用 callModelJson |
| API-START-07 | AI 服务未配置 | 无 MOONSHOT/SILICONFLOW Key | 503, ok=false |

### 2.2 POST /api/directions

| 编号 | 场景 | 请求体 | 预期响应 |
|------|------|--------|----------|
| API-DIR-01 | 正常生成 3 个方向 | currentStep/route/interestProfile | 200, directions.length=3 |
| API-DIR-02 | AI 返回不足 3 条 | mock 返回 2 条 | 502, ok=false |
| API-DIR-03 | 空请求体 | `{}` | 可能 200 或 AI 报错 |
| API-DIR-04 | GET 请求 | method="GET" | 405, ok=false |

### 2.3 POST /api/candidates

| 编号 | 场景 | 请求体 | 预期响应 |
|------|------|--------|----------|
| API-CAN-01 | 正常搜索 | direction.zhihuQuery/globalQuery | 200, candidates.length>=1 |
| API-CAN-02 | 无搜索结果 | 两个搜索都返回空 | 502, ok=false |
| API-CAN-03 | 候选包装结构 | 正常搜索 | candidates[0].sourceLabel="知乎优先", candidates 含 concepts/reason/bridgePreview |
| API-CAN-04 | 含 globalItems[1] | global 返回 >=2 条 | 含 "意外发现" 候选 |
| API-CAN-05 | 知乎搜索失败 | zhihu_search 返回错误 | handleApiError 捕获 |

### 2.4 POST /api/choose

| 编号 | 场景 | 请求体 | 预期响应 |
|------|------|--------|----------|
| API-CHO-01 | 正常生成 step + directions | route.length < 9 | 200, 含 step/bridge/directions(3)/nextCuratorMessage |
| API-CHO-02 | 最后一站 | route.length >= 9 | 200, directions=[], isLastStep=true |
| API-CHO-03 | AI 未返回 step.title | mock 缺失 title | 502, ok=false |
| API-CHO-04 | AI 未返回足够 directions | route<9 但 directions<3 | 502, ok=false |

### 2.5 POST /api/book

| 编号 | 场景 | 请求体 | 预期响应 |
|------|------|--------|----------|
| API-BOOK-01 | 正常装订 | route.length>=1 | 200, 含 book.id/title/preface/steps/sourceAuthors |
| API-BOOK-02 | 空路线 | `{route:[]}` | 400, ok=false |
| API-BOOK-03 | 章节数对齐 | route.length=5 | book.steps.length=5 |
| API-BOOK-04 | fallback 字段 | AI 未返回 title | book.title="我读出的一本非书" |

### 2.6 POST /api/cover

| 编号 | 场景 | 请求体 | 预期响应 |
|------|------|--------|----------|
| API-COV-01 | 正常生成 | book 对象 | 200, coverConcept 含 coverTitle/visualKeywords/colorPalette |
| API-COV-02 | 空 book | `{book:null}` | 可能 200 或 AI 报错 |

### 2.7 GET /api/models

| 编号 | 场景 | 请求参数 | 预期响应 |
|------|------|----------|----------|
| API-MOD-01 | 正常获取 | provider=siliconflow | 200, models 为数组 |
| API-MOD-02 | 缓存命中 | 重复请求 | 200, cached=true |
| API-MOD-03 | 未配置 Key | 无 SILICONFLOW Key | 503, ok=false |
| API-MOD-04 | 过滤 Kimi 模型 | provider=siliconflow | models 只含 /moonshot\|kimi/i |
| API-MOD-05 | POST 请求 | method="POST" | 405, ok=false |

---

## 三、前端 src/ — 功能测试

### 3.1 src/app.js — 输入检测

| 编号 | 场景 | 输入 | 预期行为 |
|------|------|------|----------|
| APP-01 | 知乎回答链接 | `"https://www.zhihu.com/question/123/answer/456"` | detectStartInput -> {ok:true, label:"知乎回答", mode:"zhihu"} |
| APP-02 | 知乎文章链接 | `"https://zhuanlan.zhihu.com/p/123"` | detectStartInput -> {ok:true, label:"知乎文章"} |
| APP-03 | 知乎问题链接 | `"https://www.zhihu.com/question/123"` | detectStartInput -> {ok:true, label:"知乎问题"} |
| APP-04 | 外部链接 | `"https://example.com/post"` | detectStartInput -> {ok:true, label:"example.com 文章链接", mode:"external"} |
| APP-05 | 粘贴文本 | text>=20, url="" | detectStartInput -> {ok:true, label:"粘贴文本片段", mode:"text"} |
| APP-06 | 空输入 | url="", text="" | detectStartInput -> {ok:false} |
| APP-07 | 无效链接+无文本 | url="abc", text="" | detectStartInput -> {ok:false} |

### 3.2 src/app.js — 状态与路由

| 编号 | 场景 | 操作 | 预期状态 |
|------|------|------|----------|
| APP-08 | navigate landing | navigate("landing") | state.view="landing" |
| APP-09 | startAdventure 成功 | 提交有效 URL | state.view="adventure", route.length=1 |
| APP-10 | startAdventure 失败 | 提交无效 URL | state.error 有值，state.loading="" |
| APP-11 | chooseDirection Demo | useDemo=true | state.selectedDirection=direction.text |
| APP-12 | chooseDirection 真实 | useDemo=false | state.loading="正在搜索...", 调用 /api/candidates |
| APP-13 | goNext Demo | useDemo=true, currentIndex=0 | currentIndex=1, route.length=2 |
| APP-14 | goNext 真实最后一站 | route.length>=10 | state.finished=true |
| APP-15 | finishBook Demo | useDemo=true | view="book", 保存到 localStorage |
| APP-16 | finishBook 真实 | useDemo=false | 调用 /api/book + /api/cover, 保存到 localStorage |
| APP-17 | 提前结束 | route.length>=3 点击"现在生成非书" | 调用 finishBook |
| APP-18 | restart | 点击重新开始 | state 重置为初始值，view="start" |
| APP-19 | makeBook 短路线 | route.length=3 | title="我读出的一本短非书" |
| APP-20 | makeBook 完整路线 | route.length=10 | title=adventure.title |
| APP-21 | saveCurrentBook 去重 | 相同 title 已存在 | 保留新记录，移除旧记录 |
| APP-22 | saveCurrentBook 上限 | 已有 12 本书 | 保留前 12 本 |
| APP-23 | readLibrary 损坏数据 | localStorage 存非法 JSON | 返回 [] |
| APP-24 | loadingText 等待<8秒 | 等待 3 秒 | 不含"已等待" |
| APP-25 | loadingText 等待>=8秒 | 等待 10 秒 | 含"已等待 10 秒" |

### 3.3 src/app.js — 数据计算

| 编号 | 场景 | 输入 | 预期输出 |
|------|------|------|----------|
| APP-26 | uniqueAuthors | steps 含重复 author | 去重后的作者数组 |
| APP-27 | authorCount | book 有 authorCount 字段 | 返回 authorCount 值 |
| APP-28 | authorCount | book 无 authorCount | 计算 uniqueAuthors 长度 |
| APP-29 | conceptCount | steps 含重复 concepts | 去重后的概念总数 |
| APP-30 | firstStepFromStart | API 返回 data | step 含 title/author/url/summary/concepts/bridge |

### 3.4 src/admin.js — 配置管理

| 编号 | 场景 | 操作 | 预期行为 |
|------|------|------|----------|
| ADMIN-01 | readConfig 空 | localStorage 无配置 | 返回 mergeAiConfig() 默认值 |
| ADMIN-02 | readConfig 有值 | localStorage 有合法 JSON | 与默认值合并 |
| ADMIN-03 | readConfig 损坏 | localStorage 非法 JSON | 返回 mergeAiConfig() 默认值 |
| ADMIN-04 | writeConfig | 修改 state.config | 持久化到 localStorage |
| ADMIN-05 | collectFormValues | 修改表单字段 | state.config 对应字段更新 |
| ADMIN-06 | updateNode temperature | 输入 0.5 | Number(0.5) |
| ADMIN-07 | updateNode prompt | 输入文本 | 字符串保存 |
| ADMIN-08 | modelControl 无模型列表 | models=[] | 显示 input 而非 select |
| ADMIN-09 | modelControl 有列表匹配 | model 在列表中 | select 选中对应项，不显示自定义输入 |
| ADMIN-10 | modelControl 有列表不匹配 | model 不在列表中 | select 选中 "__custom__"，显示自定义输入 |
| ADMIN-11 | 切换 provider | siliconflow -> kimi | model 自动切换为 kimi 默认值 |
| ADMIN-12 | loadProviderModels 成功 | /api/models 返回列表 | state.modelLists 更新 |
| ADMIN-13 | loadProviderModels 失败 | /api/models 返回错误 | 使用内置备用列表 |
| ADMIN-14 | toggleNode | 点击 header | expandedNodes 增删 |

### 3.5 src/aiNodeConfig.js

| 编号 | 场景 | 输入 | 预期输出 |
|------|------|------|----------|
| CONFIG-01 | mergeAiConfig 空 | `{}` | 所有节点为完整默认值 |
| CONFIG-02 | mergeAiConfig 部分覆盖 | `{start:{temperature:0.5}}` | start.temperature=0.5, 其余字段默认 |
| CONFIG-03 | mergeAiConfig 保留 key | 任意配置 | 每个节点对象含 key 字段 |

---

## 四、E2E 用户流程 — 端到端测试

### 4.1 核心流程

| 编号 | 场景 | 步骤 | 预期结果 |
|------|------|------|----------|
| E2E-01 | 完整 10 站真实路线 | 1) 输入 URL -> /api/start -> 2) 选方向 -> /api/candidates -> 3) 选候选 -> /api/choose x9 -> 4) /api/book + /api/cover | 最终 view="book", localStorage 有保存记录 |
| E2E-02 | 提前结束（第 3 站） | 完成 3 站后点击"现在生成非书" | book.steps.length=3, title="我读出的一本短非书" |
| E2E-03 | Mock 演示路线 | 点击"使用演示路线" -> 选择方向 -> 选择候选 | 不调用 API, route 来自 adventure.steps |
| E2E-04 | 粘贴文本起点 | 粘贴 >=20 字符文本，不输入 URL | /api/start 返回 basedOnUserText=true |
| E2E-05 | 链接解析失败降级 | 输入不可达链接，无粘贴文本 | 提示"链接暂时无法解析" |
| E2E-06 | 链接解析失败+粘贴文本 | 输入不可达链接 + 粘贴文本 | 基于粘贴文本启动 |
| E2E-07 | 起点页 -> 图书馆 -> 返回 | navigate("library") -> 点击"开始新的非书" | view="start" |
| E2E-08 | 图书馆点击示例书 | 点击 sampleBooks[0] | view="book", activeBook=对应示例书 |
| E2E-09 | 非书详情页再读一次 | 点击"再读一次" | 调用 restart(), view="start" |
| E2E-10 | Admin 配置保存 | 修改温度 -> 保存 -> 刷新页面 | 配置保持修改后的值 |
| E2E-11 | Admin 恢复默认 | 修改后点击恢复默认 | 配置恢复 aiNodeDefaults |

### 4.2 异常与边界

| 编号 | 场景 | 步骤 | 预期结果 |
|------|------|------|----------|
| E2E-12 | AI 节点超时 | /api/directions 超时 | 显示"AI 服务暂时没有响应，请稍后重试。" |
| E2E-13 | 候选搜索失败 | /api/candidates 知乎搜索失败 | 显示错误信息，不静默降级 |
| E2E-14 | 装订时封面 API 失败 | /api/book 成功, /api/cover 失败 | 非书仍生成，coverConcept 为失败提示 |
| E2E-15 | 无网络启动 | 离线状态输入 URL | fetch 失败，显示错误提示 |
| E2E-16 | localStorage 满 | 保存超过 12 本书 | 只保留最近 12 本 |
| E2E-17 | 快速连续点击方向 | 在 API 响应前多次点击 | 由于 state.loading 存在，UI 应防重复提交 |
| E2E-18 | 第 10 站无 directions | route.length=10 | adventure 页面显示"已抵达第 10 站，可以生成非书。" |

---

## 五、冒烟检查脚本验证

| 编号 | 场景 | 命令 | 预期结果 |
|------|------|------|----------|
| SMOKE-01 | 知乎基础验证 | `npm run check` | 所有基础检查通过 |
| SMOKE-02 | 知乎搜索探针 | `npm run probe:zhihu-search` | 返回搜索结果 |
| SMOKE-03 | 全网搜索探针 | `npm run probe:global-search` | 返回搜索结果 |
| SMOKE-04 | 单文件构建 | `npm run build:standalone` | 生成 dist/demo.html |
