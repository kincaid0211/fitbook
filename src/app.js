import { adventure, sampleUrl } from "./mockData.js";

const app = document.querySelector("#app");
const libraryKey = "feishu-library";
const logoSrc = window.FEISHU_LOGO_SRC || "assets/feishu-logo.png";

const state = {
  view: "landing",
  currentIndex: 0,
  route: [adventure.steps[0]],
  selectedDirection: null,
  inputUrl: sampleUrl,
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
    subtitle: "从情绪、记忆到认知茧房的一条主动阅读路线",
    style: adventure.style,
    tags: ["心理学", "音乐", "情绪"],
    steps: adventure.steps,
    createdAt: "示例路线",
    preface:
      "这是你从一个知乎问题出发读出的路线。它记录了你如何从音乐、情绪、记忆一路读到认知茧房。",
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
    createdAt: "示例路线",
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
    createdAt: "示例路线",
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
    createdAt: "示例路线",
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
    createdAt: "示例路线",
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
    createdAt: "示例路线",
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
          <span>${book.steps.length} 站</span>
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
  return {
    id: `book_${Date.now()}`,
    title: adventure.title,
    subtitle: adventure.subtitle,
    style: adventure.style,
    tags: adventure.tags,
    steps: state.route,
    createdAt: new Date().toLocaleString("zh-CN"),
    preface:
      "这本非书从一篇关于音乐心理学的知乎回答出发，经过情绪、奖赏机制、作品结构、个人记忆、社会审美与认知茧房，最终形成一条由用户选择生成的启发式阅读路线。",
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
      "这是一条示例非书路线，用来展示用户完成 10 站探索后，如何把阅读过程沉淀成可保存、可分享的知识读本。",
  };
}

function update(partial) {
  const previousView = state.view;
  Object.assign(state, partial);
  render();
  if (partial.view && partial.view !== previousView) {
    window.scrollTo({ top: 0, left: 0 });
  }
}

function navigate(view) {
  update({ view, selectedDirection: null, activeBook: null });
}

function startAdventure(event) {
  event?.preventDefault();
  const type = parseZhihuUrl(state.inputUrl);
  if (!type) {
    update({ selectedDirection: "请粘贴知乎文章、回答、问题或知识内容链接。" });
    return;
  }
  update({
    view: "adventure",
    currentIndex: 0,
    route: [adventure.steps[0]],
    selectedDirection: null,
    finished: false,
    activeBook: null,
  });
}

function chooseDirection(direction) {
  update({ selectedDirection: direction.text });
}

function goNext() {
  const nextIndex = Math.min(state.currentIndex + 1, adventure.steps.length - 1);
  update({
    currentIndex: nextIndex,
    route: adventure.steps.slice(0, nextIndex + 1),
    selectedDirection: null,
    finished: nextIndex === adventure.steps.length - 1,
  });
}

function restart() {
  update({
    view: "start",
    currentIndex: 0,
    route: [adventure.steps[0]],
    selectedDirection: null,
    inputUrl: sampleUrl,
    finished: false,
    activeBook: null,
  });
}

function finishBook() {
  const book = saveCurrentBook();
  update({ view: "book", activeBook: book, finished: "book" });
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
          <p class="lead">从一个知乎问题出发，在启发式阅读和主动探索中生成你的知识读本。</p>
          <div class="hero-actions">
            <button id="hero-start">开始第一本非书</button>
            <button class="ghost-button" id="hero-library">看看示例</button>
          </div>
          <div class="hero-meta">
            <span>知乎站内内容</span>
            <span>你来选择方向</span>
            <span>生成你的非书</span>
            <span>可保存可分享</span>
          </div>
        </div>
        <aside class="hero-book-preview">
          ${coverMarkup(featured, "large")}
          <div class="stat-stack">
            <span><strong>10</strong> 站路线</span>
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
          <article><span class="feature-icon">01</span><strong>从碎片到路线</strong><p>把散落的好内容，连成一条有方向的阅读路线。</p></article>
          <article><span class="feature-icon">02</span><strong>从推荐到选择</strong><p>下一站由你决定，让阅读更主动、更有感。</p></article>
          <article><span class="feature-icon">03</span><strong>从读完到沉淀</strong><p>完成 10 站探索，生成属于你的知识读本。</p></article>
        </div>
      </section>

      <section class="section-block landing-flow">
        <div class="section-heading">
          <p class="eyebrow">如何使用非书？</p>
          <h2>从一次好奇，到一本可分享的非书。</h2>
        </div>
        <div class="flow-grid">
          <article><span>1</span><strong>粘贴知乎内容</strong><p>选择一个问题、回答或文章作为起点。</p></article>
          <article><span>2</span><strong>选择下一站</strong><p>在深入、跨界、人物、观点挑战中决定方向。</p></article>
          <article><span>3</span><strong>读完 10 站</strong><p>每一步都有知识桥，解释为什么读到这里。</p></article>
          <article><span>4</span><strong>生成非书</strong><p>把你的阅读过程沉淀为个人知识读本。</p></article>
        </div>
      </section>

      <section class="section-block sample-shelf">
        <div class="section-heading row">
          <div>
            <p class="eyebrow">示例路线</p>
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
  const detectedType = parseZhihuUrl(state.inputUrl);
  app.innerHTML = `
    <section class="screen start-screen">
      ${nav("start")}
      <div class="start-layout">
        <div class="hero compact-hero">
          <p class="eyebrow">开始一次新的非书探索</p>
          <h1>从你正在看的知乎内容开始。</h1>
          <p class="lead">粘贴一个知乎问题、回答、文章或知识内容链接。非书会把它变成 10 站启发式阅读的第一站。</p>
        </div>
        <form class="start-panel" id="start-form">
          <label for="url-input">粘贴知乎链接</label>
          <div class="input-row">
            <input id="url-input" type="url" value="${state.inputUrl}" placeholder="https://www.zhihu.com/question/.../answer/..." />
            <button type="submit">开始探索</button>
          </div>
          <p class="${detectedType ? "hint good" : "hint"}">${detectedType ? `已识别：${detectedType}` : state.selectedDirection || "支持知乎文章、回答、问题和知识内容链接。"}</p>
        </form>
      </div>
    </section>
  `;

  bindNav();
  document.querySelector("#url-input").addEventListener("input", (event) => {
    state.inputUrl = event.target.value;
    render();
  });
  document.querySelector("#start-form").addEventListener("submit", startAdventure);
}

function renderAdventure() {
  const step = adventure.steps[state.currentIndex];
  const progressLabel = `${state.currentIndex + 1} / ${adventure.steps.length}`;
  const progressPercent = Math.round(((state.currentIndex + 1) / adventure.steps.length) * 100);
  const nextStep = adventure.steps[state.currentIndex + 1];

  app.innerHTML = `
    <section class="screen adventure-screen">
      <header class="app-header">
        <div>
          <p class="eyebrow">第 ${progressLabel} 站 · ${adventure.style}</p>
          <h1>${step.title}</h1>
        </div>
        <button class="ghost-button" id="restart-button">重新开始</button>
      </header>
      <section class="progress-panel" aria-label="探索进度">
        <div class="progress-copy">
          <strong>非书生成进度</strong>
          <span>已完成 ${progressPercent}% · 还差 ${adventure.steps.length - state.currentIndex - 1} 站生成非书</span>
        </div>
        <div class="progress-track"><div style="width: ${progressPercent}%"></div></div>
      </section>

      <div class="layout">
        <article class="reading-card">
          <div class="article-meta">作者：${step.author}</div>
          <p>${step.summary}</p>
          <div class="tag-row">${step.concepts.map((tag) => `<span>${tag}</span>`).join("")}</div>
          <div class="bridge">
            <strong>知识桥</strong>
            <p>${step.bridge}</p>
          </div>
        </article>

        <aside class="side-panel">
          <h2>下一站方向</h2>
          ${
            step.directions.length
              ? `<div class="direction-list">${step.directions
                  .map(
                    (direction, index) => `
                      <button class="direction ${state.selectedDirection === direction.text ? "selected" : ""}" data-index="${index}">
                        <span>${direction.label}</span>
                        ${direction.text}
                      </button>
                    `,
                  )
                  .join("")}</div>`
              : `<p class="muted">已抵达第 10 站，可以生成非书。</p>`
          }
          ${
            state.selectedDirection && nextStep
              ? `<div class="candidate">
                  <p class="eyebrow">推荐候选</p>
                  <h3>${nextStep.title}</h3>
                  <p>${nextStep.summary}</p>
                  <button id="next-button">加入路线</button>
                </div>`
              : ""
          }
          ${state.finished ? `<button id="book-button" class="primary-wide">生成并保存非书</button>` : ""}
        </aside>
      </div>

      <section class="route-strip">
        ${state.route
          .map(
            (item, index) => `
              <div class="route-node ${index === state.currentIndex ? "active" : ""}">
                <span>${index + 1}</span>
                <p>${item.title}</p>
              </div>
            `,
          )
          .join("")}
      </section>
    </section>
  `;

  document.querySelector("#restart-button").addEventListener("click", restart);
  document.querySelectorAll(".direction").forEach((button) => {
    button.addEventListener("click", () => chooseDirection(step.directions[Number(button.dataset.index)]));
  });
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
            <span><strong>${book.steps.length}</strong>站</span>
            <span><strong>${authorCount(book)}</strong>位作者</span>
            <span><strong>${conceptCount(book)}</strong>个概念</span>
            <span>已保存</span>
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
        <article class="toc">
          <div class="section-heading row compact-heading">
            <h2>目录</h2>
            <span class="soft-note">查看全部 ${book.steps.length} 站</span>
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
                      <small>${step.author}</small>
                    </div>
                    <div class="tag-row compact">${step.concepts.slice(0, 2).map((tag) => `<span>${tag}</span>`).join("")}</div>
                  </div>
                `,
              )
              .join("")}
          </div>
        </article>
        <article class="authors-panel">
          <h2>作者贡献</h2>
          <p>${authorCount(book)} 位知乎作者共同构成这本非书。</p>
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
          <h2>你的阅读路线</h2>
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
          <button class="ghost-button">查看完整路线图</button>
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
        <p class="lead">每次完成 10 站探索后，你的阅读路径都会沉淀成一本非书。它可以复读、分享，也可以被推荐给更多人。</p>
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
                <p>从一个知乎问题出发，读出自己的知识读本。</p>
                <button id="new-book-button">开始第一本非书</button>
              </div>
            </section>`
      }
      <section class="section-block">
        <div class="section-heading row">
          <div>
            <p class="eyebrow">示例</p>
            <h2>先看看这些示例路线</h2>
          </div>
          <span class="soft-note">示例路线来自知乎优质内容，用来展示探索灵感。</span>
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
