import { adventure, sampleUrl } from "./mockData.js";

const app = document.querySelector("#app");
const libraryKey = "feishu-library";
const aiConfigStorageKey = "feishu-ai-node-config";
const logoSrc = window.FEISHU_LOGO_SRC || "assets/feishu-logo.png";
let loadingTimer = null;
let thinkingModalEl = null;
let quoteTimer = null;
let thinkingQuoteIndex = 0;

const featuredStarts = [
  {
    title: "为什么古典音乐听起来比流行音乐更高级？",
    url: "https://www.zhihu.com/question/20337986",
    tag: "音乐",
    excerpt: "从审美标准、历史语境到个人经验，重新审视「高级」这个概念本身。",
  },
  {
    title: "如何突破自己的认知茧房？",
    url: "https://www.zhihu.com/question/316418287",
    tag: "认知",
    excerpt: "信息闭环是如何形成的，又有哪些方法可以让你看到更大的世界。",
  },
  {
    title: "人工智能会取代人类的工作吗？",
    url: "https://www.zhihu.com/question/275171402",
    tag: "AI",
    excerpt: "技术替代与能力迁移，从历次技术革命看工作形态的演变。",
  },
  {
    title: "为什么人会陷入抑郁？",
    url: "https://www.zhihu.com/question/20127628",
    tag: "心理学",
    excerpt: "从神经科学、社会环境到个人叙事，理解情绪背后的多层机制。",
  },
  {
    title: "什么是好的公共讨论？",
    url: "https://www.zhihu.com/question/22529930",
    tag: "社会",
    excerpt: "事实、观点与情绪在公共议题中如何共存与博弈。",
  },
  {
    title: "如何培养深度工作的能力？",
    url: "https://www.zhihu.com/question/28420609",
    tag: "成长",
    excerpt: "注意力经济的对立面，重新夺回对时间和心智的控制权。",
  },
];

const state = {
  view: "landing",
  currentIndex: 0,
  route: [adventure.steps[0]],
  selectedDirection: null,
  selectedCandidate: null,
  candidates: [],
  interestProfile: {},
  loading: "",
  loadingStartedAt: null,
  error: "",
  useDemo: false,
  inputUrl: sampleUrl,
  articleText: "",
  finished: false,
  activeBook: null,
  hotList: featuredStarts,
  hotListLoading: false,
  hotListError: "",
  hotListLoaded: false,
};

const authorProfiles = [
  { name: "知乎用户", role: "起点作者", avatar: "知" },
  { name: "知乎心理学作者", role: "心理学", avatar: "心" },
  { name: "知乎音乐答主", role: "音乐", avatar: "乐" },
  { name: "知乎社会学作者", role: "社会学", avatar: "社" },
  { name: "知乎创作者", role: "创作者", avatar: "创" },
  { name: "知乎音乐评论者", role: "评论", avatar: "评" },
  { name: "知乎医学科普作者", role: "科普", avatar: "医" },
  { name: "知乎音乐爱好者", role: "经验", avatar: "听" },
];

const sampleBooks = [
  {
    id: "sample_music",
    title: adventure.title,
    subtitle: "从情绪、记忆到认知茧房的一本主动阅读非书",
    style: adventure.style,
    tags: ["心理学", "音乐", "情绪"],
    steps: adventure.steps,
    createdAt: "示例非书",
    preface:
      "这是你从一个知乎问题出发读出的非书。它记录了你如何从音乐、情绪、记忆一路读到认知茧房。",
    cover: "music",
    authorCount: 8,
  },
  {
    id: "sample_cocoon",
    title: "走出认知茧房",
    subtitle: "打破信息闭环，看到更大的世界。",
    style: "观点挑战",
    tags: ["认知科学", "思维", "成长"],
    steps: adventure.steps,
    createdAt: "示例非书",
    preface: "这本非书从熟悉观点出发，沿着反例、争议和跨领域解释，帮你看见问题的另一面。",
    cover: "cocoon",
    authorCount: 7,
  },
  {
    id: "sample_public",
    title: "公共议题的十种看法",
    subtitle: "同一件事，不同视角，不同答案。",
    style: "公共讨论",
    tags: ["社会议题", "观点", "讨论"],
    steps: adventure.steps,
    createdAt: "示例非书",
    preface: "这本非书把公共议题拆成多个阅读角度，让你在不同作者的表达之间建立判断。",
    cover: "public",
    authorCount: 9,
  },
  {
    id: "sample_writer",
    title: "写作者的选题灵感书",
    subtitle: "从生活细节找到打动人心的选题。",
    style: "创作方法",
    tags: ["写作", "方法", "灵感"],
    steps: adventure.steps,
    createdAt: "示例非书",
    preface: "这本非书把一次好奇变成选题线索，帮助创作者从问题、案例和评论里找到表达入口。",
    cover: "writer",
    authorCount: 6,
  },
  {
    id: "sample_hot",
    title: "从热榜读懂社会讨论",
    subtitle: "热点背后，隐藏着哪些集体情绪。",
    style: "热榜观察",
    tags: ["热榜", "社会", "数据"],
    steps: adventure.steps,
    createdAt: "示例非书",
    preface: "这本非书从热榜问题出发，追踪观点如何扩散、转向和沉淀成公共讨论。",
    cover: "hot",
    authorCount: 8,
  },
  {
    id: "sample_classic",
    title: "古典音乐真的更高级吗",
    subtitle: "审美、历史与文化的多元视角。",
    style: "审美辨析",
    tags: ["音乐", "审美", "文化"],
    steps: adventure.steps,
    createdAt: "示例非书",
    preface: "这本非书从一个常见判断出发，把音乐品味放回历史、社会和个人经验中重新理解。",
    cover: "classic",
    authorCount: 7,
  },
];

const thinkingQuotes = {
  start: ["正在从字里行间提取知识的种子…", "你的文章很有趣，AI 已经读了两遍了…", "正在为你的阅读之旅绘制第一张地图…", "正在品味文字之间的隐藏线索…"],
  directions: ["正在对比不同观点的交汇点…", "你的兴趣画像正在实时更新…", "正在寻找那些能打开新视野的角度…", "正在思考：如果换一位作者，会怎么写？"],
  candidates: ["正在知乎的海量内容中打捞最闪亮的珍珠…", "AI 正在和优质内容双向奔赴…", "已经排除了 97% 的无关内容…", "正在对比三篇不同风格的文章，看谁最适合你…"],
  choose: ["正在把零散的知识点编织成连续的思考…", "知识桥正在浇筑中，请稍候…", "正在预测你读完这一章后会想到什么新问题…", "正在搭建从上一章到下一章的思维阶梯…"],
  book: ["正在为你的非书挑选最合适的封面风格…", "序言正在由 AI 作家亲笔撰写…", "每一本非书都是独一无二的，你的也是…", "正在把章节按照阅读线索重新排序…"],
  cover: ["正在把阅读的主题翻译成视觉语言…", "配色方案正在调色盘上旋转…", "一本好书的封面，是它第一次对你说话…", "正在构思一个能代表你阅读品味的画面…"],
};

function uniqueAuthors(steps) {
  return [...new Set(steps.map((step) => step.author))];
}

function authorCount(book) {
  return book.authorCount || uniqueAuthors(book.steps).length;
}

function conceptCount(book) {
  return new Set(book.steps.flatMap((step) => step.concepts || [])).size;
}

async function apiPost(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      aiConfig: readAiConfig(),
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || "网络有点问题，请稍后再试。已读过的章节不会丢失。");
  }
  return data;
}

function readAiConfig() {
  try {
    return JSON.parse(localStorage.getItem(aiConfigStorageKey) || "{}");
  } catch {
    return {};
  }
}

async function fetchHotList(refresh = false) {
  if (state.hotListLoading) return;
  state.hotListLoading = true;
  state.hotListError = "";
  render();

  try {
    const url = refresh ? "/api/hotlist?refresh=1" : "/api/hotlist";
    const response = await fetch(url);
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || "获取热榜失败。");
    }
    state.hotList = (data.items || []).length ? data.items : state.hotList;
    state.hotListLoading = false;
  } catch (error) {
    state.hotListError = error.message || "获取热榜失败。";
    state.hotListLoading = false;
  }
  render();
}

function getThinkingPhase(message) {
  if (!message) return "start";
  if (message.includes("读你的第一篇文章") || message.includes("解析")) return "start";
  if (message.includes("方向")) return "directions";
  if (message.includes("找") && message.includes("文章")) return "candidates";
  if (message.includes("导读") || message.includes("知识桥") || message.includes("下一章")) return "choose";
  if (message.includes("装订")) return "book";
  if (message.includes("封面")) return "cover";
  return "start";
}

function pickQuote(phase, index = 0) {
  const list = thinkingQuotes[phase] || thinkingQuotes.start;
  return list[index % list.length];
}

function showThinkingModal(message) {
  if (thinkingModalEl) return;
  const phase = getThinkingPhase(message);
  thinkingQuoteIndex = 0;
  const quote = pickQuote(phase, 0);

  const backdrop = document.createElement("div");
  backdrop.className = "thinking-modal-backdrop";
  backdrop.innerHTML = `
    <div class="thinking-modal" role="dialog" aria-modal="true" aria-live="polite">
      <div class="thinking-spinner">
        <div class="thinking-ring"></div>
        <div class="thinking-dots"><span></span><span></span><span></span></div>
      </div>
      <div class="thinking-title">AI 正在思考</div>
      <div class="thinking-quote-wrap">
        <div class="thinking-quote" id="thinking-quote">${quote}</div>
      </div>
      <div class="thinking-timer" id="thinking-timer">已用时 0 秒</div>
    </div>
  `;
  document.body.appendChild(backdrop);
  thinkingModalEl = backdrop;
  startQuoteRotation(phase);
}

function hideThinkingModal() {
  stopQuoteRotation();
  if (thinkingModalEl) {
    thinkingModalEl.remove();
    thinkingModalEl = null;
  }
}

function updateThinkingTimer(seconds) {
  const el = document.getElementById("thinking-timer");
  if (el) el.textContent = `已用时 ${seconds} 秒`;
}

function startQuoteRotation(phase) {
  if (quoteTimer) clearInterval(quoteTimer);
  quoteTimer = setInterval(() => {
    thinkingQuoteIndex++;
    const quote = pickQuote(phase, thinkingQuoteIndex);
    const el = document.getElementById("thinking-quote");
    if (el) {
      el.style.opacity = "0";
      setTimeout(() => {
        el.textContent = quote;
        el.style.opacity = "1";
      }, 300);
    }
  }, 5000);
}

function stopQuoteRotation() {
  if (quoteTimer) clearInterval(quoteTimer);
  quoteTimer = null;
}

function setBusy(message) {
  if (loadingTimer) clearInterval(loadingTimer);
  state.loading = message;
  state.loadingStartedAt = Date.now();
  state.error = "";
  showThinkingModal(message);
  render();
  loadingTimer = setInterval(() => {
    if (!state.loading) { clearInterval(loadingTimer); loadingTimer = null; return; }
    const seconds = state.loadingStartedAt ? Math.round((Date.now() - state.loadingStartedAt) / 1000) : 0;
    updateThinkingTimer(seconds);
  }, 1000);
}

function setError(error) {
  if (loadingTimer) clearInterval(loadingTimer);
  loadingTimer = null;
  state.loading = "";
  state.loadingStartedAt = null;
  state.error = error.message || "网络有点问题，请稍后再试。已读过的章节不会丢失。";
  hideThinkingModal();
  render();
}

function clearBusy() {
  if (loadingTimer) clearInterval(loadingTimer);
  loadingTimer = null;
  state.loading = "";
  state.loadingStartedAt = null;
  hideThinkingModal();
}

function isBusy() {
  return Boolean(state.loading || state.hotListLoading);
}

function loadingText() {
  if (!state.loading) return "";
  const seconds = state.loadingStartedAt ? Math.max(1, Math.round((Date.now() - state.loadingStartedAt) / 1000)) : 0;
  const suffix = seconds >= 8 ? ` 已等待 ${seconds} 秒，还在努力中...` : "";
  return `${state.loading}${suffix}`;
}

function firstStepFromStart(data) {
  return {
    title: data.title,
    author: data.author || data.source || "用户起点",
    url: data.url || "#",
    summary: data.understanding?.summary || data.contentExcerpt || "",
    concepts: data.understanding?.concepts?.length ? data.understanding.concepts : ["起点文章"],
    bridge: data.curatorMessage || "这是这本非书的起点。",
    directions: [],
    sourceType: data.basedOnUserText ? "user_text" : "external",
    curatorNote: data.curatorMessage || "",
    needsUserText: Boolean(data.needsUserText),
    parseWarning: data.parseWarning || "",
  };
}

async function refreshDirections(step = state.route[state.route.length - 1]) {
  const data = await apiPost("/api/directions", {
    currentStep: step,
    route: state.route,
    interestProfile: state.interestProfile,
  });
  step.directions = data.directions;
  state.interestProfile = data.interestProfile || state.interestProfile;
  clearBusy();
  state.error = "";
  render();
}

function coverMarkup(book, size = "card") {
  const cover = book.cover || "music";
  return `
    <div class="mini-cover cover-${cover} ${size === "large" ? "large" : ""}" aria-hidden="true">
      <div class="cover-brand">非书</div>
      <div class="cover-title">${book.title.replace("从音乐心理学出发的", "音乐心理学")}</div>
      <div class="cover-art">
        <span></span><span></span><span></span><span></span>
      </div>
      <div class="cover-lines"></div>
    </div>
  `;
}

function avatarGroup(count = 5) {
  return `
    <div class="avatar-group" aria-label="贡献作者">
      ${authorProfiles
        .slice(0, Math.min(count, 5))
        .map((author, index) => `<span style="--i:${index}">${author.avatar}</span>`)
        .join("")}
      ${count > 5 ? `<em>+${count - 5}</em>` : ""}
    </div>
  `;
}

function bookCard(book) {
  return `
    <article class="shelf-card" data-book="${book.id}">
      ${coverMarkup(book)}
      <div class="shelf-copy">
        <div class="card-kicker">${book.createdAt || "已保存"}</div>
        <h3>${book.title}</h3>
        <p>${book.subtitle}</p>
        <div class="tag-row compact">${book.tags.slice(0, 3).map((tag) => `<span>${tag}</span>`).join("")}</div>
        ${avatarGroup(authorCount(book))}
        <div class="book-card-footer">
          <span>${book.steps.length} 章</span>
          <span>${authorCount(book)} 位作者</span>
        </div>
      </div>
    </article>
  `;
}

function parseZhihuUrl(input) {
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();
    const path = url.pathname;

    if (host === "zhuanlan.zhihu.com" && /^\/p\/[^/]+/.test(path)) return "知乎文章";
    if ((host === "www.zhihu.com" || host === "zhihu.com") && /^\/question\/[^/]+\/answer\/[^/]+/.test(path)) return "知乎回答";
    if ((host === "www.zhihu.com" || host === "zhihu.com") && /^\/question\/[^/]+/.test(path)) return "知乎问题";
    if ((host === "www.zhihu.com" || host === "zhihu.com") && /^\/market\/paid_column\/[^/]+\/section\/[^/]+/.test(path)) return "知乎知识内容";
  } catch {
    return null;
  }
  return null;
}

function detectStartInput(input, text) {
  const trimmedInput = input.trim();
  const trimmedText = text.trim();
  const zhihuType = parseZhihuUrl(trimmedInput);

  if (zhihuType) return { ok: true, label: zhihuType, mode: "zhihu" };

  if (trimmedInput) {
    try {
      const url = new URL(trimmedInput);
      return { ok: true, label: `${url.hostname.replace(/^www\./, "")} 文章链接`, mode: "external" };
    } catch {
      if (trimmedText.length >= 20) return { ok: true, label: "粘贴文本片段", mode: "text" };
      return { ok: false, label: "链接暂时无法解析，可以粘贴标题、摘要或正文片段。" };
    }
  }

  if (trimmedText.length >= 20) return { ok: true, label: "粘贴文本片段", mode: "text" };
  return { ok: false, label: "可以输入任意文章链接，或直接粘贴一段文章内容。" };
}

function readLibrary() {
  try {
    return JSON.parse(localStorage.getItem(libraryKey) || "[]");
  } catch {
    return [];
  }
}

function writeLibrary(books) {
  localStorage.setItem(libraryKey, JSON.stringify(books));
}

function makeBook() {
  const chapterCount = state.route.length;
  const allConcepts = state.route.flatMap((s) => s.concepts || []);
  const uniqueConcepts = [...new Set(allConcepts)].slice(0, 6);

  return {
    id: `book_${Date.now()}`,
    title: chapterCount < adventure.steps.length ? "我读出的一本短非书" : adventure.title,
    subtitle: chapterCount < adventure.steps.length ? `从一个兴趣起点出发，收入 ${chapterCount} 章策展阅读。` : adventure.subtitle,
    style: adventure.style,
    tags: uniqueConcepts.length > 0 ? uniqueConcepts : adventure.tags,
    steps: state.route,
    createdAt: new Date().toLocaleString("zh-CN"),
    preface:
      "这本非书从用户给出的一篇文章或一段文本出发，由 AI 知识策展人持续提炼兴趣、连接知乎与全网内容，并把每一次选择沉淀成章节导读、知识桥和原文入口。",
    coverConcept: "主视觉围绕「从一页文章长出一条阅读路径」，使用清亮蓝色、暖黄色节点和纸页纹理，表达主动探索与温和陪伴。",
  };
}

function saveCurrentBook() {
  const book = makeBook();
  const existing = readLibrary();
  writeLibrary([book, ...existing.filter((item) => item.title !== book.title)].slice(0, 12));
  return book;
}

function sampleBook() {
  return {
    id: "sample",
    title: adventure.title,
    subtitle: adventure.subtitle,
    style: adventure.style,
    tags: adventure.tags,
    steps: adventure.steps,
    createdAt: "示例非书",
    preface:
      "这是一本示例非书，用来展示用户如何把一组阅读过程沉淀成可保存、可分享的知识读本。",
  };
}

function update(partial) {
  const previousView = state.view;
  Object.assign(state, partial);
  if (partial.loading === "") {
    if (loadingTimer) clearInterval(loadingTimer);
    loadingTimer = null;
    state.loadingStartedAt = null;
    hideThinkingModal();
  }
  render();
  if ((partial.view && partial.view !== previousView) || Object.prototype.hasOwnProperty.call(partial, "currentIndex")) {
    window.scrollTo({ top: 0, left: 0 });
  }
}

function navigate(view) {
  if (isBusy()) return;
  update({ view, selectedDirection: null, selectedCandidate: null, activeBook: null });
}

async function startAdventure(event, hotItem = null) {
  event?.preventDefault();
  const detection = detectStartInput(state.inputUrl, state.articleText);
  if (!detection.ok) {
    update({ selectedDirection: detection.label });
    return;
  }
  try {
    setBusy("正在读你的第一篇文章...");
    const payload = {
      url: state.inputUrl,
      text: state.articleText,
    };
    if (hotItem) {
      payload.hotItem = {
        title: hotItem.title,
        excerpt: hotItem.excerpt,
        tag: hotItem.tag,
      };
    }
    const data = await apiPost("/api/start", payload);
    const step = firstStepFromStart(data);
    step.directions = data.directions || [];
    Object.assign(state, {
      view: "adventure",
      currentIndex: 0,
      route: [step],
      selectedDirection: null,
      selectedCandidate: null,
      candidates: [],
      interestProfile: data.interestProfile || {},
      finished: false,
      activeBook: null,
      useDemo: false,
      loading: "",
      loadingStartedAt: null,
      error: "",
    });
    render();
  } catch (error) {
    setError(error);
  }
}

function startDemoAdventure() {
  if (isBusy()) return;
  update({
    view: "adventure",
    currentIndex: 0,
    route: [adventure.steps[0]],
    selectedDirection: null,
    selectedCandidate: null,
    candidates: [],
    interestProfile: {},
    finished: false,
    activeBook: null,
    useDemo: true,
    loading: "",
    loadingStartedAt: null,
    error: "",
  });
}

async function chooseDirection(direction) {
  if (isBusy()) return;
  if (state.useDemo) {
    const nextStep = adventure.steps[state.currentIndex + 1];
    const candidates = candidateOptions(nextStep);
    update({ selectedDirection: direction, selectedCandidate: candidates[0] || null, candidates });
    return;
  }

  try {
    setBusy("正在找适合下一章的文章...");
    const data = await apiPost("/api/candidates", {
      currentStep: state.route[state.currentIndex],
      direction,
      route: state.route,
      interestProfile: state.interestProfile,
    });
    update({
      candidates: data.candidates,
      selectedCandidate: data.candidates?.[0] || null,
      loading: "",
      loadingStartedAt: null,
      error: "",
    });
  } catch (error) {
    setError(error);
  }
}

function chooseCandidate(candidate) {
  if (isBusy()) return;
  update({ selectedCandidate: candidate });
}

function closeCandidateModal() {
  if (isBusy()) return;
  update({ candidates: [], selectedCandidate: null, selectedDirection: null });
}

async function goNext() {
  if (isBusy()) return;
  if (state.useDemo) {
    const nextIndex = Math.min(state.currentIndex + 1, adventure.steps.length - 1);
    update({
      currentIndex: nextIndex,
      route: adventure.steps.slice(0, nextIndex + 1),
      selectedDirection: null,
      selectedCandidate: null,
      candidates: [],
      finished: nextIndex === adventure.steps.length - 1,
    });
    return;
  }

  if (!state.selectedCandidate) return;

  try {
    const selectedCandidate = state.selectedCandidate;
    setBusy("正在写下一章的导读，并想想再往后可以怎么走...");
    const data = await apiPost("/api/choose", {
      previousStep: state.route[state.currentIndex],
      candidate: selectedCandidate,
      route: state.route,
      interestProfile: state.interestProfile,
    });
    const nextRoute = [...state.route, data.step];
    const nextIndex = nextRoute.length - 1;

    if (data.directions?.length) {
      nextRoute[nextIndex].directions = data.directions;
    }

    clearBusy();
    Object.assign(state, {
      currentIndex: nextIndex,
      route: nextRoute,
      selectedDirection: null,
      selectedCandidate: null,
      candidates: [],
      interestProfile: data.interestProfile || state.interestProfile,
      finished: nextRoute.length >= 10,
      loading: "",
      loadingStartedAt: null,
      error: "",
    });
    render();
    window.scrollTo({ top: 0, left: 0 });

    if (!state.finished && !data.directions?.length) {
      setBusy("正在想下一章可以往哪里走...");
      await refreshDirections(data.step);
    }
  } catch (error) {
    setError(error);
  }
}

function goNextMockPreview() {
  const nextIndex = Math.min(state.currentIndex + 1, adventure.steps.length - 1);
  update({
    currentIndex: nextIndex,
    route: adventure.steps.slice(0, nextIndex + 1),
    selectedDirection: null,
    selectedCandidate: null,
    finished: nextIndex === adventure.steps.length - 1,
  });
}

function restart() {
  if (isBusy()) return;
  update({
    view: "start",
    currentIndex: 0,
    route: [adventure.steps[0]],
    selectedDirection: null,
    selectedCandidate: null,
    candidates: [],
    interestProfile: {},
    inputUrl: sampleUrl,
    articleText: "",
    useDemo: false,
    loading: "",
    loadingStartedAt: null,
    error: "",
    finished: false,
    activeBook: null,
  });
}

async function finishBook() {
  if (isBusy()) return;
  if (state.useDemo) {
    const book = saveCurrentBook();
    update({ view: "book", activeBook: book, finished: "book" });
    return;
  }

  try {
    setBusy("正在把你的阅读路线装订成书...");
    const localBook = makeBook();

    const existing = readLibrary();
    writeLibrary([localBook, ...existing.filter((item) => item.id !== localBook.id)].slice(0, 12));
    update({ view: "book", activeBook: localBook, finished: "book", loading: "", loadingStartedAt: null, error: "" });

    Promise.allSettled([
      apiPost("/api/book", {
        route: state.route,
        interestProfile: state.interestProfile,
      }),
      apiPost("/api/cover", { book: localBook }),
    ]).then(([bookResult, coverResult]) => {
      let book = { ...localBook };
      if (bookResult.status === "fulfilled") {
        const b = bookResult.value.book || {};
        book = {
          ...book,
          title: b.title || book.title,
          subtitle: b.subtitle || book.subtitle,
          preface: b.preface || book.preface,
          tags: Array.isArray(b.tags) ? b.tags : book.tags,
          style: b.style || book.style,
          explorationSummary: b.explorationSummary || book.explorationSummary,
          sourceAuthors: Array.isArray(b.sourceAuthors) ? b.sourceAuthors : book.sourceAuthors,
          steps: state.route,
        };
      } else {
        console.error("Book API failed:", bookResult.reason);
      }

      if (coverResult.status === "fulfilled" && coverResult.value.coverConcept) {
        const cd = coverResult.value.coverConcept;
        book.coverConcept = cd.composition || cd.imagePrompt || "";
        book.coverData = cd;
        book.cover = cd.cssTheme || "music";
      } else if (coverResult.status === "rejected") {
        console.error("Cover API failed:", coverResult.reason);
      }

      const lib = readLibrary();
      writeLibrary([book, ...lib.filter((item) => item.id !== book.id)].slice(0, 12));

      if (state.activeBook?.id === localBook.id) {
        update({ activeBook: book });
      }
    });
  } catch (error) {
    setError(error);
  }
}

function nav(active) {
  return `
    <nav class="topbar">
      <button class="brand-button" data-view="landing" aria-label="非书首页"><img class="brand-logo" src="${logoSrc}" alt="非书" /><span>读出自己的书。</span></button>
      <div class="nav-links">
        <button class="${active === "landing" ? "active" : ""}" data-view="landing">首页</button>
        <button class="${active === "start" ? "active" : ""}" data-view="start">开始探索</button>
        <button class="${active === "library" ? "active" : ""}" data-view="library">我的非书</button>
      </div>
      <button class="nav-cta" data-view="start">开始第一本非书</button>
    </nav>
  `;
}

function bindNav() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      if (isBusy()) return;
      navigate(button.dataset.view);
    });
  });
}

function renderLanding() {
  const featured = sampleBooks[0];
  app.innerHTML = `
    <section class="screen landing-screen">
      ${nav("landing")}
      <div class="landing-hero hero-shell">
        <div class="hero-copy">
          <p class="eyebrow">从一篇文章，读出自己的书</p>
          <h1>读出自己的书。</h1>
          <p class="lead">粘贴一篇文章或链接，AI 帮你选出下一章。读满三章，就是一本属于你自己的非书。</p>
          <div class="hero-actions">
            <button id="hero-start">开始第一本非书</button>
            <button class="ghost-button" id="hero-library">看看示例</button>
          </div>
          <div class="hero-meta">
            <span>任意链接开始</span>
            <span>每章由你选方向</span>
            <span>三章即可成书</span>
            <span>随时保存分享</span>
          </div>
        </div>
        <aside class="hero-book-preview">
          ${coverMarkup(featured, "large")}
          <div class="stat-stack">
            <span><strong>3+</strong> 章即可成书</span>
            <span><strong>${authorCount(featured)}</strong> 位作者</span>
            <span><strong>${conceptCount(featured)}</strong> 个概念</span>
            <span>可分享</span>
          </div>
        </aside>
      </div>

      <section class="section-block how-to-start">
        <style>
          .how-to-start { background: #f8fafc; border-radius: 1rem; padding: 2.5rem 2rem; }
          .start-methods-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-top: 1.5rem; }
          .start-method-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.875rem; padding: 1.5rem; text-align: left; transition: all 0.2s; display: flex; flex-direction: column; }
          .start-method-card:hover { border-color: #2563eb; box-shadow: 0 4px 16px rgba(37,99,235,0.08); transform: translateY(-2px); }
          .method-icon { font-size: 1.75rem; margin-bottom: 0.75rem; line-height: 1; }
          .start-method-card strong { display: block; font-size: 1.0625rem; color: #0f172a; margin-bottom: 0.375rem; }
          .start-method-card p { font-size: 0.875rem; color: #64748b; line-height: 1.6; margin: 0 0 1rem; flex: 1; }
          .start-method-card .method-action { margin-top: auto; }
          .start-method-card button { width: 100%; }
          .bookmarklet-mini { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
          .bookmarklet-mini .bookmarklet-link { display: inline-block; padding: 0.5rem 1rem; background: #2563eb; color: #fff; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem; text-decoration: none; cursor: move; box-shadow: 0 2px 6px rgba(37,99,235,0.2); transition: transform 0.15s; }
          .bookmarklet-mini .bookmarklet-link:hover { transform: translateY(-1px); }
          .bookmarklet-mini .bookmarklet-hint { color: #94a3b8; font-size: 0.75rem; }
          @media (max-width: 768px) { .start-methods-grid { grid-template-columns: 1fr; } }
        </style>
        <div class="section-heading">
          <p class="eyebrow">随时开始</p>
          <h2>三种方式开始</h2>
        </div>
        <div class="start-methods-grid">
          <article class="start-method-card">
            <div class="method-icon">📝</div>
            <strong>粘贴链接或文本</strong>
            <p>输入任意文章链接，或直接粘贴标题、摘要和正文片段。支持知乎文章、回答、问题和任意网页。</p>
            <div class="method-action">
              <button class="ghost-button" data-view="start">去起点页 →</button>
            </div>
          </article>
          <article class="start-method-card">
            <div class="method-icon">🎯</div>
            <strong>点击精选起点</strong>
            <p>从 6 个高质量知乎问题中一键启动。零输入、零等待，立即开始探索。</p>
            <div class="method-action">
              <button class="ghost-button" data-view="start">去起点页 →</button>
            </div>
          </article>
          <article class="start-method-card">
            <div class="method-icon">🔗</div>
            <strong>Bookmarklet 书签</strong>
            <p>拖拽链接到浏览器书签栏。浏览任意网页时，一键跳转并自动带入当前页面链接。</p>
            <div class="method-action">
              <div class="bookmarklet-mini">
                <a class="bookmarklet-link" id="bookmarklet-link" href="#">🔗 生成非书</a>
                <span class="bookmarklet-hint">← 拖拽到书签栏</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="section-block landing-flow">
        <style>
          .flow-steps { display: flex; align-items: flex-start; gap: 0; margin-top: 1.5rem; }
          .flow-step { flex: 1; text-align: center; position: relative; padding: 0 0.5rem; }
          .step-number { width: 2.5rem; height: 2.5rem; border-radius: 50%; background: #eff6ff; color: #2563eb; font-weight: 700; font-size: 1rem; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 0.75rem; position: relative; z-index: 1; }
          .flow-step strong { display: block; font-size: 1rem; color: #0f172a; margin-bottom: 0.375rem; }
          .flow-step p { font-size: 0.875rem; color: #64748b; line-height: 1.6; margin: 0; }
          .step-line { position: absolute; top: 1.25rem; left: calc(50% + 1.5rem); right: calc(-50% + 1.5rem); height: 2px; background: #e2e8f0; z-index: 0; }
          .flow-step:last-child .step-line { display: none; }
          @media (max-width: 640px) {
            .flow-steps { flex-direction: column; gap: 1.5rem; }
            .step-line { display: none; }
            .flow-step { text-align: left; display: flex; gap: 1rem; align-items: flex-start; padding: 0; }
            .step-number { flex-shrink: 0; margin-bottom: 0; }
          }
        </style>
        <div class="section-heading">
          <p class="eyebrow">探索流程</p>
          <h2>从一次好奇，到一本可分享的非书</h2>
        </div>
        <div class="flow-steps">
          <div class="flow-step">
            <div class="step-line"></div>
            <div class="step-number">1</div>
            <div>
              <strong>放进第一篇文章</strong>
              <p>粘贴链接或正文，这就是你非书的第 1 章。</p>
            </div>
          </div>
          <div class="flow-step">
            <div class="step-line"></div>
            <div class="step-number">2</div>
            <div>
              <strong>选择下一章方向</strong>
              <p>深入、换个角度、或是意外发现——下一章往哪里走，你决定。</p>
            </div>
          </div>
          <div class="flow-step">
            <div class="step-line"></div>
            <div class="step-number">3</div>
            <div>
              <strong>挑选下一章</strong>
              <p>从三篇文章里选一章加入你的非书，看看它如何接上前文。</p>
            </div>
          </div>
          <div class="flow-step">
            <div class="step-number">4</div>
            <div>
              <strong>装订成书</strong>
              <p>满三章就可以生成封面、目录和序言，保存属于你的非书。</p>
            </div>
          </div>
        </div>
      </section>

      <section class="section-block">
        <div class="section-heading">
          <p class="eyebrow">非书能做什么</p>
          <h2>你值得用更主动的方式，读懂这个世界。</h2>
        </div>
        <div class="feature-grid" aria-label="核心玩法">
          <article><span class="feature-icon">01</span><strong>从一个问题出发</strong><p>先理解你给出的文章，再提炼可继续探索的概念、争议和案例。</p></article>
          <article><span class="feature-icon">02</span><strong>下一章，你来选</strong><p>AI 给出方向和推荐，你用选择把章节编成自己的样子。</p></article>
          <article><span class="feature-icon">03</span><strong>读过的路，变成一本书</strong><p>写到 3 章即可装订，也可以继续加入新的章节。</p></article>
        </div>
      </section>

      <section class="section-block sample-shelf">
        <div class="section-heading row">
          <div>
            <p class="eyebrow">示例非书</p>
            <h2>看看别人读出了什么</h2>
          </div>
          <button class="ghost-button" id="sample-library">去书架看看</button>
        </div>
        <div class="shelf-grid">
          ${sampleBooks.slice(0, 3).map(bookCard).join("")}
        </div>
      </section>
    </section>
  `;
  bindNav();
  document.querySelector("#hero-start").addEventListener("click", () => {
    if (isBusy()) return;
    navigate("start");
  });
  document.querySelector("#hero-library").addEventListener("click", () => {
    if (isBusy()) return;
    navigate("library");
  });
  document.querySelector("#sample-library").addEventListener("click", () => {
    if (isBusy()) return;
    navigate("library");
  });
  const bookmarkletLink = document.querySelector("#bookmarklet-link");
  if (bookmarkletLink) {
    const origin = window.location.origin;
    bookmarkletLink.href = `javascript:(function(){window.open('${origin}/?url='+encodeURIComponent(location.href),'_blank');})();`;
  }
}

function renderStart() {
  const detected = detectStartInput(state.inputUrl, state.articleText);

  if (!state.hotListLoaded) {
    state.hotListLoaded = true;
    fetchHotList();
  }

  app.innerHTML = `
    <section class="screen start-screen">
      ${nav("start")}
      <div class="start-layout">
        <div class="hero compact-hero">
          <p class="eyebrow">开始读一本新的非书</p>
          <h1>从任意一篇文章开始。</h1>
          <p class="lead">粘贴链接或正文，AI 会读完起点，然后为你推荐下一章的方向。</p>
        </div>
        <form class="start-panel" id="start-form">
          <label for="url-input">文章链接</label>
          <div class="input-row">
            <input id="url-input" type="url" value="${state.inputUrl}" placeholder="https://www.zhihu.com/question/... 或任意文章链接" />
            <button type="submit">开始读非书</button>
          </div>
          <div class="paste-block">
            <label for="article-input">或者，直接粘贴正文</label>
            <textarea id="article-input" rows="5" placeholder="粘贴标题、摘要或正文片段，也可以只放你最有感觉的一段。">${state.articleText}</textarea>
          </div>
          <p class="${detected.ok ? "hint good" : "hint"}">${detected.ok ? `已识别：${detected.label}` : state.selectedDirection || detected.label}</p>
          ${state.error ? `<p class="error-message">${state.error}</p>` : ""}
          <div class="start-ai-notes">
            <span>AI 帮你提炼主题</span>
            <span>推荐知乎优质内容</span>
            <span>三章即可成书</span>
          </div>
          <button class="ghost-button demo-route-button" type="button" id="demo-route-button">先看一段示例旅程</button>

          <div class="featured-starts">
            <style>
              .featured-starts { margin-top: 2.5rem; }
              .featured-starts-header { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 1rem; }
              .featured-starts-heading { font-size: 0.875rem; color: #64748b; margin: 0; }
              .refresh-hotlist { font-size: 0.75rem; padding: 0.25rem 0.625rem; background: #f1f5f9; color: #475569; border: none; border-radius: 0.375rem; cursor: pointer; transition: all 0.2s; }
              .refresh-hotlist:hover { background: #e2e8f0; color: #2563eb; }
              .refresh-hotlist:disabled { opacity: 0.5; cursor: not-allowed; }
              .featured-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
              .featured-card { padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; background: #fff; cursor: pointer; transition: all 0.2s; text-align: left; }
              .featured-card:hover { border-color: #2563eb; box-shadow: 0 4px 12px rgba(37,99,235,0.08); transform: translateY(-2px); }
              .featured-card .tag { display: inline-block; font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #eff6ff; color: #2563eb; border-radius: 999px; margin-bottom: 0.5rem; font-weight: 500; }
              .featured-card h4 { font-size: 0.9375rem; margin: 0 0 0.375rem; color: #0f172a; line-height: 1.4; }
              .featured-card p { font-size: 0.8125rem; color: #64748b; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
              .hotlist-error { text-align: center; color: #ef4444; font-size: 0.875rem; padding: 0.5rem 0; }
              @media (max-width: 768px) { .featured-grid { grid-template-columns: repeat(2, 1fr); } }
              @media (max-width: 480px) { .featured-grid { grid-template-columns: 1fr; } }
            </style>
            <div class="featured-starts-header">
              <p class="featured-starts-heading">或从知乎热榜开始</p>
              <button class="refresh-hotlist" type="button" id="refresh-hotlist" ${state.hotListLoading ? "disabled" : ""}>
                ${state.hotListLoading ? "刷新中..." : "刷新"}
              </button>
            </div>
            ${state.hotListError ? `<div class="hotlist-error">${state.hotListError}</div>` : ""}
            <div class="featured-grid">
              ${state.hotList.map((item, index) => `
                <button class="featured-card" type="button" data-hot-index="${index}">
                  <span class="tag">${item.tag}</span>
                  <h4>${item.title}</h4>
                  <p>${item.excerpt}</p>
                </button>
              `).join("")}
            </div>
          </div>
        </form>
      </div>
    </section>
  `;

  bindNav();
  document.querySelector("#url-input").addEventListener("input", (event) => {
    state.inputUrl = event.target.value;
    render();
  });
  document.querySelector("#article-input").addEventListener("input", (event) => {
    state.articleText = event.target.value;
  });
  document.querySelector("#start-form").addEventListener("submit", startAdventure);
  document.querySelector("#demo-route-button").addEventListener("click", startDemoAdventure);
  document.querySelector("#refresh-hotlist")?.addEventListener("click", () => fetchHotList(true));
  document.querySelectorAll(".featured-card").forEach((card) => {
    card.addEventListener("click", () => {
      if (isBusy()) return;
      const index = Number(card.dataset.hotIndex);
      const item = state.hotList[index];
      if (item?.url) {
        state.inputUrl = item.url;
        startAdventure(null, item);
      }
    });
  });
}

function candidateOptions(nextStep) {
  if (!nextStep) return [];
  return [
    {
      source: "知乎优先",
      sourceLabel: "知乎文章",
      title: nextStep.title,
      curatedTitle: nextStep.title,
      summary: nextStep.summary,
      connection: "它能接住当前章节留下的问题，把阅读推进到更具体的经验里。",
      readerGain: "读完这一章，你会更清楚这条线索为什么值得继续，也能看到它如何改变后面的阅读方向。",
      fitTags: nextStep.concepts.slice(0, 3),
      trustSignals: ["知乎文章", `作者 ${nextStep.author}`, "相关度高", "可作为下一章"],
    },
    {
      source: "全网背景",
      title: `${nextStep.concepts[0]}的背景补充`,
      curatedTitle: `从${nextStep.concepts[0]}补足上下文`,
      summary: `补充理解"${nextStep.concepts[0]}"相关概念，帮助你在进入下一篇知乎内容前建立上下文。`,
      connection: "它把当前章的核心概念放回更大的背景里，帮助下一章读得更稳。",
      readerGain: "读完这一章，你会先补齐必要背景，再决定是否把非书继续带回知乎内容。",
      fitTags: ["背景补充", nextStep.concepts[0], "理解铺垫"].filter(Boolean),
      trustSignals: ["全网背景", "资料整理", "相关度较高", "可作补充"],
    },
    {
      source: "意外发现",
      title: `从${nextStep.concepts[1] || nextStep.concepts[0]}换一个角度`,
      curatedTitle: `换个角度理解${nextStep.concepts[1] || nextStep.concepts[0]}`,
      summary: "略微跳出当前章节线索，让兴趣不只向熟悉方向收缩。",
      connection: "它不沿着最直的方向走，而是让这本非书保留一点新的发现。",
      readerGain: "读完这一章，你可能会获得一个旁支视角，重新理解前面章节里看似确定的问题。",
      fitTags: ["意外发现", "旁支视角", "重新理解"],
      trustSignals: ["资料补充", "方向匹配", "保留发现"],
    },
  ];
}

function directionTitle(direction) {
  if (!direction) return "";
  return typeof direction === "string" ? direction : direction.label || direction.text || "";
}

function directionText(direction) {
  if (!direction) return "";
  return typeof direction === "string" ? direction : direction.text || direction.label || "";
}

function candidateTitle(candidate) {
  return candidate.curatedTitle || candidate.title || "未命名章节";
}

function candidateSignals(candidate) {
  const signals = candidate.trustSignals?.length
    ? candidate.trustSignals
    : [
        candidate.sourceLabel || candidate.source || "资料来源",
        candidate.author ? `作者 ${candidate.author}` : "",
        candidate.voteUpCount ? `${candidate.voteUpCount} 赞同` : "",
        candidate.commentCount ? `${candidate.commentCount} 评论` : "",
      ].filter(Boolean);
  return signals.slice(0, 6).map((signal) => `<span>${signal}</span>`).join("");
}

function candidateTags(candidate) {
  const tags = candidate.fitTags?.length ? candidate.fitTags : candidate.concepts || [];
  return tags.slice(0, 3).map((tag) => `<span>${tag}</span>`).join("");
}

function renderCandidateModal(candidates, selectedDirectionText) {
  if (!state.selectedDirection || !candidates.length) return "";
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="chapter-modal" role="dialog" aria-modal="true" aria-labelledby="chapter-modal-title">
        <button class="modal-close" id="candidate-modal-close" type="button" aria-label="关闭选择下一章">×</button>
        <header class="chapter-modal-header">
          <div>
            <p class="eyebrow">选择下一章</p>
            <h2 id="chapter-modal-title">选择下一章</h2>
          </div>
          <p>你选了「${selectedDirectionText}」。下面三篇文章都适合作为下一章，但会把你带向不同的阅读重点。</p>
        </header>
        <div class="chapter-choice-list" role="radiogroup" aria-label="选择下一章">
          ${candidates
            .map(
              (candidate, index) => `
                <button class="chapter-choice ${state.selectedCandidate?.title === candidate.title ? "selected" : ""}" type="button" data-candidate="${index}" role="radio" aria-checked="${state.selectedCandidate?.title === candidate.title}">
                  <div class="signal-row">${candidateSignals(candidate)}</div>
                  <strong>${candidateTitle(candidate)}</strong>
                  <p><b>这一章怎么接上前文：</b>${candidate.connection || candidate.bridgePreview || "它能接住当前章节留下的问题，继续推进这本非书的阅读线索。"}</p>
                  <p><b>读完能获得什么：</b>${candidate.readerGain || candidate.summary || "你会获得一个更清楚的理解入口，帮助判断这条线索是否值得继续。"}</p>
                  <div class="choice-footer">
                    <div class="tag-row compact">${candidateTags(candidate)}</div>
                    ${state.selectedCandidate?.title === candidate.title ? `<span class="selected-note">已选择为下一章</span>` : ""}
                  </div>
                </button>
              `,
            )
            .join("")}
        </div>
        <footer class="chapter-modal-actions">
          <button class="ghost-button" id="change-direction-button" type="button">换一个方向</button>
          <button class="primary-wide" id="next-button" type="button" ${state.selectedCandidate ? "" : "disabled"}>确定，进入下一章</button>
        </footer>
      </section>
    </div>
  `;
}

function renderAdventure() {
  const step = state.route[state.currentIndex] || state.route[state.route.length - 1];
  const nextStep = state.useDemo ? adventure.steps[state.currentIndex + 1] : null;
  const canFinishEarly = state.route.length >= 3;
  const candidates = state.useDemo ? state.candidates : state.candidates;
  const selectedDirectionText = directionTitle(state.selectedDirection) || directionText(state.selectedDirection);
  const modalMarkup = renderCandidateModal(candidates, selectedDirectionText);

  app.innerHTML = `
    <section class="screen adventure-screen">
      <header class="app-header">
        <div>
          <p class="eyebrow">非书 · 第 ${state.route.length} 章</p>
          <h1>你的非书已写到第 ${state.route.length} 章</h1>
          <p class="header-subtitle">${canFinishEarly ? `这本书已经有 ${state.route.length} 章了，现在就可以装订。当然，你也可以继续读下去。` : `再读 ${3 - state.route.length} 章，就可以装订成书了。`}</p>
        </div>
        <div class="header-actions">
          ${canFinishEarly && !state.finished ? `<button class="ghost-button" id="early-book-button">装订这本非书</button>` : ""}
          <button class="ghost-button" id="restart-button">另起一本</button>
        </div>
      </header>
      ${state.error ? `<div class="error-banner">${state.error}</div>` : ""}
      <section class="chapter-status" aria-label="成书状态">
        <div class="chapter-marks">
          ${[1, 2, 3]
            .map((count) => `<span class="${state.route.length >= count ? "complete" : ""}">第 ${count} 章</span>`)
            .join("")}
        </div>
        <strong class="${canFinishEarly ? "book-ready" : "book-pending"}">${canFinishEarly ? "已可成书" : `还需 ${3 - state.route.length} 章`}</strong>
      </section>

      <div class="chapter-layout">
        <aside class="chapter-toc" aria-label="目录">
          <h2>目录</h2>
          <div class="chapter-toc-list">
            ${state.route
              .map(
                (item, index) => `
                  <div class="chapter-toc-item ${index === state.currentIndex ? "active" : ""}">
                    <span>${index + 1}</span>
                    <p>第 ${index + 1} 章<br><strong>${item.title}</strong></p>
                  </div>
                `,
              )
              .join("")}
          </div>
          <p class="chapter-toc-note">满 3 章即可装订</p>
        </aside>

        <main class="chapter-flow">
          <section class="flow-step">
            <div class="step-heading">
              <span>1</span>
              <div>
                <h2>这一章讲了什么</h2>
                <p>以下是本章导读。想读全文，点击标题即可跳转。</p>
              </div>
            </div>
            <article class="reading-card chapter-reading-card">
              <div class="article-meta">第 ${state.currentIndex + 1} 章 · ${step.author || "来源待确认"}</div>
              <h3>${step.title}</h3>
              ${
                step.needsUserText
                  ? `<p class="reading-note">这段链接的内容读取不完整，导读基于标题和摘要生成。不影响继续阅读。</p>`
                  : ""
              }
              <div class="chapter-insight">
                <strong>本章核心</strong>
                <p>${step.summary}</p>
              </div>
              <div class="chapter-insight">
                <strong>与上一章的连接</strong>
                <p>${step.bridge || "这是这本非书的起点，它会决定后续章节如何展开。"}</p>
              </div>
              <div class="chapter-insight">
                <strong>它可能引向哪里</strong>
                <p>${step.directions?.[0]?.reason || "接下来可以继续深入，也可以回到生活经验，选择一个方向后我会整理适合作为下一章的内容。"}</p>
              </div>
              <div class="tag-row">${(step.concepts || []).map((tag) => `<span>${tag}</span>`).join("")}</div>
            </article>
          </section>

          <section class="flow-step">
            <div class="step-heading">
              <span>2</span>
              <div>
                <h2>下一章想往哪里写？</h2>
                <p>选一个方向，我为你找三篇适合作为下一章的文章。</p>
              </div>
            </div>
            ${
              step.directions?.length
                ? `<div class="direction-list chapter-direction-list">${step.directions
                    .map(
                      (direction, index) => `
                        <button class="direction ${selectedDirectionText === directionTitle(direction) || selectedDirectionText === direction.text ? "selected" : ""}" type="button" data-index="${index}">
                          <span>${direction.label}</span>
                          <strong>${direction.text}</strong>
                          ${direction.reason ? `<small>${direction.reason}</small>` : ""}
                        </button>
                      `,
                    )
                    .join("")}</div>`
                : state.loading
                  ? `<div class="empty-next-step"><p>下一章方向正在整理中，稍等片刻就可以继续选择。</p></div>`
                  : canFinishEarly
                    ? `<div class="empty-next-step">
                        <p>这本书已经可以装订了。你也可以继续读，把它写得更厚。</p>
                        <button id="book-button" class="primary-wide" type="button">装订这本非书</button>
                      </div>`
                    : `<div class="empty-next-step"><p>暂时没有找到方向。你可以稍后再试，或另起一本非书。</p></div>`
            }
          </section>
        </main>
      </div>
      ${modalMarkup}
    </section>
  `;

  document.querySelector("#restart-button").addEventListener("click", () => {
    if (isBusy()) return;
    restart();
  });
  document.querySelector("#early-book-button")?.addEventListener("click", () => {
    if (isBusy()) return;
    finishBook();
  });
  document.querySelectorAll(".direction").forEach((button) => {
    button.addEventListener("click", () => {
      if (isBusy()) return;
      chooseDirection(step.directions[Number(button.dataset.index)]);
    });
  });
  document.querySelectorAll(".candidate-card").forEach((button) => {
    button.addEventListener("click", () => {
      if (isBusy()) return;
      chooseCandidate(candidates[Number(button.dataset.candidate)]);
    });
  });
  document.querySelectorAll(".chapter-choice").forEach((button) => {
    button.addEventListener("click", () => {
      if (isBusy()) return;
      chooseCandidate(candidates[Number(button.dataset.candidate)]);
    });
  });
  document.querySelector("#candidate-modal-close")?.addEventListener("click", () => {
    if (isBusy()) return;
    closeCandidateModal();
  });
  document.querySelector("#change-direction-button")?.addEventListener("click", () => {
    if (isBusy()) return;
    closeCandidateModal();
  });
  document.querySelector("#next-button")?.addEventListener("click", () => {
    if (isBusy()) return;
    goNext();
  });
  document.querySelector("#book-button")?.addEventListener("click", () => {
    if (isBusy()) return;
    finishBook();
  });
}

function renderBook(book = state.activeBook || sampleBook()) {
  const authors = uniqueAuthors(book.steps);
  app.innerHTML = `
    <section class="screen book-screen">
      ${nav("library")}
      <header class="book-detail-hero">
        <div class="detail-cover-wrap">
          ${coverMarkup(book, "large")}
          <p class="created-at">创建时间：${book.createdAt}</p>
        </div>
        <div class="detail-main">
          <p class="eyebrow">已保存到我的非书</p>
          <h1>${book.title}</h1>
          <p class="lead">${book.subtitle}</p>
          <div class="tag-row">${book.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
          <div class="detail-stats">
            <span><strong>${book.steps.length}</strong>章</span>
            <span><strong>${authorCount(book)}</strong>位作者</span>
            <span><strong>${conceptCount(book)}</strong>个概念</span>
            <span>可阅读原文</span>
          </div>
          <div class="hero-actions">
            <button id="restart-button">再读一本</button>
            <button class="ghost-button" disabled>分享（即将上线）</button>
          </div>
        </div>
      </header>

      <section class="detail-grid">
        <article class="preface">
          <h2>序言</h2>
          <p>${book.preface}</p>
        </article>
        <article class="cover-concept-panel">
          <h2>封面</h2>
          <p>${book.coverConcept || "这是根据你阅读的主题自动设计的封面概念。正式封面生成即将上线。"}</p>
          <div class="tag-row compact"><span>自动封面概念</span><span>可生成图片</span><span>适合分享</span></div>
        </article>
        <article class="toc">
          <div class="section-heading row compact-heading">
            <h2>目录</h2>
            <span class="soft-note">查看全部 ${book.steps.length} 章</span>
          </div>
          <div class="chapter-list">
            ${book.steps
              .slice(0, 6)
              .map(
                (step, index) => `
                  <div class="chapter-row">
                    <span class="chapter-index">${index + 1}</span>
                    <div>
                      <strong>${step.title}</strong>
                      <small>${step.author} · 原文入口与摘要导读</small>
                    </div>
                    <div class="tag-row compact">${step.concepts.slice(0, 2).map((tag) => `<span>${tag}</span>`).join("")}</div>
                  </div>
                `,
              )
              .join("")}
          </div>
        </article>
        <article class="authors-panel">
          <h2>来源与作者</h2>
          <p>这本书由 ${authorCount(book)} 位作者的知乎内容共同构成。点击任意章节即可阅读原文。</p>
          <div class="author-list">
            ${authors
              .slice(0, 8)
              .map((name, index) => {
                const profile = authorProfiles.find((author) => author.name === name) || authorProfiles[index % authorProfiles.length];
                return `
                  <div class="author-item">
                    <span>${profile.avatar}</span>
                    <div><strong>${name}</strong><small>贡献 ${index < 3 ? 2 : 1} 章</small></div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </article>
        <aside class="route-timeline">
          <h2>你的章节线索</h2>
          ${book.steps
            .map(
              (step, index) => `
                <div class="timeline-item">
                  <span>${index + 1}</span>
                  <p>${step.title}</p>
                </div>
              `,
            )
            .join("")}
          <button class="ghost-button">查看完整路线（即将上线）</button>
        </aside>
      </section>
    </section>
  `;
  bindNav();
  document.querySelector("#restart-button").addEventListener("click", () => {
    if (isBusy()) return;
    restart();
  });
}

function renderLibrary() {
  const books = readLibrary();
  const savedBooks = books.length ? books : [];
  const visibleBooks = [...savedBooks, ...sampleBooks.filter((book) => !savedBooks.some((item) => item.id === book.id))];
  app.innerHTML = `
    <section class="screen library-screen">
      ${nav("library")}
      <header class="page-heading">
        <p class="eyebrow">我的非书</p>
        <h1>你的书架</h1>
        <p class="lead">每次读完一条路，就成了一本非书。这里保存着你选过的方向、读过的章节和留下的思考。</p>
      </header>
      ${
        savedBooks.length
          ? `<section class="section-block">
              <div class="section-heading row">
                <div>
                  <p class="eyebrow">已保存</p>
                  <h2>你读过的非书</h2>
                </div>
                <button class="ghost-button" id="new-book-button">开始新的非书</button>
              </div>
              <div class="shelf-grid">${savedBooks.map(bookCard).join("")}</div>
            </section>`
          : `<section class="empty-state">
              <div class="empty-illustration">${coverMarkup(sampleBooks[0])}</div>
              <div>
                <h2>你的书架还是空的。</h2>
                <p>从一篇文章开始，读出一本属于你自己的书。</p>
                <button id="new-book-button">开始第一本非书</button>
              </div>
            </section>`
      }
      <section class="section-block">
        <div class="section-heading row">
          <div>
            <p class="eyebrow">示例</p>
            <h2>先看看这些示例非书</h2>
          </div>
          <span class="soft-note">示例非书来自知乎优质内容，用来展示探索灵感。</span>
        </div>
        <div class="shelf-grid">
          ${sampleBooks.map(bookCard).join("")}
        </div>
      </section>
    </section>
  `;
  bindNav();
  document.querySelector("#new-book-button")?.addEventListener("click", () => {
    if (isBusy()) return;
    navigate("start");
  });
  document.querySelectorAll(".shelf-card").forEach((card) => {
    card.addEventListener("click", () => {
      if (isBusy()) return;
      const book = visibleBooks.find((item) => item.id === card.dataset.book);
      update({ view: "book", activeBook: book });
    });
  });
}

function render() {
  if (!state.loading && thinkingModalEl) { hideThinkingModal(); }
  if (state.view === "landing") renderLanding();
  else if (state.view === "start") renderStart();
  else if (state.view === "library") renderLibrary();
  else if (state.view === "book") renderBook();
  else renderAdventure();
}

function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get("url");
  const textParam = params.get("text");

  if (urlParam) {
    state.inputUrl = urlParam;
    startAdventure();
    return true;
  }
  if (textParam) {
    state.articleText = textParam;
    startAdventure();
    return true;
  }
  return false;
}

if (!handleUrlParams()) {
  render();
}
