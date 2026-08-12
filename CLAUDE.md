# CLAUDE.md

Mandatory rules for AI agents working in this repo. Project version: `0.9.8`. Sister doc in Chinese: `AGENTS.md`. Detailed handbook for humans: `AI前端技术栈开发规范.md`.

**Doc sync rule**: `CLAUDE.md` and `AGENTS.md` are the same ruleset in two languages. Any change to one MUST be mirrored in the other in the same commit. If they ever disagree, treat the stricter rule as authoritative and fix the drift.

## Commands

```bash
npm run dev          # Vite dev server, localhost-only by default, port 5173
npm run dev:host     # Bind 0.0.0.0 for LAN testing
npm run build        # tsc -b && vite build
npm run build:analyze # Generate dist/stats.html bundle treemap (do not deploy)
npm run lint         # eslint src
npm run lint:all     # eslint .
npm run lint:typed   # Type-aware lint for Agent critical directories
npm run lint:i18n-agent # Scan Agent/Layout diffs for newly hardcoded Chinese UI text
npm run typecheck:agent-strict # Strict type check for Agent critical directories
npm run build:themes # Regenerate src/themes/{light,dark}.css + token-values.generated.ts after tokens.ts changes
npm run build:docker # vite build without tsc -b (Docker image build only — never use it to skip type errors)
npm run preview      # Preview production build
npm run test:agent-t1 # node --test via tsx: agent serializers + adapters
npm run test:design-tokens # node --test via tsx: design-token utilities (palette, token values)
npm run test:streaming # node --test via tsx: shared streaming runtime (SSE transport + chunk-merge reducer)
npm run test:api     # node --test via tsx: API-layer contracts (routes, envelopes, normalizers)
npm run test:product-ui # product capability UI contracts (Agent settings, Home, Studio, Search, API Keys)
npm run test:security # security lint rules + toast DOM-injection boundary regression
npm run lint:file-size # File-size ratchet: oversized files must not grow (baseline: scripts/file-size-baseline.json)
npm run lint:file-size:update # Tighten the ratchet baseline after shrinking a debt file (never to loosen it)
npm run check:bundle-size # Bundle budget gate, run after build (budgets: scripts/bundle-size-budget.json)
```

There is **no generic `test`, `format`, or `typecheck` npm script**. Full type checking happens inside `npm run build`; Agent critical directories also have `npm run typecheck:agent-strict`. Formatting is handled by Prettier + lint-staged for staged files only; do not format the whole repo. The formal test gates are `test:agent-t1`, `test:design-tokens`, `test:streaming`, `test:api`, `test:product-ui`, and `test:security`; the test runtimes are `tsx --test`, Node test, and Vitest. Do not introduce Jest.

**CI**: `.github/workflows/ci.yml` runs on every push/PR to `master` — `lint`, `lint:file-size`, `lint:typed`, `typecheck:agent-strict`, `test:agent-t1`, `test:design-tokens`, `test:streaming`, `test:api`, `test:product-ui`, `test:security`, `build`, and `check:bundle-size` must all pass. `lint:i18n-agent` stays a local-only gate (it diffs the working tree). The pre-commit hook only runs lint-staged; still run the relevant gates locally before pushing — never claim they pass without actually running them.

## Stack (verified, 2026-05)

| Layer                      | Tool                                                                          | Version                      |
| -------------------------- | ----------------------------------------------------------------------------- | ---------------------------- |
| Framework                  | React                                                                         | 19.1                         |
| Language                   | TypeScript                                                                    | 5.8 (strict)                 |
| Build                      | Vite                                                                          | 8.0                          |
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

Vite 8 now uses the Rolldown/Oxc build pipeline. Production chunking must use `build.rolldownOptions.output.codeSplitting.groups`; do not add or restore `build.rollupOptions.output.manualChunks`. For dependency optimization or minification config, prefer Vite 8 `rolldownOptions` / `oxc` semantics and only add temporary compatibility after verifying a third-party plugin gap.

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

**Known debt — ENFORCED by ratchet**: every file over 600 lines is recorded with its current line count in `scripts/file-size-baseline.json` (36 files as of 2026-06-10; worst: `ApiKeysPage.tsx` 4068, `ExplorePage.tsx` 2369). CI fails if any baselined file grows by even one line, or if a new file exceeds 600 lines. When you shrink a debt file, run `npm run lint:file-size:update` to tighten the baseline in the same PR. `CreateAppPage.tsx` was already split into `pages/studio/create-app/` — use that as the reference pattern.

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

| Category          | ✅ Use                                                          | ❌ Forbidden                              |
| ----------------- | --------------------------------------------------------------- | ----------------------------------------- |
| Surface           | `bg-surface-primary`, `bg-surface-secondary`                    | `bg-white`, `bg-[#1a73e8]`, `bg-blue-600` |
| Text              | `text-text-primary`, `text-text-secondary`, `text-text-caption` | `text-gray-*`, `text-black`               |
| Border            | `border-border-default`, `border-border-subtle`                 | `border-gray-*`                           |
| Status (feedback) | `text-status-success`, `bg-status-error-subtle`                 | `text-green-500`, `bg-red-100`            |
| Spacing           | `p-space-base`, `gap-space-md`                                  | `p-4`, `p-[20px]`                         |
| Radius            | `rounded-radius-lg`                                             | `rounded-lg`, `rounded-[12px]`            |
| Shadow            | `shadow-elevation-low/medium/high`                              | `shadow-md`, `shadow-sm`                  |
| Icon size         | `size-icon-sm/md/lg/xl/2xl`                                     | `w-4 h-4`                                 |

Allowed Tailwind utilities (not tokens): layout (`flex`, `grid`, `absolute`), sizing (`w-full`, `h-screen`, `max-w-*`), state prefixes (`hover:`, `focus:`, `disabled:`, `sm:`, `md:`).

#### Status colors: feedback (`status-*`) vs interactive (`state-*`) — MANDATORY

These two prefixes are different semantic axes. Do not confuse them.

- **Feedback** (success / warning / error / info) → **`status-*`** (canonical): `status-{success,warning,error,info}` plus the `-10` and `-subtle` variants. Examples: `text-status-error`, `bg-status-info-10`, `border-status-warning-subtle`, `bg-status-success/10`.
- **Interactive** (hover / active / focus / disabled / loading) → **`state-*`**: `state-hover`, `state-active`, `state-focus`, `state-disabled`, `state-loading` (plus `state-focus-10`/`state-focus-subtle`). These are NOT feedback colors — never migrate them to `status-*`.
- `state-{success,warning,error,info}` (and their `-10`/`-subtle` variants) were legacy aliases of the `status-*` feedback tokens; the repo-wide migration is complete and these 12 aliases have been **physically removed** (tokens/theme/CSS). **Write feedback styling with `status-*` only** — the `error`-level lint rule `design-tokens/no-feedback-state-token` now rejects any feedback `state-*` form (class incl. `from-/via-/to-` gradient stops, `var(--color-state-*)`, bare strings / `readCssVar()` / templates). See `docs/design-tokens/2026-05-20-feedback-state-alias-deprecate-summary.md`. For categorical/level data-viz coloring (e.g. the search mindmap) use `data-viz-categorical-1..10` (colorblind-safe OKLCH scale; regenerate via `node scripts/gen-categorical-oklch.mjs`).

#### Token consumption in JS/canvas code (G6, charts, mindmap, knowledge graph) — MANDATORY

- Default path is **static by theme**: `getTokenValue(name, theme)` / `getCategoricalPalette(theme, count?)` from `@/lib/design-tokens`, with `theme` resolved via `useIsDarkTheme()` (or `getResolvedTheme()` outside React). Values come from the generated `token-values.generated.ts`.
- `readCssVar` / runtime `getComputedStyle` reads are reserved for scoped-theme/embed surfaces ONLY. Never hardcode hex values.
- Semantic chart status colors use `components-system-chart-*`.

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

## API Layer (MANDATORY)

- All HTTP goes through the shared `APIClient` in `src/api/client.ts` (auth header, timeout, retry, error envelope). ❌ Never call `fetch`/`axios` directly from pages, components, or stores.
- One domain = one file in `src/api/` (`agent.ts`, `knowledge.ts`, …). New endpoints go into the matching domain file, never inline in a hook or component.
- Errors are surfaced as the typed `APIError` (status / code / message / details). Do not re-wrap into ad-hoc error shapes; UI branches on `APIError.code`/`status`.
- Pagination totals that live on the envelope top level use the opt-in `withEnvelope: true` (`ApiEnvelope`), not a second request.
- **Query key factories are mandatory**: each domain exposes a `<domain>Keys` factory (`datasourceKeys.list()`, `datasourceKeys.detail(id)`) and all `queryKey` / `invalidateQueries` calls go through it. Never inline array-literal query keys in components.

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

- All user-visible strings go through `react-i18next`. Locales live in `src/locales/{en-US,zh-CN}/`; the language list is registered in `src/locales/locale-registry.ts`.
- Per-feature namespaces (`common`, `datasource`, `flow`, …) — add a namespace, do not bloat `common`.
- Product UI language has one source of truth: `localeRegistry` in `src/locales/locale-registry.ts`, deriving `ProductLocale`, `supportedLocales`, and init resources automatically; `src/locales/i18n.ts` owns runtime services such as `setProductLanguage`, `getCurrentLanguage`, and `applyRouteLocale`, synchronized into `useUIStore.language`. Do not maintain a second language state in components, pages, or business hooks.
- Add languages only through `localeRegistry` metadata and resource entries; do not hardcode language lists in the sidebar, dialogs, or share/embed routes. `ensureLocaleLoaded()` is the reserved entry point for future dynamic import / i18next backend loading; current zh/en resources remain eagerly bundled.
- Default language is detected by `i18next-browser-languagedetector`; do not hardcode a `lng` in component code. All language values entering i18n must pass through `normalizeLocale` and become `zh-CN` or `en-US`.
- Do not casually enable `supportedLngs`, `cleanCode`, or `nonExplicitSupportedLngs` in `src/locales/i18n.ts`. This repo’s resource keys are `zh-CN` / `en-US`; the wrong combination makes i18next reject valid languages as unsupported, causing the sidebar to show English while `t()` still falls back to Chinese. If this config is changed, verify in the browser console that there is no `rejecting language code not found in supportedLngs`.
- Sidebar language switching is a product-level local preference and must not call backend `/setting`. Chat/Agent response language, cross-language retrieval, and tool `language` parameters are separate business concepts and must not be coupled to the product UI language.
- `/agent/share`, `/chats/widget`, and embed `set-locale` use `applyRouteLocale` for route-scoped temporary language only; they must not overwrite the user’s local product language preference.
- Language changes must sync `document.documentElement.lang` and `dir`; date, relative-time, and number formatting should derive from `getCurrentLanguage()`, never hardcode `toLocaleString('zh-CN')`.
- Agent/canvas protocol fields, operator ids, DSL fields, backend enums, and third-party language option values are not translated. Translate only UI labels/descriptions. User-defined node names are displayed as user data; only default names may use i18n fallback.
- Pluralization and interpolation: use the i18next API (`{{ count }}`, `_plural` keys), never string concat.
- After touching user-visible text in `src/components/layout`, `src/pages/agent`, or `src/pages/agents`, run at least `npm run lint:i18n-agent`; if the locale service changed, also run `npm run build`.

### i18n Development Workflow (MANDATORY)

Follow the same model used by modern AI products: product UI language is a global product capability, then each page wires its copy into that capability.

1. During requirements/design, classify language into three buckets: product UI copy, user/model-generated content, and business language parameters. Only product UI copy goes into `src/locales`; user data, LLM output, DSL, and tool parameters are not translated.
2. Choose the namespace before coding. Reuse `common` only for short shared terms; domain copy belongs in feature namespaces such as `agent`, `agents`, `flow`, or `datasource`. New domains get a new namespace; do not dump page copy into `common`.
3. Use stable semantic key names, never Chinese text or full English sentences as keys. Reuse an existing key for the same concept; do not create near-duplicate keys for local wording.
4. English and Chinese resources must land in the same PR. When adding a third language, fill every namespace first, then register it in `localeRegistry`. Fallback strings are only development safeguards, not a replacement for locale files. Any `i18next::translator: missingKey` warning means the locale files must be patched.
5. Components only use `const { t } = useTranslation()` and `t('namespace.key', fallback)`. Do not branch on the current language, concatenate local strings, or keep local language state.
6. Date, time, number, and relative-time formatting must use project helpers or `getCurrentLanguage()`. Do not scatter `zh-CN` / `en-US` constants in UI code.
7. Public share/widget/embed routes, preview pages, and iframe surfaces must prove that temporary locale only affects the current route and never overwrites the main app sidebar language preference.
8. Acceptance must cover: Chinese → English → Chinese live switching, persistence after refresh, public share/widget isolation, and no missingKey/unsupported-language warnings in the console.

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

### Model output is untrusted input (MANDATORY)

Treat everything produced by an LLM or returned by a tool — text, markdown, HTML, code, URLs, tool-call arguments — as attacker-controllable (prompt injection is assumed). The statically checkable subset is enforced by `error`-level lint rules: `security/no-unsafe-iframe-sandbox`, `security/no-target-blank-without-rel`, `security/no-raw-dangerously-set-inner-html`, `security/no-imperative-html`, `security/no-sensitive-data-in-console`, plus core `no-eval` / `no-new-func` / `no-script-url` (see `eslint-rules/`):

- All HTML produced by the model goes through DOMPurify. In-app HTML rendering uses the single outlet `SafeHtml` (`@/components/ui/safe-html`, DOMPurify inside; pass tag/attr whitelists via `options` as module-level constants) — raw `dangerouslySetInnerHTML` is rejected by `security/no-raw-dangerously-set-inner-html` (only `SafeHtml`'s own implementation and `__html` values that are literal `sanitize(...)` calls are exempt). Full HTML documents/artifacts render in a **sandboxed iframe** (no `allow-same-origin` together with `allow-scripts`), never injected into the app DOM.
- Links from model/tool output: allow only `http(s):`/`mailto:` schemes (no `javascript:`, no `data:`), and render with `target="_blank" rel="noopener noreferrer"`.
- Do not bypass React / `SafeHtml` with non-empty `innerHTML` / `outerHTML`, `insertAdjacentHTML`, or `document.write*`; only `innerHTML = ''` may clear third-party preview containers.
- Never `eval` / `new Function` / dynamically import model-generated code. Code artifacts are display-only (Shiki/Monaco) unless executed inside the sandboxed iframe.
- Tool-call arguments and results render through structured viewers (registry renderers, JSON viewers) — never as raw HTML.
- Any MCP tool with side effects requires explicit user confirmation in the UI before invocation (also stated in the MCP section — both apply).

### General

- User input that flows into URL params, query strings, or innerHTML must be encoded/sanitized at the boundary.
- Never persist conversation content, prompts, or tool outputs to localStorage. Persist _UI prefs only_.
- Sensitive fields (API keys, tokens) — masked in the UI, never logged, never sent to third parties.
- Trace IDs may be logged; prompt content must not be.
- Env variables exposed to the browser must be `VITE_*` prefixed; never inline secrets.

## Environment & Configuration

- Every `VITE_*` variable must be registered in `.env.example` with a safe placeholder/default in the same PR that introduces it. `.env.local` / `.env.production` are never committed with real secrets.
- Feature switches follow the `VITE_ENABLE_*` naming already in use (`VITE_ENABLE_AGENT_EMBED`, …). Read them at module boundary/constants level, not scattered `import.meta.env` reads inside components.
- Anything secret (API keys, signing secrets) lives server-side only — a `VITE_*` variable is public by definition.

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

Tests run through `tsx --test`, Node test, and Vitest. Coverage focuses on `pages/agent/operators`, `adapters`, `runtime-workbench`, `pipeline-workbench`, `prompt-editor`, `schema-editor`, `lib/design-tokens`, `lib/streaming`, `api`, product capability UI, and security boundaries. Formal npm test scripts: `test:agent-t1`, `test:design-tokens`, `test:streaming`, `test:api`, `test:product-ui`, and `test:security`.

New SSE consumers use the shared runtime in `src/lib/streaming/` (`readSSEStream` + `assertSSEResponse` + typed envelopes + answer reducer) instead of hand-rolling the decode/parse loop; see `docs/streaming-runtime-design.md`.

Required when touching:

- Serializers, adapters, registries, parsers — must have a test.
- Reducers / pure utilities under `lib/` — must have a test.
- Streaming reducers — test the chunk-merging logic, not the network.
- API-layer clients under `src/api/` — endpoint paths, envelope handling, and response normalizers must have a test in `src/api/__tests__/` (run by `test:api`).

Do not introduce Jest. Vitest baseline config exists, but do not opportunistically migrate existing tests; existing tests continue to follow the `tsx --test` style under `__tests__/` directories. New Vitest tests must stay tightly scoped and must not replace the `test:agent-t1` gate.

## Client Platform (MANDATORY)

- This repository is still a pure Web application. `docs/client-platform/` defines the target client-platform architecture and the `CLP-*` execution ledger; it does not mean Electron, auto-update, local PTY/MCP, or a Rust Host exists today.
- Before any Shared Client, desktop shell, run protocol, update/signing, or local-capability work, read `docs/client-platform/README.md`, then the task-relevant `ARCHITECTURE.md`, `CONTRACTS.md`, `ROADMAP.md`, `VERSION_BASELINE.md`, and `TESTING_SECURITY.md`.
- The MVP sequence is fixed: Web correctness and authentication → cloud durable Run Service v2 → Web/Desktop Shared Client → stable Electron thin shell → release quality. The Rust Host is post-MVP Beta only and must not become a hidden desktop-MVP prerequisite.
- The Renderer remains the only product UI and must not import `electron`, `node:*`, or a Host transport. Inject platform differences only through the fixed `PlatformPort` (`capabilities/auth/openExternal/downloads/notifications/updates/runs`) and adapters.
- The shared `RunClient` is fixed to `createRun/getRun/subscribe/cancelRun/submitInteraction`. The MultiRAG backend is the single source of truth for remote Run API/event schemas; this repo consumes generated artifacts/fixtures and links, never a second handwritten schema.
- Keep exact version snapshots only in `docs/client-platform/VERSION_BASELINE.md`; long-lived prose names supported stable channels. Do not downgrade Vite 8 or adopt an incompatible stable/prerelease electron-vite; main/preload use independent build and staging boundaries.

## Git

- Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `chore`, `perf`, `test`, `style`. Optional scope (`feat(agent): …`).
- PR description must include: summary, screenshots in **both** light and dark themes for any UI change, and a confirmation that `npm run lint` and `npm run build` pass. When touching Agent serializers/adapters/operators, also confirm `npm run lint:typed`, `npm run typecheck:agent-strict`, and `npm run test:agent-t1`. When touching design tokens, also confirm `npm run build:themes` regenerated output is committed and `npm run test:design-tokens` passes.
- Never bypass hooks (`--no-verify`) without explicit user instruction. If a hook fails, fix the underlying issue.

## When in doubt

1. Read `src/themes/design-system.md`, `src/themes/development-guide.md`, `src/themes/migration-guide.md` for token specifics.
2. Read `docs/agent-frontend-rewrite-plan.md` and `docs/agent-capability-completion-roadmap.md` for the agent program direction.
3. Read the relevant `docs/agent-t*-summary.md` for the latest landed capability (T1 foundation, T2 form-sheet, T3 pipeline nodes, T4 runtime, T6 log workbench, T7 share/publish/webhook, T8 observability, T9 explore, T10 variables/structured output, T11 cleanup/acceptance, T12 asset/log ops, T13 trace workbench).
4. Read `docs/design-tokens/*.md` for token-system change history (feedback-state alias removal, JS token target, OKLCH categorical palette).
5. Read `docs/engineering-modernization-roadmap.md` for the audited engineering-debt backlog (SEC/ARCH/ENG/HYG items) — it is the single progress ledger; anyone completing an item MUST update its status table there.
6. **Touching `src/pages/settings/channels/**`, `src/api/channel.ts`, `src/hooks/use-channel-request.ts`or`src/locales/\*/channel.ts`? Read `docs/channel-frontend-design.md`(ARCH-6) FIRST.** The channel work is a cross-repo programme: the wire contract's single source of truth lives in the backend repo at`docs/channel-program/CONTRACT.md`, and the task ledger at `docs/channel-program/PROGRESS.md`. Commits must carry both IDs, e.g. `fix(channel): surface server error codes (ARCH-6, CHN-U2)`. Use scope `channel`, not `settings`.
7. Read `docs/client-platform/README.md` before any Shared Client / Desktop / Run protocol / Host work.
8. Read the human-facing handbook `AI前端技术栈开发规范.md` for _why_ a rule exists.
