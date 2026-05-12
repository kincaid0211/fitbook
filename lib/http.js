export async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks.map((chunk) => (Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))).toString(
    "utf8",
  );
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("请求体不是有效 JSON。");
    error.statusCode = 400;
    throw error;
  }
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function methodGuard(req, res, method = "POST") {
  if (req.method === method) return true;
  sendJson(res, 405, { ok: false, message: `只支持 ${method} 请求。` });
  return false;
}

export function handleApiError(res, error, fallbackMessage = "请求失败，请稍后重试。") {
  const statusCode = error.statusCode || 500;
  sendJson(res, statusCode, {
    ok: false,
    message: error.publicMessage || error.message || fallbackMessage,
  });
}
