// 「非书」AI 策展人提示词与节点 user payload 构造。
// 同步参考：docs/AI_FUNCTION_LOGIC.md §1-§8、docs/TECHNICAL_PLAN.md §3-§5。
//
// 本文件为兼容层，全部内容已按节点拆分到 lib/prompts/ 目录下。
// 如需新增节点，请在 lib/prompts/ 下创建新文件并在此 re-export。

export * from "./prompts/_shared.js";
export * from "./prompts/start.js";
export * from "./prompts/directions.js";
export * from "./prompts/choose.js";
export * from "./prompts/book.js";
export * from "./prompts/cover.js";
export * from "./prompts/candidates.js";
