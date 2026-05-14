import { methodGuard, readJson, sendJson, handleApiError } from "../lib/http.js";
import { nanoid } from "nanoid";
import { safeKvSet } from "../lib/share-store.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, "POST")) return;

  try {
    const body = await readJson(req);
    const { book } = body || {};

    if (!book || typeof book !== "object" || !book.title) {
      sendJson(res, 400, { ok: false, message: "非书数据不能为空。" });
      return;
    }

    const id = nanoid(8);
    await safeKvSet(`share:${id}`, JSON.stringify(book), { ex: 2592000 });

    sendJson(res, 200, { ok: true, data: { id } });
  } catch (error) {
    handleApiError(res, error, "创建分享失败。");
  }
}
