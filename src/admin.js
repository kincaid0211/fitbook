import { aiConfigStorageKey, aiNodeDefaults, mergeAiConfig } from "./aiNodeConfig.js";

const app = document.querySelector("#admin-app");
const siliconFlowModels = [
  { value: "Pro/moonshotai/Kimi-K2.6", label: "Kimi-K2.6 Pro（当前测试）" },
  { value: "moonshotai/Kimi-K2.6", label: "Kimi-K2.6" },
  { value: "moonshotai/Kimi-K2.5", label: "Kimi-K2.5（较快/较省）" },
  { value: "moonshotai/Kimi-K2-Thinking", label: "Kimi-K2-Thinking" },
  { value: "moonshotai/Kimi-K2-Instruct-0905", label: "Kimi-K2-Instruct-0905" },
  { value: "moonshotai/Kimi-K2-Instruct", label: "Kimi-K2-Instruct" },
  { value: "moonshotai/Kimi-Dev-72B", label: "Kimi-Dev-72B（轻量候选）" },
];

let state = {
  config: readConfig(),
  toast: "",
  modelLists: {
    siliconflow: siliconFlowModels,
  },
  modelListStatus: "",
};

function readConfig() {
  try {
    return mergeAiConfig(JSON.parse(localStorage.getItem(aiConfigStorageKey) || "{}"));
  } catch {
    return mergeAiConfig();
  }
}

function writeConfig() {
  localStorage.setItem(aiConfigStorageKey, JSON.stringify(state.config));
}

function collectFormValues() {
  document.querySelectorAll(".node-form").forEach((form) => {
    const key = form.dataset.node;
    if (!key || !state.config[key]) return;
    form.querySelectorAll("[data-field]").forEach((input) => {
      const field = input.dataset.field;
      if (field === "customModel") {
        state.config[key].model = input.value;
        return;
      }
      if (field === "model" && input.value === "__custom__") return;
      state.config[key][field] =
        field === "temperature" || field === "timeoutSeconds" ? Number(input.value) : input.value;
    });
  });
}

function showToast(text) {
  state.toast = text;
  render();
  setTimeout(() => {
    state.toast = "";
    render();
  }, 1800);
}

async function loadProviderModels(provider) {
  collectFormValues();
  state.modelListStatus = `正在从${provider === "siliconflow" ? "硅基流动" : "模型服务"}读取模型列表...`;
  render();
  try {
    const response = await fetch(`/api/models?provider=${encodeURIComponent(provider)}`);
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.message || "模型列表获取失败");
    if (Array.isArray(payload.models) && payload.models.length) {
      state.modelLists[provider] = payload.models.map((model) => ({
        value: model.id,
        label: model.id,
      }));
    }
    state.modelListStatus = payload.cached ? "已使用缓存模型列表" : "已读取最新模型列表";
  } catch (error) {
    state.modelListStatus = `${error.message || "模型列表获取失败"}，已使用内置备用列表`;
  }
  render();
}

function updateNode(key, field, value) {
  state.config[key] = {
    ...state.config[key],
    [field]: field === "temperature" ? Number(value) : field === "timeoutSeconds" ? Number(value) : value,
  };
}

function modelControl(node) {
  if (node.provider !== "siliconflow") {
    return `
      <label>模型
        <input data-field="model" value="${node.model}" placeholder="例如 kimi-k2.6" />
      </label>
    `;
  }

  const models = state.modelLists.siliconflow || siliconFlowModels;
  const known = models.some((model) => model.value === node.model);
  return `
    <label>模型
      <select data-field="model">
        ${models
          .map((model) => `<option value="${model.value}" ${node.model === model.value ? "selected" : ""}>${model.label}</option>`)
          .join("")}
        <option value="__custom__" ${known ? "" : "selected"}>自定义模型名</option>
      </select>
    </label>
    ${
      known
        ? ""
        : `<label>自定义模型
            <input data-field="customModel" value="${node.model}" placeholder="填写硅基流动模型 ID" />
          </label>`
    }
  `;
}

function nodeCard(key, node) {
  return `
    <article class="node-card">
      <header>
        <div>
          <p class="eyebrow">${key}</p>
          <h2>${node.label}</h2>
        </div>
        <span class="soft-note">${node.provider} · ${node.model}</span>
      </header>
      <div class="node-form" data-node="${key}">
        <label>供应商
          <select data-field="provider">
            <option value="siliconflow" ${node.provider === "siliconflow" ? "selected" : ""}>硅基流动聚合平台</option>
            <option value="kimi" ${node.provider === "kimi" ? "selected" : ""}>Kimi 官方</option>
          </select>
        </label>
        ${modelControl(node)}
        <label>温度
          <input data-field="temperature" type="number" min="0" max="1" step="0.05" value="${node.temperature}" />
        </label>
        <label>超时秒数
          <input data-field="timeoutSeconds" type="number" min="15" max="180" step="5" value="${node.timeoutSeconds}" />
        </label>
        <label class="wide">节点提示词
          <textarea data-field="prompt" rows="5">${node.prompt}</textarea>
        </label>
      </div>
    </article>
  `;
}

function render() {
  app.innerHTML = `
    <section class="admin-screen">
      <header class="admin-header">
        <div>
          <p class="eyebrow">非书后台配置</p>
          <h1>AI 节点与模型配置</h1>
          <p class="lead">这里单独配置每个 AI 节点的模型、温度、超时和提示词。配置保存在当前浏览器本地，不会写入主项目页面。</p>
          ${state.modelListStatus ? `<p class="hint good">${state.modelListStatus}</p>` : ""}
        </div>
        <div class="admin-actions">
          <button class="ghost-button" id="refresh-models">刷新硅基流动模型</button>
          <button id="save-config">保存配置</button>
          <button class="ghost-button" id="reset-config">恢复默认</button>
          <button class="ghost-button" id="open-main">返回主项目</button>
        </div>
      </header>
      <section class="section-block">
        <div class="feature-grid">
          <article><span class="feature-icon">快</span><strong>轻量节点</strong><p>起点理解、方向生成、封面方案建议使用更快模型。</p></article>
          <article><span class="feature-icon">深</span><strong>深度节点</strong><p>章节知识桥、最终非书可以保留更强模型。</p></article>
          <article><span class="feature-icon">稳</span><strong>失败可见</strong><p>节点失败会反馈给用户，不再像页面卡死。</p></article>
        </div>
      </section>
      <section class="node-grid">
        ${Object.entries(state.config).map(([key, node]) => nodeCard(key, node)).join("")}
      </section>
      ${state.toast ? `<div class="admin-toast">${state.toast}</div>` : ""}
    </section>
  `;

  document.querySelectorAll(".node-form").forEach((form) => {
    const key = form.dataset.node;
    form.querySelectorAll("[data-field]").forEach((input) => {
      const handler = () => {
        if (input.dataset.field === "provider") {
          const nextProvider = input.value;
          const nextModel =
            nextProvider === "siliconflow"
              ? state.config[key].model || (state.modelLists.siliconflow || siliconFlowModels)[0].value
              : state.config[key].model === "__custom__"
                ? "kimi-k2.6"
                : state.config[key].model;
          state.config[key] = { ...state.config[key], provider: nextProvider, model: nextModel };
          render();
          return;
        }
        if (input.dataset.field === "model" && input.value === "__custom__") {
          state.config[key] = { ...state.config[key], model: state.config[key].model || "" };
          render();
          return;
        }
        if (input.dataset.field === "customModel") {
          updateNode(key, "model", input.value);
          return;
        }
        updateNode(key, input.dataset.field, input.value);
        if (input.dataset.field === "model") render();
      };
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);
    });
  });

  document.querySelector("#save-config").addEventListener("click", () => {
    collectFormValues();
    writeConfig();
    showToast("AI 配置已保存");
  });
  document.querySelector("#reset-config").addEventListener("click", () => {
    state.config = mergeAiConfig(aiNodeDefaults);
    writeConfig();
    showToast("已恢复默认配置");
  });
  document.querySelector("#open-main").addEventListener("click", () => {
    window.location.href = "/";
  });
  document.querySelector("#refresh-models").addEventListener("click", () => {
    loadProviderModels("siliconflow");
  });
}

render();
loadProviderModels("siliconflow");
