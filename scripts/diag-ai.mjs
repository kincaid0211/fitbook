// Diagnose why callModelJson fails when invoked through api/start.js but works standalone
import { parseStartContent } from "../lib/parser.js";
import { callModelJson } from "../lib/model.js";
import {
  curatorSystem,
  getNodeConfig,
  nodePrompt,
  buildStartUserPayload,
} from "../lib/prompts.js";

async function test() {
  const body = {
    url: "https://www.zhihu.com/question/20337986",
    text: "从审美标准、历史语境到个人经验，重新审视「高级」这个概念本身。",
    hotItem: {
      title: "为什么古典音乐听起来比流行音乐更高级？",
      excerpt: "从审美标准、历史语境到个人经验，重新审视「高级」这个概念本身。",
      tag: "音乐",
      url: "https://www.zhihu.com/question/20337986",
    },
    aiConfig: {},
  };

  console.log("=== Step 1: parseStartContent ===");
  let parsed;
  try {
    parsed = await parseStartContent({ url: body.url || "", text: body.text || "" });
    console.log("parsed.source:", parsed.source);
    console.log("parsed.basedOnUserText:", parsed.basedOnUserText);
  } catch (e) {
    console.log("parse error:", e.message);
    return;
  }

  console.log("\n=== Step 2: build config & prompt ===");
  const nodeConfig = getNodeConfig(body, "start");
  console.log("nodeConfig:", JSON.stringify(nodeConfig));
  const system = nodePrompt(curatorSystem, nodeConfig);
  console.log("system prompt length:", system.length);

  const user = buildStartUserPayload({ parsed, hotItem: body.hotItem });
  console.log("user payload length:", user.length);

  console.log("\n=== Step 3: callModelJson (with debug) ===");
  try {
    const result = await callModelJson({
      system,
      nodeConfig,
      user,
      enableCache: false,
    });
    console.log("SUCCESS! model:", result.model, "provider:", result.provider);
    console.log("data keys:", Object.keys(result.data).join(", "));
  } catch (error) {
    console.log("ERROR message:", error.message);
    console.log("ERROR statusCode:", error.statusCode);
    console.log("ERROR publicMessage:", error.publicMessage);
    console.log("ERROR original:", error.cause?.message || error.stack?.split("\n")[0]);
  }
}

test();
