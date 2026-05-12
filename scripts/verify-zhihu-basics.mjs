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

function buildZhihuDataHeaders({ accessSecret, timestamp }) {
  return {
    Authorization: `Bearer ${accessSecret}`,
    "X-Request-Timestamp": timestamp,
    "Content-Type": "application/json",
  };
}

const parsed = sampleUrls.map(parseZhihuUrl);
const headers = buildZhihuDataHeaders({
  accessSecret: "sample_access_secret",
  timestamp: "1778438400",
});

console.log(
  JSON.stringify(
    {
      urlParsing: parsed,
      bearerHeaderKeys: Object.keys(headers),
      timestampLooksSeconds: /^\d{10}$/.test(headers["X-Request-Timestamp"]),
      authUsesBearer: headers.Authorization.startsWith("Bearer "),
      note: "This local smoke test does not use real credentials or call the network.",
    },
    null,
    2,
  ),
);
