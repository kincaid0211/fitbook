# 知识历险项目说明

更新日期：2026-05-11

## 项目概览

「知识历险」是面向知乎黑客松的 H5/Web 原型。产品从一篇知乎文章、回答、问题或知识内容链接出发，把用户带入一条 10 站的主动阅读路线，并在完成后生成可保存、可分享的知识书单。

当前版本为了保证演示稳定，使用 `src/mockData.js` 中的模拟数据完成核心流程展示；真实知乎 OpenAPI 相关能力保留在校验脚本和项目说明中，敏感 Key 只应通过本地环境变量或本地私有配置使用。

## 文件结构

```text
.
├── AGENTS.md                         # 项目协作、黑客松规则和 API 注意事项
├── PROJECT_GUIDE.md                  # 项目结构、部署和更新记录说明
├── README.md                         # GitHub 首页简介和运行入口
├── index.html                        # 本地开发入口
├── package.json                      # 项目脚本定义
├── dist/
│   └── demo.html                     # 可直接打开的单文件演示版本
├── scripts/
│   ├── build-standalone.mjs          # 生成 dist/demo.html
│   ├── dev-server.mjs                # 启动本地静态开发服务
│   ├── probe-zhihu-search.mjs        # 知乎搜索接口探测脚本
│   └── verify-zhihu-basics.mjs       # URL 解析和签名逻辑的本地冒烟检查
└── src/
    ├── app.js                        # 单页应用逻辑和界面渲染
    ├── mockData.js                   # 演示用知识历险路线数据
    └── styles.css                    # 页面样式
```

未提交到 Git 的本地资料：

- `note/`：黑客松资料、API Key 等敏感或本地参考材料。
- `.env`、`.env.*`：本地环境变量文件。

## 本地运行

项目不依赖前端框架和打包器，使用 Node.js 脚本即可运行。

```bash
npm run dev
```

默认访问地址：

```text
http://127.0.0.1:5173
```

如需指定端口：

```bash
PORT=3000 npm run dev
```

## 构建演示文件

生成一个可直接打开、便于上传静态托管平台的单文件版本：

```bash
npm run build:standalone
```

生成文件：

```text
dist/demo.html
```

该文件会内联当前的 CSS、模拟数据和应用逻辑，适合用于黑客松演示链接或静态页面托管。

## 检查脚本

运行本地冒烟检查：

```bash
npm run check
```

该脚本只验证知乎链接解析和签名头字段生成，不读取真实密钥，也不会发起网络请求。

## 部署方式

### 方式一：静态托管单文件

1. 运行 `npm run build:standalone`。
2. 将 `dist/demo.html` 上传到支持静态 HTML 的平台。
3. 用平台生成的公开访问地址作为黑客松 Demo URL。

适合平台：GitHub Pages、Vercel、Netlify、Cloudflare Pages、任意对象存储静态网站。

### 方式二：托管整个仓库

1. 将仓库推送到 GitHub。
2. 在托管平台中选择该仓库。
3. 构建命令填写：

```bash
npm run build:standalone
```

4. 输出目录填写：

```text
dist
```

5. 公开访问入口指向 `demo.html`。

## GitHub 更新流程

建议每次变更后执行：

```bash
npm run check
npm run build:standalone
git status
git add README.md PROJECT_GUIDE.md AGENTS.md src scripts dist package.json index.html
git commit -m "docs: update project guide"
git push fitbook master
```

提交前需要确认：

- 不提交 `note/`、`.env`、真实 API Key 或其他敏感资料。
- 如果改动了界面或流程，重新生成 `dist/demo.html`。
- 如果改动了部署、运行命令、文件结构或功能点，同步更新本文档。

## 本次更新内容

### 2026-05-11

- 新增 `PROJECT_GUIDE.md`，说明项目结构、本地运行、构建、部署和 GitHub 更新流程。
- 更新 `README.md`，加入完整项目说明文档入口。
- 更新 `AGENTS.md`，要求后续每次项目变更都同步维护 `PROJECT_GUIDE.md`。

## 后续更新维护规则

每次更新代码、页面、部署方式、脚本或数据结构后，都要检查并更新本文档对应部分：

- 文件新增、删除、移动：更新“文件结构”。
- 运行命令、构建命令或部署平台变化：更新“本地运行”“构建演示文件”“部署方式”。
- 新增功能或重要修复：更新“本次更新内容”。
- 涉及知乎 OpenAPI、密钥、发布、评论、点赞等能力：补充合规说明，并确认敏感信息不进入 Git。
