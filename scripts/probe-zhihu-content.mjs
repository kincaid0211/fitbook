import fs from "node:fs";
import https from "node:https";

const secretPath = "note/zhihuhackathon/知乎API Key.md";
const accessSecret = process.env.ZHIHU_ACCESS_SECRET || fs.readFileSync(secretPath, "utf8").trim();

if (!accessSecret) {
  console.error("Missing ZHIHU_ACCESS_SECRET.");
  process.exit(1);
}

const baseUrl = "https://developer.zhihu.com";
const apiName = process.env.ZHIHU_CONTENT_API || "zhihu_search";
const endpoint = `/api/v1/content/${apiName}`;
const testQuery = process.env.ZHIHU_TEST_QUERY || (apiName === "global_search" ? "ChatGPT" : "心理学");
const count = process.env.ZHIHU_TEST_COUNT || "5";

function buildHeaders() {
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  return {
    Authorization: `Bearer ${accessSecret}`,
    "X-Request-Timestamp": timestamp,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function requestJson(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: buildHeaders(), timeout: 15000 }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = { raw: body.slice(0, 800) };
        }
        resolve({ statusCode: res.statusCode, parsed });
      });
    });

    req.on("error", (error) => {
      resolve({ error: error.message });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ error: "request_timeout" });
    });
  });
}

function summarizePayload(payload) {
  if (!payload || typeof payload !== "object") return payload;
  const data = payload.Data ?? payload.data;
  let dataShape = typeof data;
  let sample = null;
  let itemCount = null;
  let firstItem = null;

  if (Array.isArray(data)) {
    dataShape = `array(${data.length})`;
    sample = data[0] ? Object.keys(data[0]) : null;
    itemCount = data.length;
  } else if (data && typeof data === "object") {
    dataShape = `object(${Object.keys(data).join(",")})`;
    const firstArray = Object.values(data).find((value) => Array.isArray(value));
    if (firstArray) {
      sample = firstArray[0] ? Object.keys(firstArray[0]) : null;
      itemCount = firstArray.length;
      firstItem = firstArray[0]
        ? {
            title: firstArray[0].Title,
            contentType: firstArray[0].ContentType,
            voteUpCount: firstArray[0].VoteUpCount,
            commentCount: firstArray[0].CommentCount,
            authorName: firstArray[0].AuthorName,
          }
        : null;
    }
  }

  return {
    code: payload.Code ?? payload.status,
    message: payload.Message ?? payload.msg,
    itemCount,
    firstItem,
    error: payload.error
      ? {
          code: payload.error.code,
          name: payload.error.name,
          message: payload.error.message,
        }
      : undefined,
    dataShape,
    sampleKeys: sample,
  };
}

const search = new URLSearchParams({ Query: testQuery, Count: count });
const url = `${baseUrl}${endpoint}?${search}`;
const result = await requestJson(url);

console.log(
  JSON.stringify(
    {
      endpoint: `${baseUrl}${endpoint}`,
      apiName,
      query: testQuery,
      count,
      statusCode: result.statusCode,
      error: result.error,
      summary: summarizePayload(result.parsed),
    },
    null,
    2,
  ),
);
