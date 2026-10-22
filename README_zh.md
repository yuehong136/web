<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./.github/assets/readme/hero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./.github/assets/readme/hero-light.svg">
  <img alt="Multi-RAG — 从知识到行动，连接知识、智能体与应用。" src="./.github/assets/readme/hero-light.svg" width="1280">
</picture>

<h1 align="center">Multi-RAG Frontend</h1>

<p align="center">
  面向知识、对话与智能体工作流的 AI 工作空间。<br>
  导入文档，验证检索，编排智能体，将应用分享给更多人。
</p>

<p align="center">
  <a href="https://github.com/yuehong136/web/actions/workflows/ci.yml"><img src="https://github.com/yuehong136/web/actions/workflows/ci.yml/badge.svg?branch=master" alt="master 分支 CI 状态"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-2563eb?style=flat-square" alt="Apache 2.0 许可证"></a>
  <a href="./package.json"><img src="https://img.shields.io/badge/React-19-149eca?style=flat-square" alt="React 19"></a>
  <a href="./package.json"><img src="https://img.shields.io/badge/TypeScript-7-3178c6?style=flat-square" alt="TypeScript 7"></a>
  <a href="./package.json"><img src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square" alt="Vite 8"></a>
</p>

<p align="center">
  <a href="./README.md">English</a> · <strong>简体中文</strong>
</p>

<p align="center">
  <a href="#capabilities">能力</a> ·
  <a href="#quick-start">快速开始</a> ·
  <a href="#development">开发</a> ·
  <a href="#documentation">文档</a> ·
  <a href="#contributing">贡献</a>
</p>

---

Multi-RAG 将文档知识、检索、对话和可视化智能体编排整合在同一个界面中。本仓库是 [MultiRAG 后端](https://github.com/yuehong136/MultiRAG) 的 **React 前端**，提供统一的明暗主题与中英文界面。

> **从 Web 开始。** 浏览器应用是当前主产品。Electron 桌面基础仍为内部预览，发布边界见[桌面预览](#desktop-preview)。

<a id="capabilities"></a>

## 核心能力

| 知识与检索                                                                                         | 智能体与工作流                                                                                |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 导入文档，配置解析与分块，审阅切片，结合文档范围和元数据筛选验证检索效果。                         | 在可视化画布上编排 Agent 与 Pipeline，配置变量和结构化输出，查看执行过程与日志。              |
| **对话与 Studio**                                                                                  | **Skills 与 MCP**                                                                             |
| 在试聊旁配置提示词、模型和知识来源；流式展示回答、引用与工具输出，区分检索进度和可折叠的思考过程。 | 浏览技能空间、技能包与文件；配置 MCP 服务器，发现和测试工具，管理批量操作。                   |
| **分享与嵌入**                                                                                     | **工作空间管理**                                                                              |
| 通过独立页面或 iframe widget 分享智能体，支持作用域主题、语言选择、文件上传与运行时附件。          | 管理模型供应商、数据源、记忆库、团队、环境变量与 API 密钥，以及由服务端定义的渠道连接与绑定。 |

知识工作台还提供父子分块、元数据模板、嵌入模型兼容性检查、表格列索引/元数据角色，以及包含本地 NER 抽取方式的 GraphRAG 配置。解析、索引、模型执行与具体集成能力取决于所连接的后端及其供应商配置。

<details>
<summary><strong>查看 Studio 的明暗主题</strong></summary>

<br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/acceptance/studio-editor-refinement-20261007/06-preview-zh-dark.jpg">
  <source media="(prefers-color-scheme: light)" srcset="./docs/acceptance/studio-editor-refinement-20261007/03-preview-light.jpg">
  <img alt="Studio 左侧编辑应用指令，右侧通过试聊验证配置" src="./docs/acceptance/studio-editor-refinement-20261007/03-preview-light.jpg" width="1004" loading="lazy">
</picture>

复用 2026-10-07 的验收截图，内容为示例数据分析对话。背景与验证范围见 [Studio 验收记录](./docs/acceptance/studio-editor-refinement-20261007.md)。

</details>

<a id="quick-start"></a>

## 快速开始

### 1. 准备环境

- **Node.js 24**，由 [`.nvmrc`](./.nvmrc) 选择；npm 使用 [`package.json`](./package.json) 中 `packageManager` 声明的版本。
- 已运行且版本兼容的 **MultiRAG 后端**，以及该后端的登录账号。本仓库启动前端；模型、存储和执行服务由后端提供。

```bash
git clone https://github.com/yuehong136/web.git
cd web
npm ci
cp .env.example .env.local
```

### 2. 连接后端

编辑 `.env.local`，将地址改为实际服务地址。以下为 [`.env.example`](./.env.example) 的默认配置：

```dotenv
VITE_API_BASE_URL=http://localhost:8000
VITE_ADMIN_API_BASE_URL=http://localhost:8130
VITE_WS_BASE_URL=ws://localhost:8000
VITE_SKILLS_API_PROTOCOL=multirag-assets-v1
```

`VITE_SKILLS_API_PROTOCOL` 显式选择后端技能合同，可选 `multirag-assets-v1` 或 `ragflow-skills-v1`。请与后端暴露的协议保持一致，不会自动回退。其他配置见 [`.env.example`](./.env.example)。

所有 `VITE_*` 值都会暴露在浏览器构建产物中。供应商密钥应配置在后端。修改环境变量后重启开发服务；生产环境变更接口地址需要重新构建。

### 3. 打开工作空间

```bash
npm run dev
```

访问 [localhost:5173](http://localhost:5173)，登录后可创建知识库、配置模型，或进入 Studio 构建应用。局域网联调使用 `npm run dev:host`。

<details>
<summary><strong>构建与预览 Web 应用</strong></summary>

```bash
npm run build
npm run preview
```

`build` 执行完整 Web TypeScript 检查并生成 `dist/`。API 地址在构建时确定；部署前需准备兼容后端，并在托管环境配置 API 路由与 SPA 回退。

</details>

<a id="development"></a>

## 开发指南

### 技术栈

| 领域       | 主要组件                                                                |
| ---------- | ----------------------------------------------------------------------- |
| 应用       | React 19 · TypeScript 7（strict）· Vite 8 · React Router                |
| 状态与传输 | TanStack Query · Zustand · 共享 API 客户端 · SSE / `eventsource-parser` |
| 界面       | Tailwind CSS 4 · Radix UI · 语义化设计令牌 · Lucide                     |
| AI 交互    | Ant Design X / XMarkdown · XYFlow · AntV G6 · Monaco · Lexical          |
| 内容       | 文档预览 · KaTeX · Mermaid · Recharts · DOMPurify                       |
| 语言与验证 | i18next · Node test / tsx · Vitest · ESLint                             |
| 桌面预览   | Electron · Rolldown · 类型化 preload bridge                             |

精确版本与完整依赖以 [`package.json`](./package.json) 和 [`package-lock.json`](./package-lock.json) 为准。

### 常用命令

| 命令                        | 用途                                            |
| --------------------------- | ----------------------------------------------- |
| `npm run dev`               | 启动本机 Vite 开发服务器                        |
| `npm run build`             | 完整 Web 类型检查与生产构建                     |
| `npm run lint`              | 检查应用源码                                    |
| `npm run test:unit`         | 运行全部源码与工具单元测试                      |
| `npm run test:ci`           | 校验测试清单，运行源码、工具及桌面完整测试      |
| `npm run build:themes`      | 重新生成主题 CSS 与 token 产物                  |
| `npm run build:analyze`     | 构建并生成体积分析图；`stats.html` 不进入部署包 |
| `npm run check:bundle-size` | 构建后检查 bundle 预算                          |

API、流式运行时、Agent、安全与桌面等专项检查见[验证矩阵](./docs/agent-guidance/verification.md#scope)。完整 Web 类型检查包含在 `build` 中；没有裸 `test`、`typecheck` 或 `format` 脚本。

### 目录导览

```text
src/
├── api/              领域 API 客户端与合同归一化
├── components/       UI 原语 → 结构块 → 页面模板
├── entrypoints/      Web/Desktop 组合入口与共享挂载层
├── hooks/            查询、变更与共享行为
├── lib/              流式运行时、命令系统与领域工具
├── locales/          英文与简体中文资源
├── pages/            知识库、智能体、Studio、Skills、设置等
├── platform/         浏览器安全的平台合同与适配器
├── stores/           客户端状态与 UI 偏好
└── themes/           语义令牌、生成器与作用域主题
desktop/              Electron 壳、bridge、构建与合同测试
docs/                 架构、规范、路线图与验收记录
scripts/              测试清单、文件大小与 bundle 检查
```

业务流程留在页面与 feature 容器中，共享 UI 遵循 `ui → patterns → page-templates`。TanStack Query 管服务器状态，Zustand 管 UI 状态，流式 chunk 不写入 Query cache。HTML 和嵌入内容通过净化或沙箱边界处理。实现规则见 [`AGENTS.md`](./AGENTS.md) 与[专题指南](./docs/agent-guidance/frontend.md)。

<a id="desktop-preview"></a>

## 桌面预览

Electron 基础复用 Web renderer，提供任务导向的 Workbench、命令面板、原生菜单与类型化沙箱 preload bridge，目前仍为**内部非发布预览**。桌面原生认证加固、durable Run 恢复、自动更新、本地 Host，以及 Windows 打包/签名实测，仍不属于已交付基础。

本地构建与平台限制见 [`desktop/README.md`](./desktop/README.md)，架构和分阶段路线见 [Client Platform 文档](./docs/client-platform/README.md)。

<a id="documentation"></a>

## 文档导航

| 入口                                                                                                        | 内容                                       |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [工程路线图](./docs/engineering-modernization-roadmap.md)                                                   | 当前工程工作与交付状态                     |
| [Agent 编码规则](./AGENTS.md)                                                                               | 仓库规则唯一入口；`CLAUDE.md` 仅导入此文件 |
| [前端专题](./docs/agent-guidance/frontend.md)                                                               | 目录组织、UI 与国际化                      |
| [运行时专题](./docs/agent-guidance/runtime.md)                                                              | 数据、流式交互、嵌入、安全与客户端边界     |
| [验证与构建](./docs/agent-guidance/verification.md)                                                         | 按改动范围选择检查及 CI 命令               |
| [主题开发](./src/themes/development-guide.md)                                                               | 设计令牌、样式生成与组件主题               |
| [知识库设置](./src/pages/knowledge/settings/README.md) · [元数据](./src/pages/knowledge/metadata/README.md) | 解析、GraphRAG 与元数据配置合同            |
| [Client Platform](./docs/client-platform/README.md)                                                         | Web/Desktop 架构、合同与发布边界           |
| [团队手册](./AI前端技术栈开发规范.md)                                                                       | 规则背后的理由与示例                       |

<a id="contributing"></a>

## 参与贡献

欢迎通过 [Issues](https://github.com/yuehong136/web/issues) 和 [Pull Requests](https://github.com/yuehong136/web/pulls) 提交可复现的问题、聚焦的修复、文档与翻译。

1. 阅读 [`AGENTS.md`](./AGENTS.md) 及本次修改对应的专题指南。
2. 保持改动聚焦，复用共享组件和设计令牌，产品文案同步中英文。
3. 按[验证矩阵](./docs/agent-guidance/verification.md#scope)执行相关检查，在 PR 中记录实际结果与未验证边界；UI 变更附明暗主题截图。
4. 使用 Conventional Commits，例如 `feat(knowledge): ...` 或 `docs: ...`。

浏览器目标以 [`package.json`](./package.json) 为准：Chrome/Edge 111+、Firefox 128+、Safari 16.4+。

## 许可证

[Apache License 2.0](./LICENSE) · Multi-RAG Frontend contributors。
