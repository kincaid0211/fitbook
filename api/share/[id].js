import { sendJson, handleApiError } from "../../lib/http.js";
import { safeKvGet } from "../../lib/share-store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, message: "只支持 GET 请求。" });
    return;
  }

  try {
    const { id } = req.query || {};

    if (!id || typeof id !== "string" || id.length < 1) {
      sendJson(res, 400, { ok: false, message: "分享 ID 不能为空。" });
      return;
    }

    const raw = await safeKvGet(`share:${id}`);
    if (!raw) {
      sendJson(res, 404, { ok: false, message: "分享已过期或不存在。" });
      return;
    }

    const book = typeof raw === "string" ? JSON.parse(raw) : raw;
    sendJson(res, 200, { ok: true, data: { book } });
  } catch (error) {
    handleApiError(res, error, "读取分享失败。");
  }
}
