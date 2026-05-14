import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { publishPin } from "../lib/circle.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, "POST")) return;

  try {
    const body = await readJson(req);
    const { content, ringId = "2029619126742656657" } = body || {};

    if (!content || typeof content !== "string" || content.trim().length < 5) {
      sendJson(res, 400, { ok: false, message: "想法内容不能为空，且至少 5 个字。" });
      return;
    }

    const data = await publishPin({ content: content.trim(), ringId });
    sendJson(res, 200, { ok: true, data });
  } catch (error) {
    handleApiError(res, error, "发布想法失败。");
  }
}
