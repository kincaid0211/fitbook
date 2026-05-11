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
  Object.assign(state, partial);
  render();
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
      <button class="brand-button" data-view="landing" aria-label="非书首页"><img class="brand-logo" src="${logoSrc}" alt="非书" /></button>
      <div class="nav-links">
        <button class="${active === "landing" ? "active" : ""}" data-view="landing">首页</button>
        <button class="${active === "start" ? "active" : ""}" data-view="start">开始探索</button>
        <button class="${active === "library" ? "active" : ""}" data-view="library">我的非书</button>
      </div>
    </nav>
  `;
}

function bindNav() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.view));
  });
}

function renderLanding() {
  app.innerHTML = `
    <section class="screen landing-screen">
      ${nav("landing")}
      <div class="landing-hero">
        <div>
          <p class="eyebrow">知乎站内主动学习 demo</p>
          <h1>读出自己的书。</h1>
          <p class="lead">非书从一个知乎问题出发，把优质内容组织成一场 10 站启发式阅读。每一步都有选择，每一次跳转都有理由，最后生成可保存、可分享、可评价的知识读本。</p>
          <div class="hero-actions">
            <button id="hero-start">开始一次探索</button>
            <button class="ghost-button" id="hero-library">查看我的非书</button>
          </div>
        </div>
        <aside class="value-card">
          <p class="eyebrow">产品价值</p>
          <h2>不是让算法继续喂内容，而是让用户主动选择下一站。</h2>
          <div class="value-list">
            <span>突破认知茧房</span>
            <span>沉淀阅读成果</span>
            <span>让优质内容重新流动</span>
          </div>
        </aside>
      </div>
      <section class="feature-grid" aria-label="核心玩法">
        <article><strong>有限探索</strong><span>10 站封顶，给阅读明确终点和完成感。</span></article>
        <article><strong>知识桥</strong><span>每一步都解释为什么能从上一篇走到下一篇。</span></article>
        <article><strong>读本化</strong><span>最终生成类似歌单的非书读本，可保存、分享、评价。</span></article>
      </section>
      <section class="landing-flow">
        <h2>一本非书如何生成</h2>
        <div class="flow-grid">
          <article><span>1</span><strong>粘贴知乎链接</strong><p>从用户正在阅读的一篇内容出发。</p></article>
          <article><span>2</span><strong>选择下一站</strong><p>在深入、跨界、人物、观点挑战中做选择。</p></article>
          <article><span>3</span><strong>完成 10 站</strong><p>走完一条有叙事和关联的阅读路线。</p></article>
          <article><span>4</span><strong>生成非书</strong><p>沉淀为一份可分享的知识读本。</p></article>
        </div>
      </section>
    </section>
  `;
  bindNav();
  document.querySelector("#hero-start").addEventListener("click", () => navigate("start"));
  document.querySelector("#hero-library").addEventListener("click", () => navigate("library"));
}

function renderStart() {
  const detectedType = parseZhihuUrl(state.inputUrl);
  app.innerHTML = `
    <section class="screen start-screen">
      ${nav("start")}
      <div class="hero compact-hero">
        <p class="eyebrow">开始一次新的非书探索</p>
        <h1>选择起点</h1>
        <p class="lead">粘贴一篇知乎文章、回答、问题或知识内容链接，AI 会把它变成 10 站探索路线的第一站。</p>
      </div>
      <form class="start-panel" id="start-form">
        <label for="url-input">粘贴知乎文章链接</label>
        <div class="input-row">
          <input id="url-input" type="url" value="${state.inputUrl}" placeholder="https://www.zhihu.com/question/.../answer/..." />
          <button type="submit">开始探索</button>
        </div>
        <p class="${detectedType ? "hint good" : "hint"}">${detectedType ? `已识别：${detectedType}` : state.selectedDirection || "支持知乎文章、回答、问题和知识内容链接。"}</p>
      </form>
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
  app.innerHTML = `
    <section class="screen book-screen">
      ${nav("library")}
      <header class="book-cover">
        <p class="eyebrow">非书 · ${book.style}</p>
        <h1>${book.title}</h1>
        <p>${book.subtitle}</p>
        <div class="tag-row centered">${book.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
      </header>
      <section class="book-layout">
        <article class="preface">
          <h2>序言</h2>
          <p>${book.preface}</p>
          <div class="book-stats">
            <span>${book.steps.length} 篇文章</span>
            <span>${book.createdAt}</span>
            <span>已保存到我的非书</span>
          </div>
        </article>
        <article class="toc">
          <h2>目录</h2>
          <ol>
            ${book.steps.map((step) => `<li><span>${step.title}</span><small>${step.author}</small></li>`).join("")}
          </ol>
        </article>
      </section>
      <div class="actions">
        <button id="restart-button">再走一次</button>
        <button id="library-button" class="ghost-button">查看我的非书</button>
      </div>
    </section>
  `;
  bindNav();
  document.querySelector("#restart-button").addEventListener("click", restart);
  document.querySelector("#library-button").addEventListener("click", () => navigate("library"));
}

function renderLibrary() {
  const books = readLibrary();
  const visibleBooks = books.length ? books : [sampleBook()];
  app.innerHTML = `
    <section class="screen library-screen">
      ${nav("library")}
      <div class="hero compact-hero">
        <p class="eyebrow">我的非书</p>
        <h1>保存读出的书</h1>
        <p class="lead">每次完成 10 站探索后，系统都会把你的阅读路径保存成一本非书。它像歌单一样，可以复读、分享，也可以被评价。</p>
      </div>
      <section class="library-grid">
        ${visibleBooks
          .map(
            (book) => `
              <article class="book-card" data-book="${book.id}">
                <p class="eyebrow">${book.createdAt}</p>
                <h2>${book.title}</h2>
                <p>${book.subtitle}</p>
                <div class="tag-row">${book.tags.slice(0, 3).map((tag) => `<span>${tag}</span>`).join("")}</div>
                <div class="book-card-footer">
                  <span>${book.steps.length} 站</span>
                  <span>可分享 · 可评价</span>
                </div>
              </article>
            `,
          )
          .join("")}
      </section>
    </section>
  `;
  bindNav();
  document.querySelectorAll(".book-card").forEach((card) => {
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
