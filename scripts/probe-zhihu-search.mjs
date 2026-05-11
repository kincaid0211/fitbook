import crypto from "node:crypto";
import fs from "node:fs";
import https from "node:https";

const appKey = process.env.ZHIHU_APP_KEY;
const secretPath = "note/zhihuhackathon/知乎API Key.md";
const appSecret = fs.readFileSync(secretPath, "utf8").trim();

if (!appKey) {
  console.error("Missing ZHIHU_APP_KEY.");
  process.exit(1);
}

const baseUrl = "https://openapi.zhihu.com";
const endpoint = "/api/v1/content/zhihu_search";
const testQuery = process.env.ZHIHU_TEST_QUERY || "https://www.zhihu.com/question/2034716605649826257/answer/2035777145448964149";

function buildHeaders() {
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const logId = `probe_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const extraInfo = "";
  const signText = `app_key:${appKey}|ts:${timestamp}|logid:${logId}|extra_info:${extraInfo}`;
  const sign = crypto.createHmac("sha256", appSecret).update(signText).digest("base64");
  return {
    "X-App-Key": appKey,
    "X-Timestamp": timestamp,
    "X-Log-Id": logId,
    "X-Sign": sign,
    "X-Extra-Info": extraInfo,
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
  const data = payload.data;
  let dataShape = typeof data;
  let sample = null;

  if (Array.isArray(data)) {
    dataShape = `array(${data.length})`;
    sample = data[0] ? Object.keys(data[0]) : null;
  } else if (data && typeof data === "object") {
    dataShape = `object(${Object.keys(data).join(",")})`;
    const firstArray = Object.values(data).find((value) => Array.isArray(value));
    if (firstArray) sample = firstArray[0] ? Object.keys(firstArray[0]) : null;
  }

  return {
    status: payload.status,
    msg: payload.msg,
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

const variants = [
  { query: testQuery },
  { q: testQuery },
  { keyword: testQuery },
  { keywords: testQuery },
  { query: testQuery, limit: "5" },
  { q: testQuery, limit: "5" },
];

const results = [];
for (const params of variants) {
  const search = new URLSearchParams(params);
  const url = `${baseUrl}${endpoint}?${search}`;
  const result = await requestJson(url);
  results.push({
    params: Object.keys(params),
    statusCode: result.statusCode,
    error: result.error,
    summary: summarizePayload(result.parsed),
  });
}

console.log(JSON.stringify({ endpoint, testQueryType: "answer_url", results }, null, 2));

