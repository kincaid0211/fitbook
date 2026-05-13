/**
 * 端到端测试：验证入口体验增强功能
 * 测试范围：URL 预填充、知乎热榜入口、Bookmarklet
 */
import { readFileSync } from "fs";
import { JSDOM } from "jsdom";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  let passed = 0;
  let failed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ❌ ${name}: ${err.message}`);
      failed++;
    }
  }
  console.log(`\n结果：${passed} 通过，${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}

// === 静态检查：app.js ===
test("app.js 包含 featuredStarts 数组", () => {
  const appJs = readFileSync(join(rootDir, "src/app.js"), "utf-8");
  if (!appJs.includes("const featuredStarts")) {
    throw new Error("未找到 featuredStarts 定义");
  }
  if (!appJs.includes("为什么古典音乐听起来比流行音乐更高级")) {
    throw new Error("featuredStarts 内容不完整");
  }
});

test("app.js 包含 handleUrlParams 函数", () => {
  const appJs = readFileSync(join(rootDir, "src/app.js"), "utf-8");
  if (!appJs.includes("function handleUrlParams()")) {
    throw new Error("未找到 handleUrlParams 定义");
  }
  if (!appJs.includes('params.get("url")')) {
    throw new Error("未读取 url 参数");
  }
  if (!appJs.includes('params.get("text")')) {
    throw new Error("未读取 text 参数");
  }
});

test("app.js 包含 how-to-start 和 bookmarklet-link", () => {
  const appJs = readFileSync(join(rootDir, "src/app.js"), "utf-8");
  if (!appJs.includes("how-to-start")) {
    throw new Error("未找到 how-to-start");
  }
  if (!appJs.includes("bookmarklet-link")) {
    throw new Error("未找到 bookmarklet-link");
  }
});

test("app.js 包含知乎热榜卡片渲染", () => {
  const appJs = readFileSync(join(rootDir, "src/app.js"), "utf-8");
  if (!appJs.includes("featured-starts")) {
    throw new Error("未找到 featured-starts 样式区块");
  }
  if (!appJs.includes("featured-card")) {
    throw new Error("未找到 featured-card 渲染");
  }
  if (!appJs.includes("data-hot-index")) {
    throw new Error("未找到 featured-card data-hot-index 属性");
  }
});

test("启动逻辑先调用 handleUrlParams 再 render", () => {
  const appJs = readFileSync(join(rootDir, "src/app.js"), "utf-8");
  const idxHandle = appJs.indexOf("handleUrlParams()");
  const idxRender = appJs.indexOf("render();");
  if (idxHandle === -1) throw new Error("未调用 handleUrlParams");
  if (idxRender === -1) throw new Error("未调用 render");
  if (idxHandle < idxRender) {
    const snippet = appJs.slice(idxHandle - 20, idxRender + 20);
    if (!snippet.includes("if (!handleUrlParams())")) {
      throw new Error("handleUrlParams 未在条件判断中先于 render 调用");
    }
  }
});

// === 静态检查：dist/demo.html ===
test("dist/demo.html 包含 how-to-start 和 bookmarklet", () => {
  const demo = readFileSync(join(rootDir, "dist/demo.html"), "utf-8");
  if (!demo.includes("how-to-start")) {
    throw new Error("demo.html 未内联 how-to-start");
  }
  if (!demo.includes("bookmarklet-link")) {
    throw new Error("demo.html 未内联 bookmarklet-link");
  }
});

test("dist/demo.html 包含知乎热榜入口卡片", () => {
  const demo = readFileSync(join(rootDir, "dist/demo.html"), "utf-8");
  if (!demo.includes("featured-starts")) {
    throw new Error("demo.html 未内联 featured-starts");
  }
  if (!demo.includes("featured-card")) {
    throw new Error("demo.html 未内联 featured-card");
  }
  if (!demo.includes("从知乎热榜直接开始")) {
    throw new Error("demo.html 未包含新版热榜入口文案");
  }
});

test("dist/demo.html 包含 handleUrlParams 逻辑", () => {
  const demo = readFileSync(join(rootDir, "dist/demo.html"), "utf-8");
  if (!demo.includes("handleUrlParams")) {
    throw new Error("demo.html 未内联 handleUrlParams");
  }
  if (!demo.includes('get("url")')) {
    throw new Error("demo.html 未内联 url 参数读取");
  }
});

// === DOM 交互测试：用 jsdom 加载 dist/demo.html ===
test("jsdom 加载 dist/demo.html 后落地页显示 bookmarklet", async () => {
  const html = readFileSync(join(rootDir, "dist/demo.html"), "utf-8");
  const dom = new JSDOM(html, {
    url: "http://localhost:5173/",
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
  });
  const document = dom.window.document;

  await new Promise((resolve) => setTimeout(resolve, 500));

  const bookmarkletLink = document.querySelector("#bookmarklet-link");
  if (!bookmarkletLink) {
    throw new Error("未找到 #bookmarklet-link 元素");
  }
  if (!bookmarkletLink.href.includes("javascript:")) {
    throw new Error(`Bookmarklet href 不是 javascript: 协议，实际为: ${bookmarkletLink.href.slice(0, 80)}`);
  }
  if (!bookmarkletLink.href.includes("encodeURIComponent(location.href)")) {
    throw new Error("Bookmarklet 未包含 encodeURIComponent(location.href)");
  }
});

test("jsdom 加载后导航到 start 页显示热榜入口卡片", async () => {
  const html = readFileSync(join(rootDir, "dist/demo.html"), "utf-8");
  const dom = new JSDOM(html, {
    url: "http://localhost:5173/",
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
  });
  const document = dom.window.document;

  await new Promise((resolve) => setTimeout(resolve, 500));

  const startButtons = [...document.querySelectorAll("[data-view='start']")];
  if (startButtons.length === 0) {
    throw new Error("未找到 data-view='start' 按钮");
  }
  startButtons[0].click();

  await new Promise((resolve) => setTimeout(resolve, 200));

  const featuredCards = document.querySelectorAll(".featured-card");
  if (featuredCards.length !== 6) {
    throw new Error(`热榜入口卡片数量应为 6，实际为 ${featuredCards.length}`);
  }

  const tags = [...featuredCards].map((card) => card.querySelector(".tag")?.textContent);
  const expectedTags = ["音乐", "认知", "AI", "心理学", "社会", "成长"];
  for (const tag of expectedTags) {
    if (!tags.includes(tag)) {
      throw new Error(`未找到标签 "${tag}"`);
    }
  }
});

test("jsdom 模拟 ?url= 参数自动触发探索", async () => {
  const html = readFileSync(join(rootDir, "dist/demo.html"), "utf-8");
  const fetchMockScript = `<script>window.__testFetchMock={calls:[],payloads:[]};window.fetch=async(u,o)=>{window.__testFetchMock.calls.push(u);window.__testFetchMock.payloads.push(o?.body?JSON.parse(o.body):null);return{ok:false,json:async()=>({ok:false,message:"mock"})};};</script>`;
  const modifiedHtml = html.replace("<head>", "<head>" + fetchMockScript);

  const dom = new JSDOM(modifiedHtml, {
    url: "http://localhost:5173/?url=https://www.zhihu.com/question/123456",
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
  });

  await new Promise((resolve) => setTimeout(resolve, 1200));

  const mock = dom.window.__testFetchMock;
  if (!mock || mock.calls.length === 0) {
    throw new Error("fetch 未被调用，URL 参数未触发 startAdventure");
  }
  const payload = mock.payloads[0];
  if (!payload?.url) {
    throw new Error("fetch payload 未包含 url 字段");
  }
  if (!payload.url.includes("zhihu.com/question/123456")) {
    throw new Error(`fetch payload url 不正确: ${payload.url}`);
  }
});

test("jsdom 模拟 ?text= 参数自动触发探索", async () => {
  const html = readFileSync(join(rootDir, "dist/demo.html"), "utf-8");
  const fetchMockScript = `<script>window.__testFetchMock={calls:[],payloads:[]};window.fetch=async(u,o)=>{window.__testFetchMock.calls.push(u);window.__testFetchMock.payloads.push(o?.body?JSON.parse(o.body):null);return{ok:false,json:async()=>({ok:false,message:"mock"})};};</script>`;
  const modifiedHtml = html.replace("<head>", "<head>" + fetchMockScript);

  const dom = new JSDOM(modifiedHtml, {
    url: "http://localhost:5173/?text=这是一段测试文本",
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
  });

  await new Promise((resolve) => setTimeout(resolve, 1200));

  const mock = dom.window.__testFetchMock;
  if (!mock || mock.calls.length === 0) {
    throw new Error("fetch 未被调用，text 参数未触发 startAdventure");
  }
  const payload = mock.payloads[0];
  if (!payload?.text) {
    throw new Error("fetch payload 未包含 text 字段");
  }
  if (!payload.text.includes("这是一段测试文本")) {
    throw new Error(`fetch payload text 不正确: ${payload.text}`);
  }
});

console.log("开始端到端测试...\n");
runTests();
