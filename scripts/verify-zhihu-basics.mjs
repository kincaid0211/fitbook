import crypto from "node:crypto";

const sampleUrls = [
  "https://zhuanlan.zhihu.com/p/123456789",
  "https://www.zhihu.com/question/123456789/answer/987654321",
  "https://www.zhihu.com/question/123456789",
  "https://www.zhihu.com/market/paid_column/1859631633608667136/section/2005022453466939621",
];

function parseZhihuUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  if (host === "zhuanlan.zhihu.com") {
    const match = path.match(/^\/p\/([^/]+)/);
    if (match) return { ok: true, type: "article", id: match[1], host, url: url.toString() };
  }

  if (host === "www.zhihu.com" || host === "zhihu.com") {
    let match = path.match(/^\/question\/([^/]+)\/answer\/([^/]+)/);
    if (match) {
      return {
        ok: true,
        type: "answer",
        questionId: match[1],
        answerId: match[2],
        host,
        url: url.toString(),
      };
    }

    match = path.match(/^\/question\/([^/]+)/);
    if (match) return { ok: true, type: "question", id: match[1], host, url: url.toString() };

    match = path.match(/^\/market\/paid_column\/([^/]+)\/section\/([^/]+)/);
    if (match) {
      return {
        ok: true,
        type: "knowledge_section",
        columnId: match[1],
        sectionId: match[2],
        host,
        url: url.toString(),
      };
    }
  }

  return { ok: false, reason: "unsupported_zhihu_url", host, path };
}

function buildZhihuHeaders({ appKey, appSecret, timestamp, logId, extraInfo = "" }) {
  const signText = `app_key:${appKey}|ts:${timestamp}|logid:${logId}|extra_info:${extraInfo}`;
  const sign = crypto.createHmac("sha256", appSecret).update(signText).digest("base64");
  return {
    "X-App-Key": appKey,
    "X-Timestamp": timestamp,
    "X-Log-Id": logId,
    "X-Sign": sign,
    "X-Extra-Info": extraInfo,
  };
}

const parsed = sampleUrls.map(parseZhihuUrl);
const headers = buildZhihuHeaders({
  appKey: "sample_user_token",
  appSecret: "sample_secret",
  timestamp: "1778438400",
  logId: "request_sample",
});

console.log(
  JSON.stringify(
    {
      urlParsing: parsed,
      signatureHeaderKeys: Object.keys(headers),
      signatureLooksBase64: /^[A-Za-z0-9+/]+={0,2}$/.test(headers["X-Sign"]),
      note: "This local smoke test does not use real credentials or call the network.",
    },
    null,
    2,
  ),
);

