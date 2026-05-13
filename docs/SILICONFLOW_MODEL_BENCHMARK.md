# 硅基流动模型响应测试与节点配置方案

更新日期：2026-05-13

## 1. 测试范围

本次通过硅基流动 OpenAI 兼容接口拉取到 102 个可用模型，其中与中文文本、结构化 JSON、策展生成相关的候选模型约 80 个。

先做短 JSON 烟测，再用项目真实 AI 节点 payload 测试以下节点：

- `start`：起点理解与知识卡片。
- `candidates`：候选内容策展包装。
- `directions`：下一章方向生成。
- `choose`：章节导读、知识桥、兴趣画像和下一章方向。
- `book`：非书元信息。
- `cover`：封面方案。

测试口径：

- 使用 `response_format: { type: "json_object" }`。
- 使用节点级 `max_tokens`。
- 单次请求 30-35 秒超时。
- 只记录能否返回合法 JSON 与核心字段是否完整。
- 不打印、不记录任何 API Key。

## 2. 关键发现

1. `Pro/moonshotai/Kimi-K2.5` 和 `Pro/moonshotai/Kimi-K2.6` 在当前硅基流动链路下不适合作为主流程默认模型。多个真实节点 30-35 秒未返回，少数成功请求也出现大量 reasoning tokens，导致延迟接近或超过半分钟。
2. `Pro/deepseek-ai/DeepSeek-V3.2` 质量稳定，但多节点耗时 12-33 秒，更适合后台增强或非关键链路，不适合作为每个节点的默认模型。
3. `THUDM/GLM-4-32B-0414` 在轻量生产提示词下综合最好：`start` 约 12.4 秒，`choose` 约 7.9 秒，其余节点约 3-5.5 秒。
4. `Qwen/Qwen3-30B-A3B-Instruct-2507` 在 `book` 节点速度和表达质量都较好，约 4.3 秒；但在 `start` 长输出场景 JSON 稳定性不如 GLM。
5. `Qwen/Qwen2.5-32B-Instruct` 结构化稳定，但复杂节点波动较大；可作为 `start` 的长提示词兜底模型，实测约 28.3 秒。
6. 管理页保存的长 `systemPrompt` 会显著拖慢或破坏部分模型 JSON 稳定性。生产默认路径建议只使用公共 `curatorSystem` + 节点 user payload + 节点模型配置；长提示词仅作为人工调试材料。

## 3. 推荐节点模型配置

| 节点 | 推荐模型 | 温度 | 超时 | max_tokens | 实测表现 | 说明 |
| --- | --- | ---: | ---: | ---: | --- | --- |
| `start` | `THUDM/GLM-4-32B-0414` | 0.25 | 25-30s | 850-900 | 轻量提示词约 12.4s | 起点需要中文概念提炼和知识卡片，GLM 在轻量提示词下稳定；长提示词兜底可用 `Qwen/Qwen2.5-32B-Instruct`。 |
| `candidates` | `THUDM/GLM-4-32B-0414` | 0.30-0.35 | 15-20s | 650-700 | 约 5.5-7.5s | 任务是短文本包装，优先速度和稳定 JSON；失败时已有规则化展示兜底。 |
| `directions` | `THUDM/GLM-4-32B-0414` | 0.35 | 15-20s | 650-700 | 约 4.3-4.9s | 方向生成要求具体但不需要重推理，GLM 足够。 |
| `choose` | `THUDM/GLM-4-32B-0414` | 0.35 | 25-30s | 1000-1200 | 约 7.9-9.5s | 当前最关键串行节点，GLM 在复杂 JSON 下速度最好；`Qwen/Qwen3-30B-A3B-Instruct-2507` 可作质量兜底但约 15-17s。 |
| `book` | `Qwen/Qwen3-30B-A3B-Instruct-2507` | 0.45 | 15-20s | 900-1000 | 约 3.9-4.4s | 书名、序言、总结更吃表达包装，Qwen3 速度快且文本完成度好。 |
| `cover` | `THUDM/GLM-4-32B-0414` | 0.55 | 10-15s | 600-700 | 约 3.0-3.5s | 封面方案是短 JSON，速度优先；失败时可直接使用 CSS 规则封面。 |

## 4. 已落地的服务端默认策略

`lib/model.js` 已加入节点默认模型表：

```text
start       -> THUDM/GLM-4-32B-0414
candidates  -> THUDM/GLM-4-32B-0414
directions  -> THUDM/GLM-4-32B-0414
choose      -> THUDM/GLM-4-32B-0414
book        -> Qwen/Qwen3-30B-A3B-Instruct-2507
cover       -> THUDM/GLM-4-32B-0414
```

`src/aiNodeConfig.js` 的管理页默认模型略有区别：由于管理页会保存更长的节点 `systemPrompt`，`start` 默认使用长提示词下更稳的 `Qwen/Qwen2.5-32B-Instruct`，其余节点沿用 GLM/Qwen3 组合。

可用环境变量逐节点覆盖：

```text
SILICONFLOW_START_MODEL
SILICONFLOW_CANDIDATES_MODEL
SILICONFLOW_DIRECTIONS_MODEL
SILICONFLOW_CHOOSE_MODEL
SILICONFLOW_BOOK_MODEL
SILICONFLOW_COVER_MODEL
```

仍保留 `SILICONFLOW_FAST_MODEL` 作为 `start / candidates / directions / cover` 的旧版统一快速模型覆盖项；显式传入的节点 `model` 优先级最高。

## 5. 后续建议

1. 不要把管理页长 `systemPrompt` 作为默认线上配置保存到浏览器。它适合人工调 prompt，不适合评审 Demo 主链路。
2. 给所有 AI 响应增加 `meta.durationMs / model / fallback / cacheHit`，后续用真实评审路径数据再校准模型表。
3. `choose` 仍建议下一步拆成“即时 step + 后台 bridge/directions”，这样用户可见等待能从 8-10 秒继续压到 1 秒内。
4. `start` 如果遇到长文本或 URL 解析慢，应先返回规则知识卡片，再后台刷新 AI 卡片。
