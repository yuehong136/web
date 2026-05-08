# CLAUDE.md

Mandatory rules for AI agents working in this repo. Project version: `0.9.8`. Sister doc in Chinese: `AGENTS.md`. Detailed handbook for humans: `AI前端技术栈开发规范.md`.

## Commands

```bash
npm run dev          # Vite dev server, localhost-only by default, port 5173
npm run dev:host     # Bind 0.0.0.0 for LAN testing
npm run build        # tsc -b && vite build
npm run build:analyze # Generate dist/stats.html bundle treemap (do not deploy)
npm run lint         # eslint src
npm run lint:all     # eslint .
npm run lint:typed   # Type-aware lint for Agent critical directories
npm run typecheck:agent-strict # Strict type check for Agent critical directories
npm run build:themes # Regenerate src/themes/{light,dark}.css after tokens.ts changes
npm run preview      # Preview production build
npm run test:agent-t1 # node --test runner via tsx (only formal test script today)
```

There is **no generic `test`, `format`, or `typecheck` npm script**. Full type checking happens inside `npm run build`; Agent critical directories also have `npm run typecheck:agent-strict`. Formatting is handled by Prettier + lint-staged for staged files only; do not format the whole repo. Existing formal tests still run with `tsx --test`; Vitest baseline config exists for future additions/migration. Do not introduce Jest.

## Stack (verified, 2026-05)

| Layer                      | Tool                                                                          | Version                      |
| -------------------------- | ----------------------------------------------------------------------------- | ---------------------------- |
| Framework                  | React                                                                         | 19.1                         |
| Language                   | TypeScript                                                                    | 5.8 (strict)                 |
| Build                      | Vite                                                                          | 7.3                          |
| Routing                    | react-router-dom                                                              | 7.7                          |
| Server state               | @tanstack/react-query                                                         | 5.83                         |
| Client state               | Zustand                                                                       | 5.0                          |
| Styling                    | Tailwind CSS                                                                  | 3.4 + semantic design tokens |
| Primitives                 | Radix UI (16 packages)                                                        | 1.1–2.2                      |
| Forms                      | react-hook-form + zod                                                         | 7.60 / 4.0                   |
| Icons                      | lucide-react (only allowed icon lib)                                          | 0.525                        |
| Chat UI                    | @ant-design/x + x-card + x-markdown + x-sdk                                   | 2.7                          |
| Graph canvas               | @xyflow/react / @antv/g6                                                      | 12.9 / 5.0                   |
| Editors                    | @monaco-editor/react, @lexical/react                                          | 4.7 / 0.40                   |
| Markdown                   | react-markdown + markdown-it + remark-gfm + mathjax3                          | —                            |
| Streaming                  | eventsource-parser                                                            | 3.0                          |
| Drag & drop                | @dnd-kit/core + sortable + utilities                                          | —                            |
| Doc preview                | docx-preview, pptx-preview, mammoth, @js-preview/excel, react-pdf-highlighter | —                            |
| Charts                     | recharts                                                                      | 3.1                          |
| Diagrams                   | mermaid                                                                       | 11.12                        |
| Sanitization               | DOMPurify                                                                     | 3.3                          |
| i18n                       | react-i18next + i18next + browser-languagedetector                            | 16.5 / 25.8                  |
| Toaster / Drawer / Command | sonner / vaul / cmdk                                                          | —                            |
| Resizable panels           | react-resizable-panels                                                        | 2.1                          |

`patch-package` runs on postinstall — when patches break, fix the patch, do not delete.

## Project Layout

```
src/
├── api/              # Domain-split API clients (agent, conversation, knowledge, search, system, ...)
├── components/
│   ├── ui/           # 65+ primitive UI components (Radix-based) + vendor/ for third-party adapters
│   ├── patterns/     # Page structure blocks (PageHeader, PageToolbar, page-states, SettingsRail, StatCard/Grid, ListPagination, SectionCard, StudioPanelShell)
│   ├── page-templates/ # Page skeletons (Console, Workspace, Studio, StudioTriPane, SplitDetail, List)
│   ├── layout/       # AppShell, Layout (route shell)
│   ├── auth/ canvas/ chat/ dynamic-form/ environment/ feature/ forms/
│   │ jsonjoy-builder/ knowledge/ mcp/ memory/ prompt-editor/ studio/
│   └── spotlight.tsx
├── pages/            # Route modules (agent, agents, ai-tools, auth, dashboard, dialog,
│                     # document-preview, documents, environment-demo, explore, home,
│                     # knowledge, mcp-servers, memory, search, settings, studio, system,
│                     # team, theme-demo, workflow)
├── hooks/            # TanStack Query hooks (use-*-request.ts) + cross-page hooks
├── stores/           # Zustand stores (auth, ui, chat, conversation, knowledge, model,
│                     # environmentStore, home, search, studio, team, memory)
├── themes/           # tokens.ts (~1,452 entries), theme-generator.ts, build-themes.ts,
│                     # light.css, dark.css, tailwind-vars.ts, scoped-theme.tsx,
│                     # design-system.md, development-guide.md, migration-guide.md
├── types/            # Global TypeScript types (incl. types/agent.ts)
├── lib/              # Domain helpers, runtime utilities, adapters
├── locales/          # i18n: i18n.ts + en-US/* + zh-CN/*
└── assets/
```

Use `@/` path alias for all internal imports.

## File Organization (MANDATORY)

### Size limits

| Lines   | Status       | Action             |
| ------- | ------------ | ------------------ |
| < 300   | ✅ Ideal     | —                  |
| 300–400 | ⚠️ Warning   | Plan a split       |
| 400–600 | 🔶 Attention | Refactor scheduled |
| > 600   | ❌ FORBIDDEN | Must split         |

**Known debt** (do not extend): `ApiKeysPage.tsx` (3293), `ExplorePage.tsx` (2279), `DocumentChunksPage.tsx` (2239), `api-key-modal.tsx` (1757), `agent/options/google.ts` (1589), `agent/constant/index.ts` (1443), `MCPChatPage.tsx` (1409), `KnowledgeListPage.tsx` (1219). When touching these, _reduce_ line count or split — never add to them. `CreateAppPage.tsx` was already split into `pages/studio/create-app/` — use that as the reference pattern.

### Module structure

- **Simple** (< 200 lines): single `component.tsx`
- **Medium** (200–400): directory with `index.tsx` + `hooks.ts` + sub-components
- **Complex** (400+): full module — `index.tsx`, `types.ts`, `hooks.ts`, `constants.ts`, `utils.ts`, `components/`
- **Page module**: `pages/<feature>/{index.tsx, types.ts, hooks/, components/, sub-feature/}`

### Naming

| Type      | File                                       | Export         |
| --------- | ------------------------------------------ | -------------- |
| Component | `kebab-case.tsx` or `kebab-case/index.tsx` | `PascalCase`   |
| Hook      | `use-*.ts`                                 | `useCamelCase` |
| Types     | `types.ts`                                 | named          |
| Constants | `constants.ts`                             | named          |
| Utils     | `utils.ts`                                 | named          |

Default to **named exports**. Only keep default exports where an existing convention is already established (legacy page files). No new default exports.

### Hook naming

| Purpose            | Pattern                                          |
| ------------------ | ------------------------------------------------ |
| Query              | `useFetch*`, `useGet*` (`useFetchKnowledgeList`) |
| Mutation           | `useCreate*`, `useUpdate*`, `useDelete*`         |
| UI state           | `useSet*`, `useShow*`, `useToggle*`              |
| Domain composition | `use<Feature>` (`useCreateAppPage`)              |

### Constants — use enums

```ts
// ✅
export enum RunningStatus {
  UNSTART = '0',
  RUNNING = '1',
  DONE = '3',
  FAIL = '4',
}

// ❌ — magic strings
if (doc.status === '1') {
}
```

### Refactoring order

1. Extract hooks → `hooks/use-*.ts`
2. Extract sub-components
3. Extract types → `types.ts`
4. Extract constants → `constants.ts`
5. Lift to a feature platform layer (`operators/`, `adapters/`) only when reuse is real

## Component Architecture

### Presentational vs Container (MANDATORY)

**Presentational** (`src/components/ui/`, `src/components/vendor/`, `src/components/patterns/`):

- Pure display, props in only
- ❌ FORBIDDEN: `useState` for business state, `useEffect` for data, API calls, store reads
- Local UI state (open/closed, hover) is allowed

**Container** (`src/pages/`, feature-level components):

- Owns hooks, queries, mutations, store access
- Composes presentational components

### Page skeleton layers (MANDATORY)

| Layer | Directory                        | Responsibility              |
| ----- | -------------------------------- | --------------------------- |
| L1    | `src/components/ui/`             | Primitives only             |
| L2    | `src/components/patterns/`       | Page structure blocks       |
| L3    | `src/components/page-templates/` | Full page skeletons         |
| L4    | `src/pages/`                     | Business orchestration only |

Rules:

- New pages **must** pick a `page-template`. Do not invent a new full-page shell.
- Page header / toolbar / loading / empty / error blocks **must** come from `patterns/`.
- `Layout` is the route entry shell, kept thin around `AppShell`. Never create a second root layout (the `/settings/*` regression is the canonical mistake — do not repeat it).
- Cross-feature reusable surfaces (e.g. `studio-panel-shell`, `stat-grid`) live in `patterns/`, not in pages.

### Page template selection (MANDATORY)

| Scene           | Template                    | Use for                                    |
| --------------- | --------------------------- | ------------------------------------------ |
| Console         | `ConsolePageTemplate`       | settings, system, resources, management    |
| Workspace       | `WorkspacePageTemplate`     | home, chat, search workspaces              |
| Studio          | `StudioPageTemplate`        | agent canvas, prompt studio, orchestration |
| Studio Tri-Pane | `StudioTriPanePageTemplate` | studio with left + center + right rails    |
| Split Detail    | `SplitDetailPageTemplate`   | list/detail, search console                |
| List            | `ListPageTemplate`          | filterable resource lists                  |

### Page state components (MANDATORY)

Use the consolidated exports from `patterns/page-states.tsx`:

- `PageLoadingState`
- `PageEmptyState`
- `PageErrorState`

No spinner-plus-gray-text ad-hoc states.

## Design Tokens (MANDATORY — NO ARBITRARY VALUES)

`src/themes/tokens.ts` defines ~1,452 token keys. Light/dark palettes live in `theme-generator.ts`; CSS is regenerated via `npm run build:themes`. Dark mode is automatic — **never use `dark:` prefixes** in app code.

| Category  | ✅ Use                                                          | ❌ Forbidden                              |
| --------- | --------------------------------------------------------------- | ----------------------------------------- |
| Surface   | `bg-surface-primary`, `bg-surface-secondary`                    | `bg-white`, `bg-[#1a73e8]`, `bg-blue-600` |
| Text      | `text-text-primary`, `text-text-secondary`, `text-text-caption` | `text-gray-*`, `text-black`               |
| Border    | `border-border-default`, `border-border-subtle`                 | `border-gray-*`                           |
| Status    | `text-status-success`, `bg-status-error-subtle`                 | `text-green-500`, `bg-red-100`            |
| Spacing   | `p-space-base`, `gap-space-md`                                  | `p-4`, `p-[20px]`                         |
| Radius    | `rounded-radius-lg`                                             | `rounded-lg`, `rounded-[12px]`            |
| Shadow    | `shadow-elevation-low/medium/high`                              | `shadow-md`, `shadow-sm`                  |
| Icon size | `size-icon-sm/md/lg/xl/2xl`                                     | `w-4 h-4`                                 |

Allowed Tailwind utilities (not tokens): layout (`flex`, `grid`, `absolute`), sizing (`w-full`, `h-screen`, `max-w-*`), state prefixes (`hover:`, `focus:`, `disabled:`, `sm:`, `md:`).

### Scene tokens (MANDATORY for shells/templates/state blocks)

Verified prefixes in `tokens.ts`:

- `components-app-shell-{bg,surface,border,shadow}`
- `components-main-workbench-{bg,surface,border,shadow}`
- `components-page-header-{bg,border,title,description}`
- `components-page-toolbar-{bg,border,text}`
- `components-page-state-{bg,border,icon-bg,icon,title,description}`
- `components-settings-rail-{bg,border,title,description,section-text}`
- `components-console-{bg,surface,border}`
- `components-workspace-{bg,surface,border}`
- `components-studio-{bg,surface,border}`
- `components-split-pane-{bg,surface,border}`

Plus the granular component tokens for `components-button-*`, `components-input-*`, `components-card-*`, etc.

### Forbidden in `src/pages/**`

- ❌ New `bg-white`, `text-gray-*`, `border-gray-*`
- ❌ New native `<input>` / `<textarea>` (use `@/components/ui/input` / `textarea`) — exception requires a code comment explaining why the UI layer cannot express the requirement
- ❌ Page-level `style={{ color, backgroundColor, … }}` for normal visual semantics (only allowed for dynamic computed values like animations, progress %)
- ❌ Second fullscreen page shell, standalone white-card wrapper, or alternate root layout
- ✅ Prefer `@/components/ui/*` → `@/components/patterns/*` → `@/components/page-templates/*`

### Scoped theming

Embedded surfaces (agent share widget, external embed) use `src/themes/scoped-theme.tsx` to scope tokens to a subtree. Do not reach for `dark:` or `style={{}}` to override embed visuals.

## State Management

| Kind              | Tool                               | Lives in                             |
| ----------------- | ---------------------------------- | ------------------------------------ |
| Server state      | TanStack Query                     | `src/hooks/use-*-request.ts`         |
| UI / client state | Zustand                            | `src/stores/*`                       |
| Streaming chunks  | Local refs / store transient field | Component or store (NOT Query cache) |
| Form state        | react-hook-form + zod              | Component-local                      |

Rules:

```ts
// ❌ Persisting server state — causes localStorage quota exceeded
persist({ knowledgeBases: [], conversations: [] }, { name: 'storage' })

// ✅ Persist UI prefs only
persist({ theme: 'light', sidebarCollapsed: false }, { name: 'ui-storage' })

// ❌ Manual fetch-effect pattern
useEffect(() => {
  loadKnowledgeBases(params)
}, [params])

// ✅ Use the hook
const { data, isLoading } = useFetchKnowledgeList(params)
```

Zustand selector hygiene (React 19): never return new object literals from a selector — it triggers infinite `getSnapshot` loops. Use `useShallow` or split into atomic selectors.

## React 19 Patterns (MANDATORY where applicable)

- **`useOptimistic`** for any user-initiated mutation that should appear instantly (sending a message, toggling a favorite, renaming). Reconcile in the mutation's `onSettled`.
- **`useActionState` + `<form action>`** for form submissions in new code, especially auth and simple settings forms. RHF still owns complex multi-step forms.
- **`use()` hook** to read promises/contexts behind a Suspense boundary, instead of awaiting in render.
- **React Compiler is not enabled today.** Continue to use `memo`, `useMemo`, `useCallback` deliberately. When the compiler is enabled (tracked separately), revisit and _remove_ hand-written memoization that the compiler covers — it then becomes noise.
- **`<ViewTransition>`** is experimental — do not adopt without an issue.

## AI / Streaming UI (MANDATORY)

Streaming is core to this product (chat, agent runtime, log workbench, structured output). Apply these rules:

1. **Don't put streaming chunks in the Query cache.** Use a Zustand transient field or a `useRef` buffer. Write the final aggregated result back into Query (`queryClient.setQueryData`) when the stream closes.
2. **Always own the AbortController.** Create one per stream, abort on unmount, on user cancel, and when the upstream request key changes.
3. **Use `eventsource-parser` for SSE** — do not hand-parse `\n\n` boundaries.
4. **Reconnect / resume rules.** If the server supports `Last-Event-ID`, resume; otherwise mark the stream `interrupted` in the store and surface a retry affordance, never silently re-fetch.
5. **Generative UI**: structured output and tool-call payloads render through the registry in `src/pages/agent/operators/` and `pages/agent/adapters/`. Add new node renderers there. Do not branch on shape inside page components.
6. **Suspense boundaries**: use Suspense for _initial_ load. Streaming progress belongs in the store/UI, not in suspending fallbacks.
7. **`aria-live="polite"`** on streaming text containers; `aria-busy="true"` while a stream is active. Never autofocus during streaming — it breaks screen readers.
8. **Token / cost surfacing** belongs in `lib/agent/` aggregators; do not compute it inline in components.

## Tool Calling & Structured Output

- JSON Schema is the single source of truth. Schema → form rendering goes through `jsonjoy-builder` / `schema-editor` / `pages/agent/features/form-sheet/`.
- Tool-call request/response shapes live in `types/agent.ts`. Do not redefine them per page.
- Partial outputs render through the same renderer registry; missing fields render as skeletons, not as errors.
- MCP tool integration uses `src/components/mcp/`, `src/pages/mcp-servers/`, and the relevant hooks in `src/hooks/use-mcp-request.ts`. **Any MCP tool with side effects requires user confirmation in the UI** before invocation.

## Agent Share / Widget Embed

The agent share surface (`src/pages/agent/share/`, related runtime components) is embedded externally via iframe. When changing this surface:

- All theming flows through `scoped-theme.tsx` — never global CSS overrides.
- Cross-origin messaging uses a typed `postMessage` envelope (see `lib/agent/embed/`). New events go in the typed map, never untyped.
- Attachments served externally must go through the proxy/download flow already in place (do not link to internal blob storage URLs).
- The widget bundle must lazy-load heavy dependencies (Lexical, Monaco, mermaid, pdf-highlighter) — verify with `npm run build` size output before merging.

## i18n (MANDATORY)

- All user-visible strings go through `react-i18next`. Locales live in `src/locales/{en-US,zh-CN}/`.
- Per-feature namespaces (`common`, `datasource`, `flow`, …) — add a namespace, do not bloat `common`.
- Default language is detected by `i18next-browser-languagedetector`; do not hardcode a `lng` in component code.
- Pluralization and interpolation: use the i18next API (`{{ count }}`, `_plural` keys), never string concat.

## Performance

```ts
// ✅ Memoize expensive derived state
const filtered = useMemo(() => list.filter(/* … */), [list, filter])

// ✅ Stable callbacks for memoized children
const onSelect = useCallback((id: string) => doSomething(id), [])

// ✅ Lazy-load route components
const KnowledgePage = lazy(() => import('@/pages/knowledge'))
```

- Heavy deps (Lexical, Monaco, mermaid, react-pdf-highlighter, docx/pptx-preview) **must** be lazy-imported at the route or feature boundary.
- Locale resources are split per language; never import all locales eagerly.
- Use `react-resizable-panels` for split layouts; do not roll your own pixel math.
- For lists > 200 rows, use windowing (TanStack Table virtualization or a manual virtual list) — do not render full DOM.

## Accessibility

- Every interactive element keyboard-reachable. No mouse-only affordances.
- Focus management:
  - Modals/Dialogs/Sheets — Radix handles trap; do not override.
  - Streaming UI — never steal focus while `aria-busy="true"`.
- Screen reader: `aria-live="polite"` for streamed text; `aria-live="assertive"` only for errors that need immediate attention.
- Color is never the only signal — pair status colors with icons or text.

## Security & Privacy

- All HTML produced by the model goes through DOMPurify.
- User input that flows into URL params, query strings, or innerHTML must be encoded/sanitized at the boundary.
- Never persist conversation content, prompts, or tool outputs to localStorage. Persist _UI prefs only_.
- Sensitive fields (API keys, tokens) — masked in the UI, never logged, never sent to third parties.
- Trace IDs may be logged; prompt content must not be.
- Env variables exposed to the browser must be `VITE_*` prefixed; never inline secrets.

## Error Handling

Every route must declare an `errorElement`. Use the shared `ErrorFallback`:

```tsx
{
  path: '/knowledge',
  element: <Suspense fallback={<PageLoadingState />}><KnowledgePage /></Suspense>,
  errorElement: <ErrorFallback />,
}
```

Mutations surface errors via `sonner` (toast), not via dialogs, unless the action requires the user to recover state.

## Testing

Current state: 20 `*.test.ts(x)` files run via `tsx --test`. Coverage focuses on `pages/agent/operators`, `adapters`, `runtime-workbench`, `pipeline-workbench`, `prompt-editor`, `schema-editor`. The single formal npm test script is still `test:agent-t1`.

Required when touching:

- Serializers, adapters, registries, parsers — must have a test.
- Reducers / pure utilities under `lib/` — must have a test.
- Streaming reducers — test the chunk-merging logic, not the network.

Do not introduce Jest. Vitest baseline config exists, but do not opportunistically migrate existing tests; existing tests continue to follow the `tsx --test` style under `__tests__/` directories. New Vitest tests must stay tightly scoped and must not replace the `test:agent-t1` gate.

## Git

- Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `chore`, `perf`, `test`, `style`. Optional scope (`feat(agent): …`).
- PR description must include: summary, screenshots in **both** light and dark themes for any UI change, and a confirmation that `npm run lint` and `npm run build` pass. When touching Agent serializers/adapters/operators, also confirm `npm run lint:typed`, `npm run typecheck:agent-strict`, and `npm run test:agent-t1`.
- Never bypass hooks (`--no-verify`) without explicit user instruction. If a hook fails, fix the underlying issue.

## When in doubt

1. Read `src/themes/design-system.md`, `src/themes/development-guide.md`, `src/themes/migration-guide.md` for token specifics.
2. Read `docs/agent-frontend-rewrite-plan.md` and `docs/agent-capability-completion-roadmap.md` for the agent program direction.
3. Read the relevant `docs/agent-t*-summary.md` for the latest landed capability (T1 foundation, T2 form-sheet, T3 pipeline nodes, T4 runtime, T6 log workbench, T7 share/publish/webhook, T8 observability, T9 explore, T10 variables/structured output).
4. Read the human-facing handbook `AI前端技术栈开发规范.md` for _why_ a rule exists.
