import { methodGuard, sendJson, handleApiError } from "../lib/http.js";
import { getHotList, searchZhihuContent } from "../lib/zhihu.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, "GET")) return;

  try {
    const refresh = new URL(req.url, "http://localhost").searchParams.get("refresh") === "1";
    const data = refresh
      ? await searchZhihuContent({ apiName: "hot_list", query: "", count: "" })
      : await getHotList();

    const items = (data.items || []).slice(0, 6).map((item) => ({
      title: item.title || "",
      url: item.url || "",
      tag: "热榜",
      excerpt: item.summary || "",
      thumbnailUrl: item.thumbnailUrl || "",
    }));

    sendJson(res, 200, { ok: true, items });
  } catch (error) {
    handleApiError(res, error, "获取热榜失败。");
  }
}
