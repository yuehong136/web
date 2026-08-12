# Multi-RAG Frontend

Enterprise-grade React frontend for the Multi-RAG platform: intelligent conversation, knowledge bases, agent / pipeline orchestration, embeddable agent share widget, MCP server integration, and system administration.

> 中文文档：[`README_zh.md`](./README_zh.md)

## Documentation Map

This README is the project front door — it intentionally stays short. The authoritative documentation lives elsewhere:

- **[`CLAUDE.md`](./CLAUDE.md)** — mandatory rules for AI coding agents (English)
- **[`AGENTS.md`](./AGENTS.md)** — same rules in Chinese, for Cursor / other agent tools
- **[`AI前端技术栈开发规范.md`](./AI前端技术栈开发规范.md)** — full team handbook (Chinese, the _why_ behind every rule)
- **`src/themes/{design-system,development-guide,migration-guide}.md`** — design token system specifics
- **`docs/agent-frontend-rewrite-plan.md`** & **`docs/agent-capability-completion-roadmap.md`** — agent program roadmap
- **`docs/agent-t1` … `agent-t10` summaries** — landed capabilities per phase
- **`docs/agent-share-*-guide.md`** — agent share widget integration
- **[`docs/client-platform/README.md`](./docs/client-platform/README.md)** — Web/Desktop client-platform architecture, contracts, roadmap, and security baseline

## What's New (2026-Q2)

- **Agent Share Widget** — embeddable agent surface with scoped theming, multi-file uploads, downloadable runtime attachments, and typed `postMessage` envelope
- **Runtime / Pipeline / Log Workbench** — first-class workbenches for running, debugging, and observing agents and pipelines (T4 / T6 / T8)
- **Structured Output & Advanced Variables** — formalized variable scopes and structured output builder (T10)
- **Explore Formalization** — agent explore mode promoted from prototype to product surface (T9)
- **Page Skeleton System** — 6 page templates (Console / Workspace / Studio / Studio Tri-Pane / Split Detail / List) and a shared `patterns/` block library replace ad-hoc page shells
- **Design Token System** — ~1,452 semantic tokens with light/dark generated CSS, plus scoped theming for embedded surfaces
- **i18n** — full `react-i18next` integration with per-feature namespaces (`en-US`, `zh-CN`)
- **@ant-design/x 2.7** — modern chat UI primitives (`x`, `x-card`, `x-markdown`, `x-sdk`)
- **MCP Integration** — server management, tool discovery, batch operations, and MCP-aware chat

## Core Features

- **Intelligent Conversation** — streaming chat with tool calling, structured output, MCP tools, and inline source references
- **Knowledge Base** — multi-format ingest (PDF / DOCX / XLSX / PPTX / legal / audio / image), specialized parsers, vector search with chunk visualization, batch operations
- **Agent Studio** — visual canvas (xyflow + AntV G6), node-based pipeline builder, runtime workbench, log/observability workbench, share/publish/webhook
- **Agent Share Widget** — embed any agent into a third-party site via iframe with scoped theming and typed messaging
- **MCP Servers** — configure, test, and monitor Model Context Protocol servers; batch tool operations
- **AI Tools** — auto-fill workbench with document integration
- **System & Admin** — environment management with `{{var}}` template substitution, API key management with OpenAPI docs, monitoring dashboards, team management

## Tech Stack

| Layer             | Choice                                                                        | Version     |
| ----------------- | ----------------------------------------------------------------------------- | ----------- |
| Framework         | React                                                                         | 19.1        |
| Language          | TypeScript (strict)                                                           | 5.8         |
| Build             | Vite                                                                          | 8.0         |
| Routing           | react-router-dom                                                              | 7.7         |
| Server state      | TanStack Query                                                                | 5.83        |
| Client state      | Zustand                                                                       | 5.0         |
| Styling           | Tailwind CSS + semantic tokens                                                | 3.4         |
| UI primitives     | Radix UI (16 packages)                                                        | 1.1 – 2.2   |
| Chat UI           | @ant-design/x suite                                                           | 2.7         |
| Forms             | react-hook-form + zod                                                         | 7.60 / 4.0  |
| Icons             | lucide-react (only allowed)                                                   | 0.525       |
| Canvas            | @xyflow/react / @antv/g6                                                      | 12.9 / 5.0  |
| Editors           | @monaco-editor/react, @lexical/react                                          | 4.7 / 0.40  |
| Markdown          | react-markdown + markdown-it + remark-gfm + mathjax3                          | —           |
| Streaming         | eventsource-parser                                                            | 3.0         |
| Drag & drop       | @dnd-kit/core + sortable + utilities                                          | —           |
| Doc preview       | docx-preview, pptx-preview, mammoth, @js-preview/excel, react-pdf-highlighter | —           |
| Charts / Diagrams | recharts / mermaid                                                            | 3.1 / 11.12 |
| Sanitization      | DOMPurify                                                                     | 3.3         |
| i18n              | react-i18next + i18next + browser-languagedetector                            | 16.5 / 25.8 |

Full list lives in `package.json`.

## Project Layout

```
src/
├── api/              # Domain-split API clients
├── components/
│   ├── ui/           # 65+ Radix-based primitives (+ vendor adapters)
│   ├── patterns/     # Page structure blocks (PageHeader, page-states, SettingsRail, StatCard, ...)
│   ├── page-templates/ # 6 page skeletons
│   ├── layout/       # AppShell + Layout
│   └── auth, canvas, chat, dynamic-form, environment, feature, forms,
│       jsonjoy-builder, knowledge, mcp, memory, prompt-editor, studio
├── pages/            # Route modules (~20 top-level features incl. agent, knowledge, studio, mcp-servers, ...)
├── hooks/            # TanStack Query hooks (use-*-request.ts) and cross-page hooks
├── stores/           # 13 Zustand stores (auth, ui, chat, conversation, knowledge, model,
│                     #   environmentStore, home, search, studio, team, memory)
├── themes/           # tokens.ts (~1,452 tokens), generators, scoped-theme.tsx + design docs
├── types/            # Global TypeScript types
├── lib/              # Domain helpers, runtime utilities, adapters
├── locales/          # i18n: en-US/, zh-CN/
└── assets/
```

For the _why_ behind this layout (page-skeleton four-layer rule, presentational/container split, file-size limits), see `AI前端技术栈开发规范.md` and `AGENTS.md`.

The staged client-platform target layout is documented separately in [`docs/client-platform/REPOSITORY_LAYOUT.md`](./docs/client-platform/REPOSITORY_LAYOUT.md); the repository is still a pure Web application today.

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+

### Setup

```bash
git clone <repository-url>
cd web
npm install
cp .env.example .env.local        # then edit
npm run dev                        # http://localhost:5173
npm run dev:host                   # optional: expose as 0.0.0.0 for LAN testing
```

### Scripts

```bash
npm run dev             # Vite dev server, localhost-only by default (5173)
npm run dev:host        # Bind 0.0.0.0 for LAN testing
npm run build           # tsc -b && vite build
npm run build:analyze   # Generate dist/stats.html bundle treemap (do not deploy)
npm run preview         # Preview production build
npm run lint            # eslint src
npm run lint:all        # eslint .
npm run lint:typed      # Type-aware lint for Agent critical directories
npm run typecheck:agent-strict # Strict type check for Agent critical directories
npm run build:themes    # Regenerate themes/{light,dark}.css after tokens.ts changes
npm run test:agent-t1   # Run agent T1 tests via tsx --test
```

There is no generic `test`, `format`, or `typecheck` script today. Type checking happens inside `npm run build`, with stricter Agent-slice checks available via `npm run typecheck:agent-strict`. Formatting is handled by Prettier + lint-staged for staged files only; do not run a whole-repo format pass. Existing formal tests run via `tsx --test`; Vitest baseline config exists for future additions/migration.

### Environment

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

Browser-exposed env vars must use the `VITE_*` prefix. Never inline secrets.

## Architecture Highlights

- **Four-layer page skeleton** — `ui/` → `patterns/` → `page-templates/` → `pages/`. New pages must pick a template; never invent a new full-page shell.
- **Server / client state separation** — TanStack Query owns server state, Zustand owns UI state; streaming chunks live in transient store fields, not in Query cache.
- **Semantic design tokens only** — no `bg-white`, `text-gray-*`, no arbitrary values. Dark mode is automatic; never use `dark:` prefixes.
- **Streaming-first** — SSE via `eventsource-parser`, AbortController per stream, `aria-live` on streamed text, no focus-stealing while `aria-busy`.
- **Generative UI** — structured output and tool-call payloads render through registries in `pages/agent/operators/` and `adapters/`, not via per-page `switch`.
- **Embeddable widget** — agent share surface supports iframe embedding with scoped theming and typed `postMessage`.
- **MCP-aware** — MCP servers, tools, and batch operations are first-class; side-effecting tool calls require UI confirmation.
- **i18n by default** — every user-visible string goes through `react-i18next` namespaces.

## Contributing

1. Fork & branch: `feature/*`, `fix/*`, `refactor/*`, `docs/*`, `perf/*`, `chore/*`
2. Read `AGENTS.md` (the rules) and `AI前端技术栈开发规范.md` (the why)
3. Before pushing: `npm run lint && npm run build`; for Agent serializers/adapters/operators also run `npm run lint:typed && npm run typecheck:agent-strict && npm run test:agent-t1`
4. PR description must include both light/dark theme screenshots for any UI change
5. Use [Conventional Commits](https://www.conventionalcommits.org/): `feat`, `fix`, `docs`, `refactor`, `chore`, `perf`, `test`, `style` (with optional scope)

## Browser Support

Chrome/Edge 111+, Firefox 114+, and Safari 16.4+.

## License

Licensed under the [Apache License 2.0](./LICENSE).

---

**Version**: 0.9.8 — built with React 19 · TypeScript 5.8 · Vite 8
