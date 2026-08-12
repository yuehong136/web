# Multi-RAG Frontend

Multi-RAG 平台的企业级 React 前端，并已加入早期 Electron 安全壳构建基线：智能对话、知识库管理、Agent / Pipeline 编排、可外嵌的 Agent Share Widget、MCP 服务器集成、系统管理。

> English: [`README.md`](./README.md)

## 文档地图

本 README 是项目门面，刻意保持精简。规范与细节在以下文档：

- **[`CLAUDE.md`](./CLAUDE.md)** — AI 编码工具的强约束规范（英文）
- **[`AGENTS.md`](./AGENTS.md)** — 同上的中文版，给 Cursor / 其他 Agent 工具
- **[`AI前端技术栈开发规范.md`](./AI前端技术栈开发规范.md)** — 团队详尽手册（中文，每条规则**为什么**这么定）
- **`src/themes/{design-system,development-guide,migration-guide}.md`** — 设计令牌系统细节
- **`docs/agent-frontend-rewrite-plan.md`** 与 **`docs/agent-capability-completion-roadmap.md`** — Agent 计划与能力路线
- **`docs/agent-t1` … `agent-t10` summaries** — 各阶段落地纪要
- **`docs/agent-share-*-guide.md`** — Agent Share widget 集成
- **[`docs/client-platform/README.md`](./docs/client-platform/README.md)** — Web/Desktop 客户端平台的架构、契约、路线与安全基线

## 最新进展（2026 Q2）

- **Agent Share Widget** — 可外嵌的 Agent 表面，含作用域主题、多文件上传、运行时附件下载、类型化 `postMessage` envelope
- **Runtime / Pipeline / Log 工作台** — 运行、调试、观测的一等公民工作台（T4 / T6 / T8）
- **结构化输出与高级变量** — 变量作用域形式化与结构化输出 builder（T10）
- **Explore 正式化** — Agent explore 从原型升级为正式产品表面（T9）
- **页面骨架系统** — 6 个页面模板（Console / Workspace / Studio / Studio Tri-Pane / Split Detail / List）与共享 `patterns/` 块库取代散写的整页壳层
- **设计令牌系统** — 约 1452 个语义化 token，明暗 CSS 自动生成，外嵌表面支持作用域主题
- **国际化** — 全量 `react-i18next`，按 feature 分 namespace（`en-US`、`zh-CN`）
- **@ant-design/x 2.7** — 现代化聊天 UI 原语（`x`、`x-card`、`x-markdown`、`x-sdk`）
- **MCP 集成** — 服务器管理、工具发现、批量操作，以及 MCP 感知的聊天

## 核心能力

- **智能对话** — 流式聊天 + Tool calling + 结构化输出 + MCP 工具 + 内联源引用
- **知识库** — 多格式入库（PDF / DOCX / XLSX / PPTX / 法律 / 音频 / 图像）、专业解析器、向量检索 + 文档块可视化、批量操作
- **Agent Studio** — 可视化画布（xyflow + AntV G6）、节点式 pipeline 构建、运行时工作台、日志/观测工作台、share/publish/webhook
- **Agent Share Widget** — 任意 Agent 通过 iframe 外嵌到第三方站点，作用域主题 + 类型化消息
- **MCP 服务器** — 配置、测试、监控 MCP 服务器；工具批量操作
- **AI 工具** — 自动填充工作台与文档集成
- **系统与管理** — 环境变量管理（含 `{{var}}` 模板替换）、API 密钥管理 + OpenAPI 文档、监控仪表板、团队管理

## 技术栈

| 层            | 选型                                                                          | 版本        |
| ------------- | ----------------------------------------------------------------------------- | ----------- |
| 框架          | React                                                                         | 19.1        |
| 语言          | TypeScript（strict）                                                          | 5.8         |
| 构建          | Vite                                                                          | 8.0         |
| 路由          | react-router-dom                                                              | 7.7         |
| 服务器状态    | TanStack Query                                                                | 5.83        |
| 客户端状态    | Zustand                                                                       | 5.0         |
| 样式          | Tailwind CSS + 语义化 token                                                   | 3.4         |
| 原子组件      | Radix UI（16 个包）                                                           | 1.1 – 2.2   |
| 聊天 UI       | @ant-design/x 套件                                                            | 2.7         |
| 表单          | react-hook-form + zod                                                         | 7.60 / 4.0  |
| 图标          | lucide-react（**唯一**）                                                      | 0.525       |
| 画布          | @xyflow/react / @antv/g6                                                      | 12.9 / 5.0  |
| 编辑器        | @monaco-editor/react、@lexical/react                                          | 4.7 / 0.40  |
| Markdown      | react-markdown + markdown-it + remark-gfm + mathjax3                          | —           |
| 流式          | eventsource-parser                                                            | 3.0         |
| 拖拽          | @dnd-kit/core + sortable + utilities                                          | —           |
| 文档预览      | docx-preview、pptx-preview、mammoth、@js-preview/excel、react-pdf-highlighter | —           |
| 图表 / 流程图 | recharts / mermaid                                                            | 3.1 / 11.12 |
| 净化          | DOMPurify                                                                     | 3.3         |
| 国际化        | react-i18next + i18next + browser-languagedetector                            | 16.5 / 25.8 |
| 桌面安全壳    | Electron + Rolldown 独立构建 main/preload                                     | 43.4 / 1.2  |

完整依赖见 `package.json`。

## 目录结构

```
src/
├── api/              # 按领域拆分的 API 客户端
├── components/
│   ├── ui/           # 65+ 原子组件（Radix 封装，含 vendor 适配）
│   ├── patterns/     # 页面结构块（PageHeader、page-states、SettingsRail、StatCard …）
│   ├── page-templates/ # 6 个页面骨架
│   ├── layout/       # AppShell + Layout
│   └── auth, canvas, chat, dynamic-form, environment, feature, forms,
│       jsonjoy-builder, knowledge, mcp, memory, prompt-editor, studio
├── pages/            # 路由模块（约 20 个顶层 feature，含 agent、knowledge、studio、mcp-servers …）
├── hooks/            # TanStack Query hooks（use-*-request.ts）+ 跨页面 hooks
├── stores/           # 13 个 Zustand stores（auth、ui、chat、conversation、knowledge、model、
│                     #   environmentStore、home、search、studio、team、memory）
├── themes/           # tokens.ts（约 1452 个）、生成器、scoped-theme.tsx + 设计文档
├── types/            # 全局类型
├── lib/              # 领域工具、运行时工具、adapters
├── locales/          # i18n：en-US/、zh-CN/
└── assets/
desktop/
├── electron/         # DESK0 main + sandboxed preload；尚无产品认证/Run/更新
├── protocol/         # 最小、类型化 Renderer Bridge
├── build/            # Rolldown、allowlist staging、electron-builder、产物验证
├── tests/            # main/preload/协议/打包合同测试
└── .out/             # 构建、staging 与 artifact 产物（gitignored）
```

为什么这样分层（四层骨架、展示/容器分离、文件大小红线），见 `AI前端技术栈开发规范.md` 与 `AGENTS.md`。

Web 应用仍是唯一生产产品，且保持独立构建与发布。`desktop/` 已有非发布态 `CLP-DESK0` 安全壳基线（Electron main/preload、`app://bundle/`、staging 与产物检查），但尚不提供认证、Shared `RunClient`、durable Run 恢复、自动更新、本地 Host，也没有 Windows 打包/签名实测。详见 [`docs/client-platform/README.md`](./docs/client-platform/README.md)。

## 快速开始

### 环境要求

- Node.js 22+
- npm 10+

### 安装

```bash
git clone <repository-url>
cd web
npm install
cp .env.example .env.local        # 然后编辑
npm run dev                        # http://localhost:5173
npm run dev:host                   # 可选：绑定 0.0.0.0 用于局域网联调
```

### 脚本

```bash
npm run dev             # Vite 开发服务器，默认仅本机访问（5173）
npm run dev:host        # 绑定 0.0.0.0，用于局域网联调
npm run build           # tsc -b && vite build
npm run build:analyze   # 生成 dist/stats.html bundle treemap（不部署）
npm run preview         # 预览生产构建
npm run lint            # eslint src
npm run lint:all        # eslint .
npm run lint:typed      # type-aware lint，先覆盖 Agent 关键目录
npm run typecheck:agent-strict # Agent 关键目录严格类型检查
npm run build:themes    # 修改 tokens.ts 后重新生成 themes/{light,dark}.css
npm run test:agent-t1   # 通过 tsx --test 运行 agent T1 测试
npm run lint:desktop    # 检查桌面壳/构建源码
npm run desktop:typecheck # 类型检查 Electron main 与 preload project
npm run test:desktop    # 运行桌面壳合同与打包测试
npm run desktop:build   # 使用 Rolldown 生成 main ESM 与 sandbox preload CJS
npm run desktop:stage   # 组装显式 allowlist 的桌面 staging app
npm run desktop:verify:stage # 验证 staging allowlist 与 build manifest
```

目前**没有**通用 `test`、`format`、`typecheck` 脚本。类型检查由 `npm run build` 完成，Agent 关键目录可补充跑 `npm run typecheck:agent-strict`。格式化通过 Prettier + lint-staged 作用于 staged 文件，不做全仓格式化。现有正式测试仍用 `tsx --test`，Vitest 基础配置已落地用于后续新增/迁移。

### 环境变量

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

浏览器侧环境变量必须 `VITE_*` 前缀。**不得**内联密钥。

## 架构亮点

- **四层页面骨架** — `ui/` → `patterns/` → `page-templates/` → `pages/`。新页面必须选模板，**不得**自造整页壳层。
- **服务器 / 客户端状态分离** — TanStack Query 管服务器状态，Zustand 管 UI 状态；流式 chunk 写在临时字段，**不进** Query cache。
- **仅用语义化 token** — 禁用 `bg-white`、`text-gray-*`、任意值。深色模式自动适配，禁用 `dark:` 前缀。
- **流式优先** — SSE 走 `eventsource-parser`，每条流自持 AbortController，流式文本加 `aria-live`，`aria-busy` 时不抢焦点。
- **生成式 UI** — 结构化输出与 tool-call 走 `pages/agent/operators/`、`adapters/` 注册表渲染，**不**写在页面 switch 里。
- **可外嵌 widget** — Agent Share 表面支持 iframe 外嵌，作用域主题 + 类型化 `postMessage`。
- **MCP 一等公民** — MCP 服务器、工具、批量操作均为产品级能力；有副作用的工具调用必须 UI 二次确认。
- **i18n 默认开** — 所有用户可见字符串走 `react-i18next` namespace。

## 贡献

1. Fork 与分支：`feature/*`、`fix/*`、`refactor/*`、`docs/*`、`perf/*`、`chore/*`
2. 读 `AGENTS.md`（规范）和 `AI前端技术栈开发规范.md`（为什么）
3. push 前：`npm run lint && npm run build`；接触 Agent serializer/adapter/operator 时补充 `npm run lint:typed && npm run typecheck:agent-strict && npm run test:agent-t1`
4. UI 改动 PR 必须附明暗双主题截图
5. 用 [Conventional Commits](https://www.conventionalcommits.org/)：`feat`、`fix`、`docs`、`refactor`、`chore`、`perf`、`test`、`style`（可选 scope）

## 浏览器支持

Chrome/Edge 111+、Firefox 114+、Safari 16.4+。

## 许可证

基于 [Apache License 2.0](./LICENSE) 开源。

---

**版本**：0.9.8 — 基于 React 19 · TypeScript 5.8 · Vite 8
