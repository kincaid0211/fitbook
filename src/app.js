import { adventure, sampleUrl } from "./mockData.js";

const app = document.querySelector("#app");
const libraryKey = "feishu-library";
const aiConfigStorageKey = "feishu-ai-node-config";
const logoSrc = window.FEISHU_LOGO_SRC || "assets/feishu-logo.png";
let loadingTimer = null;

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
    throw new Error(data?.message || "请求失败，请稍后重试。");
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

function setBusy(message) {
  if (loadingTimer) clearInterval(loadingTimer);
  state.loading = message;
  state.loadingStartedAt = Date.now();
  state.error = "";
  render();
  loadingTimer = setInterval(() => {
    if (!state.loading) {
      clearInterval(loadingTimer);
      loadingTimer = null;
      return;
    }
    render();
  }, 1000);
}

function setError(error) {
  if (loadingTimer) clearInterval(loadingTimer);
  loadingTimer = null;
  state.loading = "";
  state.loadingStartedAt = null;
  state.error = error.message || "请求失败，请稍后重试。";
  render();
}

function clearBusy() {
  if (loadingTimer) clearInterval(loadingTimer);
  loadingTimer = null;
  state.loading = "";
  state.loadingStartedAt = null;
}

function loadingText() {
  if (!state.loading) return "";
  const seconds = state.loadingStartedAt ? Math.max(1, Math.round((Date.now() - state.loadingStartedAt) / 1000)) : 0;
  const suffix = seconds >= 8 ? ` 已等待 ${seconds} 秒，复杂节点可能需要更久。` : "";
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
  }
  render();
  if ((partial.view && partial.view !== previousView) || Object.prototype.hasOwnProperty.call(partial, "currentIndex")) {
    window.scrollTo({ top: 0, left: 0 });
  }
}

function navigate(view) {
  update({ view, selectedDirection: null, selectedCandidate: null, activeBook: null });
}

async function startAdventure(event) {
  event?.preventDefault();
  const detection = detectStartInput(state.inputUrl, state.articleText);
  if (!detection.ok) {
    update({ selectedDirection: detection.label });
    return;
  }
  try {
    setBusy("AI 正在理解你的起点文章...");
    const data = await apiPost("/api/start", {
      url: state.inputUrl,
      text: state.articleText,
    });
    const step = firstStepFromStart(data);
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
      loading: "AI 正在生成下一章方向...",
      loadingStartedAt: Date.now(),
      error: "",
    });
    render();
    await refreshDirections(step);
  } catch (error) {
    setError(error);
  }
}

function startDemoAdventure() {
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
  if (state.useDemo) {
    const nextStep = adventure.steps[state.currentIndex + 1];
    const candidates = candidateOptions(nextStep);
    update({ selectedDirection: direction, selectedCandidate: candidates[0] || null, candidates });
    return;
  }

  try {
    Object.assign(state, {
      selectedDirection: direction,
      selectedCandidate: null,
      candidates: [],
      loading: "正在搜索并筛选候选内容...",
      loadingStartedAt: Date.now(),
      error: "",
    });
    render();
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
  update({ selectedCandidate: candidate });
}

function closeCandidateModal() {
  update({ candidates: [], selectedCandidate: null, selectedDirection: null });
}

async function goNext() {
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
    Object.assign(state, {
      selectedDirection: null,
      selectedCandidate: null,
      candidates: [],
      loading: "正在生成章节导读、衔接关系和下一章方向...",
      loadingStartedAt: Date.now(),
      error: "",
    });
    render();
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
      setBusy("AI 正在生成下一章方向...");
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
  if (state.useDemo) {
    const book = saveCurrentBook();
    update({ view: "book", activeBook: book, finished: "book" });
    return;
  }

  try {
    setBusy("正在装订你的非书...");
    const localBook = makeBook();

    const [bookResult, coverResult] = await Promise.allSettled([
      apiPost("/api/book", {
        route: state.route,
        interestProfile: state.interestProfile,
      }),
      apiPost("/api/cover", { book: localBook }),
    ]);

    let book = bookResult.status === "fulfilled" ? bookResult.value.book : localBook;
    if (bookResult.status === "rejected") {
      console.error("Book API failed:", bookResult.reason);
    }

    let coverData;
    if (coverResult.status === "fulfilled") {
      coverData = coverResult.value.coverConcept;
    } else {
      console.error("Cover API failed:", coverResult.reason);
    }

    if (coverData) {
      book = {
        ...book,
        coverConcept: coverData.composition || coverData.imagePrompt || "",
        coverData: coverData,
        cover: coverData.cssTheme || "music",
      };
    } else {
      book = {
        ...book,
        coverConcept: "封面方案暂时生成失败，但这本非书的章节导读已经完成。",
        cover: "music",
      };
    }

    const existing = readLibrary();
    writeLibrary([book, ...existing.filter((item) => item.id !== book.id)].slice(0, 12));
    update({ view: "book", activeBook: book, finished: "book", loading: "", loadingStartedAt: null, error: "" });
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
    button.addEventListener("click", () => navigate(button.dataset.view));
  });
}

function renderLanding() {
  const featured = sampleBooks[0];
  app.innerHTML = `
    <section class="screen landing-screen">
      ${nav("landing")}
      <div class="landing-hero hero-shell">
        <div class="hero-copy">
          <p class="eyebrow">知乎启发式阅读 demo</p>
          <h1>读出自己的书。</h1>
          <p class="lead">从任意一篇文章出发，让 AI 知识策展人陪你选择下一章，在知乎与全网内容中生成自己的知识读本。</p>
          <div class="hero-actions">
            <button id="hero-start">开始第一本非书</button>
            <button class="ghost-button" id="hero-library">看看示例</button>
          </div>
          <div class="hero-meta">
            <span>任意文章起点</span>
            <span>兴趣驱动探索</span>
            <span>AI 知识策展</span>
            <span>自动生成封面</span>
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

      <section class="section-block">
        <div class="section-heading">
          <p class="eyebrow">为什么需要非书？</p>
          <h2>你值得用更主动的方式，读懂这个世界。</h2>
        </div>
        <div class="feature-grid" aria-label="核心玩法">
          <article><span class="feature-icon">01</span><strong>从文章到兴趣</strong><p>先理解你给出的文章，再提炼可继续探索的概念、争议和案例。</p></article>
          <article><span class="feature-icon">02</span><strong>从推荐到策展</strong><p>AI 给出方向和候选，你用选择把章节编成自己的样子。</p></article>
          <article><span class="feature-icon">03</span><strong>从阅读到非书</strong><p>写到 3 章即可装订，也可以继续收入新的章节。</p></article>
        </div>
      </section>

      <section class="section-block landing-flow">
        <div class="section-heading">
          <p class="eyebrow">如何使用非书？</p>
          <h2>从一次好奇，到一本可分享的非书。</h2>
        </div>
        <div class="flow-grid">
          <article><span>1</span><strong>放入起点</strong><p>输入文章链接，或直接粘贴标题、摘要和正文片段。</p></article>
          <article><span>2</span><strong>选择方向</strong><p>在深入、跨界、人物、观点挑战和意外发现中前进。</p></article>
          <article><span>3</span><strong>挑选候选</strong><p>知乎内容优先，全网搜索补充背景，每一章都解释连接理由。</p></article>
          <article><span>4</span><strong>装订成书</strong><p>生成封面概念、目录、章节导读和策展人点评。</p></article>
        </div>
      </section>

      <section class="section-block sample-shelf">
        <div class="section-heading row">
          <div>
            <p class="eyebrow">示例非书</p>
            <h2>先看看你可以读出什么书。</h2>
          </div>
          <button class="ghost-button" id="sample-library">查看我的非书</button>
        </div>
        <div class="shelf-grid">
          ${sampleBooks.slice(0, 3).map(bookCard).join("")}
        </div>
      </section>
    </section>
  `;
  bindNav();
  document.querySelector("#hero-start").addEventListener("click", () => navigate("start"));
  document.querySelector("#hero-library").addEventListener("click", () => navigate("library"));
  document.querySelector("#sample-library").addEventListener("click", () => navigate("library"));
}

function renderStart() {
  const detected = detectStartInput(state.inputUrl, state.articleText);
  app.innerHTML = `
    <section class="screen start-screen">
      ${nav("start")}
      <div class="start-layout">
        <div class="hero compact-hero">
          <p class="eyebrow">开始一次新的非书探索</p>
          <h1>从任意一篇文章开始。</h1>
          <p class="lead">输入文章链接，或直接粘贴一段内容。非书会先理解起点，再用知乎搜索和全网背景为你策展下一章。</p>
        </div>
        <form class="start-panel" id="start-form">
          <label for="url-input">文章链接</label>
          <div class="input-row">
            <input id="url-input" type="url" value="${state.inputUrl}" placeholder="https://www.zhihu.com/question/... 或任意文章链接" />
            <button type="submit">开始探索</button>
          </div>
          <div class="paste-block">
            <label for="article-input">链接无法解析时，粘贴文章片段</label>
            <textarea id="article-input" rows="5" placeholder="粘贴标题、摘要或正文片段，也可以只放你最有感觉的一段。">${state.articleText}</textarea>
          </div>
          <p class="${detected.ok ? "hint good" : "hint"}">${detected.ok ? `已识别：${detected.label}` : state.selectedDirection || detected.label}</p>
          ${state.loading ? `<p class="status-message">${loadingText()}</p>` : ""}
          ${state.error ? `<p class="error-message">${state.error}</p>` : ""}
          <div class="start-ai-notes">
            <span>AI 先提炼兴趣</span>
            <span>章节优先导向知乎原文</span>
            <span>写到第 3 章即可装订</span>
          </div>
          <button class="ghost-button demo-route-button" type="button" id="demo-route-button">使用演示非书</button>
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
            <p class="eyebrow">关键选择</p>
            <h2 id="chapter-modal-title">选择下一章</h2>
          </div>
          <p>你选择了「${selectedDirectionText}」。下面 3 章都能接住当前内容，但会把这本非书带向不同的阅读重点。</p>
        </header>
        <div class="chapter-choice-list" role="radiogroup" aria-label="选择下一章">
          ${candidates
            .map(
              (candidate, index) => `
                <button class="chapter-choice ${state.selectedCandidate?.title === candidate.title ? "selected" : ""}" type="button" data-candidate="${index}" role="radio" aria-checked="${state.selectedCandidate?.title === candidate.title}">
                  <div class="signal-row">${candidateSignals(candidate)}</div>
                  <strong>${candidateTitle(candidate)}</strong>
                  <p><b>如何接上这一章：</b>${candidate.connection || candidate.bridgePreview || "它能接住当前章节留下的问题，继续推进这本非书的阅读线索。"}</p>
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
          <button class="primary-wide" id="next-button" type="button" ${state.selectedCandidate ? "" : "disabled"}>加入为下一章</button>
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
          <p class="eyebrow">非书 · 把一组文章编成一本自己的短书</p>
          <h1>你的非书已写到第 ${state.route.length} 章</h1>
          <p class="header-subtitle">${canFinishEarly ? "这本非书已经可以成书，你也可以继续收入新的章节，让它变得更完整。" : "继续收入章节，写到第 3 章后就可以装订成书。"}</p>
        </div>
        <div class="header-actions">
          ${canFinishEarly && !state.finished ? `<button class="ghost-button" id="early-book-button">装订这本非书</button>` : ""}
          <button class="ghost-button" id="restart-button">重新开始</button>
        </div>
      </header>
      ${state.loading ? `<div class="status-banner">${loadingText()}</div>` : ""}
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
          <p class="chapter-toc-note">3 章以上即可装订</p>
        </aside>

        <main class="chapter-flow">
          <section class="flow-step">
            <div class="step-heading">
              <span>1</span>
              <div>
                <h2>理解这一章的精彩与衔接</h2>
                <p>这里展示的是章节导读和衔接判断，不替代原文全文。</p>
              </div>
            </div>
            <article class="reading-card chapter-reading-card">
              <div class="article-meta">知乎内容 · ${step.author || "来源待确认"} · 已整理为第 ${state.currentIndex + 1} 章</div>
              <h3>${step.title}</h3>
              ${
                step.needsUserText
                  ? `<p class="reading-note">当前链接未能读取完整正文，已先作为阅读入口生成导读。粘贴原文片段后，非书会给出更准确的章节理解。</p>`
                  : ""
              }
              <div class="chapter-insight">
                <strong>这一章精彩在哪里</strong>
                <p>${step.summary}</p>
              </div>
              <div class="chapter-insight">
                <strong>它如何接住上一章</strong>
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
                <p>选择一个方向，我会直接为你整理可以收入非书的下一章。</p>
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
                        <p>这本非书已经可以装订，也可以稍后继续收入新的章节。</p>
                        <button id="book-button" class="primary-wide" type="button">装订这本非书</button>
                      </div>`
                    : `<div class="empty-next-step"><p>暂时没有生成可选方向，请重新开始或稍后重试。</p></div>`
            }
          </section>
        </main>
      </div>
      ${modalMarkup}
    </section>
  `;

  document.querySelector("#restart-button").addEventListener("click", restart);
  document.querySelector("#early-book-button")?.addEventListener("click", finishBook);
  document.querySelectorAll(".direction").forEach((button) => {
    button.addEventListener("click", () => chooseDirection(step.directions[Number(button.dataset.index)]));
  });
  document.querySelectorAll(".candidate-card").forEach((button) => {
    button.addEventListener("click", () => chooseCandidate(candidates[Number(button.dataset.candidate)]));
  });
  document.querySelectorAll(".chapter-choice").forEach((button) => {
    button.addEventListener("click", () => chooseCandidate(candidates[Number(button.dataset.candidate)]));
  });
  document.querySelector("#candidate-modal-close")?.addEventListener("click", closeCandidateModal);
  document.querySelector("#change-direction-button")?.addEventListener("click", closeCandidateModal);
  document.querySelector("#next-button")?.addEventListener("click", goNext);
  document.querySelector("#book-button")?.addEventListener("click", finishBook);
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
            <span>导读式章节</span>
          </div>
          <div class="hero-actions">
            <button id="restart-button">再读一次</button>
            <button class="ghost-button" disabled>分享这本非书</button>
          </div>
        </div>
      </header>

      <section class="detail-grid">
        <article class="preface">
          <h2>序言</h2>
          <p>${book.preface}</p>
        </article>
        <article class="cover-concept-panel">
          <h2>AI 封面方案</h2>
          <p>${book.coverConcept || "封面以章节主题为核心，生成主视觉关键词、色彩和构图，用于后续图片生成或稳定封面组件展示。"}</p>
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
          <p>${authorCount(book)} 位知乎作者或内容来源共同构成这本非书。章节呈现导读和连接理由，不替代原文全文。</p>
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
          <button class="ghost-button">查看完整章节图</button>
        </aside>
      </section>
    </section>
  `;
  bindNav();
  document.querySelector("#restart-button").addEventListener("click", restart);
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
        <h1>保存读出的书</h1>
        <p class="lead">每次完成一段探索后，你的阅读路径都会沉淀成一本非书。它记录方向选择、候选内容、知识桥、章节导读和封面方案。</p>
      </header>
      ${
        savedBooks.length
          ? `<section class="section-block">
              <div class="section-heading row">
                <div>
                  <p class="eyebrow">已保存</p>
                  <h2>你读出的非书</h2>
                </div>
                <button class="ghost-button" id="new-book-button">开始新的非书</button>
              </div>
              <div class="shelf-grid">${savedBooks.map(bookCard).join("")}</div>
            </section>`
          : `<section class="empty-state">
              <div class="empty-illustration">${coverMarkup(sampleBooks[0])}</div>
              <div>
                <h2>你的第一本非书还没有开始。</h2>
                <p>从任意一篇文章或一段文字出发，读出自己的知识读本。</p>
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
  document.querySelector("#new-book-button")?.addEventListener("click", () => navigate("start"));
  document.querySelectorAll(".shelf-card").forEach((card) => {
    card.addEventListener("click", () => {
      const book = visibleBooks.find((item) => item.id === card.dataset.book);
      update({ view: "book", activeBook: book });
    });
  });
}

function render() {
  if (state.view === "landing") renderLanding();
  else if (state.view === "start") renderStart();
  else if (state.view === "library") renderLibrary();
  else if (state.view === "book") renderBook();
  else renderAdventure();
}

render();
