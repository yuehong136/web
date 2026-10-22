<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./.github/assets/readme/hero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./.github/assets/readme/hero-light.svg">
  <img alt="Multi-RAG — From knowledge to action. Connect knowledge, agents and applications." src="./.github/assets/readme/hero-light.svg" width="1280">
</picture>

<h1 align="center">Multi-RAG Frontend</h1>

<p align="center">
  An AI workspace for knowledge, conversations and agent workflows.<br>
  Ingest documents. Inspect retrieval. Build agents. Share applications.
</p>

<p align="center">
  <a href="https://github.com/yuehong136/web/actions/workflows/ci.yml"><img src="https://github.com/yuehong136/web/actions/workflows/ci.yml/badge.svg?branch=master" alt="CI on master"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-2563eb?style=flat-square" alt="Apache 2.0 license"></a>
  <a href="./package.json"><img src="https://img.shields.io/badge/React-19-149eca?style=flat-square" alt="React 19"></a>
  <a href="./package.json"><img src="https://img.shields.io/badge/TypeScript-7-3178c6?style=flat-square" alt="TypeScript 7"></a>
  <a href="./package.json"><img src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square" alt="Vite 8"></a>
</p>

<p align="center">
  <strong>English</strong> · <a href="./README_zh.md">简体中文</a>
</p>

<p align="center">
  <a href="#capabilities">Features</a> ·
  <a href="#quick-start">Quick&nbsp;start</a> ·
  <a href="#development">Develop</a> ·
  <a href="#documentation">Docs</a> ·
  <a href="#contributing">Contribute</a>
</p>

---

Multi-RAG brings document knowledge, retrieval, chat and visual agent orchestration into one interface. This repository contains the **React frontend** for the [MultiRAG backend](https://github.com/yuehong136/MultiRAG), with shared light/dark themes and English/Chinese interfaces.

> **Start with Web.** The browser application is the primary product. The Electron desktop foundation is an internal preview; its release boundaries are documented [below](#desktop-preview).

## Capabilities

| Knowledge & retrieval                                                                                                                                          | Agents & workflows                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Import documents, configure parsing and chunking, inspect chunks, and test retrieval with document and metadata filters.                                       | Build agents and pipelines on a visual canvas, configure variables and structured output, and inspect execution and logs.             |
| **Conversations & Studio**                                                                                                                                     | **Skills & MCP**                                                                                                                      |
| Configure prompts, models and knowledge sources alongside test chat. Stream answers with citations, tool output, retrieval progress and collapsible reasoning. | Browse skill spaces, packages and files. Configure MCP servers, discover and test tools, and manage batch operations.                 |
| **Share & embed**                                                                                                                                              | **Workspace administration**                                                                                                          |
| Share agents as standalone pages or iframe widgets, with scoped themes, language selection, uploads and runtime attachments.                                   | Manage model providers, data sources, memory, teams, environments and API keys, plus server-defined channel connections and bindings. |

The knowledge workbench also exposes parent/child chunking, metadata templates, embedding compatibility checks, table column indexing/metadata roles, and GraphRAG configuration including local NER extraction. Parsing, indexing, model execution and available integrations depend on the connected backend and its configured providers.

<details>
<summary><strong>See Studio in light and dark themes</strong></summary>

<br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/acceptance/studio-editor-refinement-20261007/06-preview-zh-dark.jpg">
  <source media="(prefers-color-scheme: light)" srcset="./docs/acceptance/studio-editor-refinement-20261007/03-preview-light.jpg">
  <img alt="Studio with instructions on the left and a test conversation on the right" src="./docs/acceptance/studio-editor-refinement-20261007/03-preview-light.jpg" width="1004" loading="lazy">
</picture>

Existing acceptance screenshots from 2026-10-07, using a sample data-analysis conversation. See the [Studio acceptance record](./docs/acceptance/studio-editor-refinement-20261007.md) for context.

</details>

## Quick start

### 1. Prepare the environment

- **Node.js 24**, selected by [`.nvmrc`](./.nvmrc); use the npm version declared in [`package.json`](./package.json) (`packageManager`).
- A running, compatible **MultiRAG backend** and an account on that backend. This repository starts the frontend; models, storage and execution services run on the backend.

```bash
git clone https://github.com/yuehong136/web.git
cd web
npm ci
cp .env.example .env.local
```

### 2. Connect your backend

Edit `.env.local` to match your services. These are the defaults from [`.env.example`](./.env.example):

```dotenv
VITE_API_BASE_URL=http://localhost:8000
VITE_ADMIN_API_BASE_URL=http://localhost:8130
VITE_WS_BASE_URL=ws://localhost:8000
VITE_SKILLS_API_PROTOCOL=multirag-assets-v1
```

`VITE_SKILLS_API_PROTOCOL` selects the backend contract: `multirag-assets-v1` or `ragflow-skills-v1`. Set it to the contract your backend exposes; selection is explicit, with no automatic fallback. Other options are listed in [`.env.example`](./.env.example).

All `VITE_*` values are visible in the browser bundle. Configure provider secrets on the backend. Restart the dev server after changing environment values; production endpoint changes require rebuilding.

### 3. Open the workspace

```bash
npm run dev
```

Open [localhost:5173](http://localhost:5173), sign in, then create a knowledge base, configure a model, or open Studio to build an application. Use `npm run dev:host` for LAN testing.

<details>
<summary><strong>Build and preview the Web application</strong></summary>

```bash
npm run build
npm run preview
```

`build` runs the full Web TypeScript check and creates `dist/`. API endpoints are selected at build time. Use a compatible backend and configure the hosting environment's API routing and SPA fallback before deploying.

</details>

## Development

### Stack

| Area                    | Building blocks                                                           |
| ----------------------- | ------------------------------------------------------------------------- |
| Application             | React 19 · TypeScript 7 (strict) · Vite 8 · React Router                  |
| State & transport       | TanStack Query · Zustand · shared API client · SSE / `eventsource-parser` |
| Interface               | Tailwind CSS 4 · Radix UI · semantic design tokens · Lucide               |
| AI surfaces             | Ant Design X / XMarkdown · XYFlow · AntV G6 · Monaco · Lexical            |
| Content                 | Document previews · KaTeX · Mermaid · Recharts · DOMPurify                |
| Language & verification | i18next · Node test / tsx · Vitest · ESLint                               |
| Desktop preview         | Electron · Rolldown · typed preload bridge                                |

Exact versions and the complete dependency list live in [`package.json`](./package.json) and [`package-lock.json`](./package-lock.json).

### Everyday commands

| Command                     | Purpose                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| `npm run dev`               | Start the local Vite server                                               |
| `npm run build`             | Full Web type check and production build                                  |
| `npm run lint`              | Lint application source                                                   |
| `npm run test:unit`         | Run all source and tooling unit tests                                     |
| `npm run test:ci`           | Validate the test inventory and run all source, tooling and desktop tests |
| `npm run build:themes`      | Regenerate theme CSS and token outputs                                    |
| `npm run build:analyze`     | Build with a bundle treemap; keep `stats.html` out of deployments         |
| `npm run check:bundle-size` | Check bundle budgets after a build                                        |

For focused API, streaming, Agent, security and desktop checks, use the [verification matrix](./docs/agent-guidance/verification.md#scope). Full Web type checking is part of `build`; there are no bare `test`, `typecheck` or `format` scripts.

### Repository map

```text
src/
├── api/              Domain API clients and contract normalization
├── components/       UI primitives → patterns → page templates
├── entrypoints/      Web/Desktop composition and shared mount
├── hooks/            Queries, mutations and shared behavior
├── lib/              Streaming runtime, commands and domain helpers
├── locales/          English and Simplified Chinese resources
├── pages/            Knowledge, agents, Studio, Skills, settings…
├── platform/         Browser-safe platform contracts and adapters
├── stores/           Client state and UI preferences
└── themes/           Semantic tokens, generators and scoped themes
desktop/              Electron shell, bridge, build and contract tests
docs/                 Architecture, guidance, roadmap and acceptance
scripts/              Test inventory, file-size and bundle checks
```

Business flows live in pages and feature containers; shared UI follows `ui → patterns → page-templates`. TanStack Query owns server state, Zustand owns UI state, and stream chunks stay outside the Query cache. HTML and embedded content pass through sanitization or sandbox boundaries. Implementation rules live in [`AGENTS.md`](./AGENTS.md) and the [topic guides](./docs/agent-guidance/frontend.md).

## Desktop preview

The Electron foundation shares the Web renderer and adds a task-oriented Workbench, a command palette, native menus and a typed sandboxed preload bridge. It remains **an internal, non-release preview**. Desktop-native authentication hardening, durable Run recovery, auto-update, a local Host and verified Windows packaging/signing are still outside the delivered foundation.

For local builds and platform limitations, follow [`desktop/README.md`](./desktop/README.md). Architecture and the staged roadmap live in the [Client Platform documentation](./docs/client-platform/README.md).

## Documentation

| Start here                                                                                                            | What you will find                                                  |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [Engineering roadmap](./docs/engineering-modernization-roadmap.md)                                                    | Current engineering work and its delivery status                    |
| [Agent instructions](./AGENTS.md)                                                                                     | The single entry point for repository rules; `CLAUDE.md` imports it |
| [Frontend guidance](./docs/agent-guidance/frontend.md)                                                                | Organization, UI and internationalization                           |
| [Runtime guidance](./docs/agent-guidance/runtime.md)                                                                  | Data, streaming, embedding, security and client boundaries          |
| [Verification & builds](./docs/agent-guidance/verification.md)                                                        | Checks selected by change scope and CI commands                     |
| [Theme development](./src/themes/development-guide.md)                                                                | Design tokens, generated styles and component theming               |
| [Knowledge settings](./src/pages/knowledge/settings/README.md) · [Metadata](./src/pages/knowledge/metadata/README.md) | Parsing, GraphRAG and metadata configuration contracts              |
| [Client Platform](./docs/client-platform/README.md)                                                                   | Web/Desktop architecture, contracts and release boundaries          |
| [Team handbook](./AI前端技术栈开发规范.md)                                                                            | Rationale and examples behind the rules                             |

## Contributing

Bug reports, focused fixes, documentation and translations are welcome via [Issues](https://github.com/yuehong136/web/issues) and [pull requests](https://github.com/yuehong136/web/pulls).

1. Read [`AGENTS.md`](./AGENTS.md) and the topic guide for your change.
2. Keep the patch focused, reuse shared UI and tokens, and update both English and Chinese product copy.
3. Run the checks required by the [verification matrix](./docs/agent-guidance/verification.md#scope). Include actual results and any unverified boundaries in the PR; include light/dark screenshots for UI changes.
4. Use Conventional Commits, such as `feat(knowledge): ...` or `docs: ...`.

Browser targets are defined in [`package.json`](./package.json): Chrome/Edge 111+, Firefox 128+, Safari 16.4+.

## License

[Apache License 2.0](./LICENSE) · Multi-RAG Frontend contributors.
