# CLAUDE.md

## Commands

```bash
npm run dev          # Dev server (localhost:5173)
npm run build        # Production build
npm run lint         # ESLint check
npm run build:themes # Regenerate theme CSS after token changes
npx tsc --noEmit     # Type check
```

## Architecture

React 19 + TypeScript 5.8 + Vite 7 Multi-RAG frontend.

**Stack**: Zustand (client state) + TanStack Query (server state) + React Router 7 + Tailwind CSS + Radix UI

**Key Directories**:
- `src/api/` - API clients by domain
- `src/stores/` - Zustand stores (auth, ui, chat, conversation, knowledge, model)
- `src/pages/` - Page modules with nested routing
- `src/components/ui/` - 48 base UI components
- `src/components/patterns/` - page structure blocks (`PageHeader`, `PageState`, `SettingsRail`)
- `src/components/page-templates/` - page skeletons (`Console`, `Workspace`, `Studio`, `SplitDetail`)
- `src/hooks/` - TanStack Query hooks (`use-*-request.ts`)
- `src/themes/` - Design tokens and theme generation

## File Organization (MANDATORY)

### Size Limits

| Size | Status | Action |
|------|--------|--------|
| < 300 lines | ✅ Ideal | - |
| 300-400 | ⚠️ Warning | Consider split |
| 400-600 | 🔶 Attention | Plan refactor |
| > 600 | ❌ FORBIDDEN | Must split now |

**Technical Debt**: `ApiKeysPage.tsx` (3412), `DocumentChunksPage.tsx` (2241), `CreateAppPage.tsx` (2178), `ExplorePage.tsx` (2048)

### Module Structure

**Simple** (< 200 lines): Single file `component.tsx`

**Medium** (200-400 lines): Directory with split files
```
message-item/
├── index.tsx      # Main + re-exports
├── hooks.ts       # Component hooks
└── sub-component.tsx
```

**Complex** (400+ lines): Full module
```
document-preview/
├── index.tsx      # Entry, exports all
├── types.ts       # Interfaces
├── hooks.ts       # Shared hooks
├── constants.ts   # Constants
├── utils.ts       # Helpers
├── pdf-preview.tsx
└── components/    # Sub-components
```

**Page Module** (complex):
```
pages/knowledge/
├── index.tsx           # Route entry
├── types.ts
├── hooks/              # useKnowledgeList, etc.
├── components/         # Page-private components
└── documents/          # Sub-feature module
```

### Naming

| Type | File | Export |
|------|------|--------|
| Component | `kebab-case/` | `PascalCase` |
| Hook | `use-*.ts` | `useCamelCase` |
| Types | `types.ts` | - |
| Constants | `constants.ts` | - |

### Hook Naming Convention

| Purpose | Pattern | Example |
|---------|---------|---------|
| Query | `useFetch*`, `useGet*` | `useFetchKnowledgeList` |
| Mutation | `useCreate*`, `useUpdate*`, `useDelete*` | `useCreateConversation` |
| UI State | `useSet*`, `useShow*` | `useSetModalState` |

### Constants: Use TypeScript Enums

```typescript
// ✅ CORRECT: Use enums for constants
export enum RunningStatus {
  UNSTART = '0',
  RUNNING = '1',
  DONE = '3',
  FAIL = '4',
}

// ❌ AVOID: Plain objects or magic strings
const status = { running: '1', done: '3' };
if (doc.status === '1') { ... }
```

### Refactoring Order

1. Extract hooks → `hooks/use-*.ts`
2. Extract sub-components
3. Extract types → `types.ts`
4. Extract constants → `constants.ts`

## Component Architecture

### Presentational vs Container (MANDATORY)

**Presentational** (`src/components/ui/`, `src/components/vendor/ui/`):
- ✅ Pure display, props only
- ❌ FORBIDDEN: `useState`, `useEffect`, API calls, store access

**Container** (`src/pages/`, feature components):
- ✅ Business logic, hooks, API, stores
- ✅ Compose presentational components

```typescript
// ✅ Presentational
export const MessageBubble: React.FC<Props> = ({ content, sender, onEdit }) => (
  <div className="p-space-base bg-surface-secondary rounded-radius-lg">
    <div>{content}</div>
    <span className="text-text-caption">{sender}</span>
  </div>
);

// ✅ Container
export const ChatContainer: React.FC = () => {
  const { messages } = useChatStore();
  const mutation = useSendMessage();
  return <MessageList messages={messages} onSend={mutation.mutate} />;
};
```

### Page Skeleton Layers (MANDATORY)

Pages must follow this layering. Do not keep inventing page shells inside `src/pages/`.

| Layer | Directory | Responsibility |
|------|-----------|----------------|
| L1 | `src/components/ui/` | Primitive UI only |
| L2 | `src/components/patterns/` | Page structure blocks like `PageHeader`, `PageToolbar`, `PageErrorState` |
| L3 | `src/components/page-templates/` | Full page skeletons |
| L4 | `src/pages/` | Business orchestration only |

**Required rules**:
- New pages must choose a `page-template` first instead of defining a new full-page shell
- Page-level header / empty / error / toolbar blocks must reuse `patterns`
- `Layout` is only the route entry shell and must stay thin around `AppShell`
- `/settings/*` must stay inside the main shell; never create a second root layout for settings again

### Page Template Selection (MANDATORY)

| Scene | Template | Typical usage |
|------|----------|---------------|
| Console | `ConsolePageTemplate` | settings, system, resources, management pages |
| Workspace | `WorkspacePageTemplate` | home, chat, search workspaces |
| Studio | `StudioPageTemplate` | agent canvas, prompt studio, orchestration screens |
| Split Detail | `SplitDetailPageTemplate` | left/right split, list/detail, search console |

### Page State Components (MANDATORY)

Use these for new page-level states:

- `PageLoadingState`
- `PageEmptyState`
- `PageErrorState`

Do not add new page-local `spinner + text-gray-*` state blocks.

## Design Tokens (MANDATORY - NO ARBITRARY VALUES)

### Required Usage

| Category | ✅ USE | ❌ FORBIDDEN |
|----------|--------|--------------|
| Colors | `bg-surface-primary`, `text-text-body` | `bg-[#1a73e8]`, `bg-blue-600` |
| Spacing | `p-space-base`, `gap-space-md` | `p-4`, `p-[20px]` |
| Radius | `rounded-radius-lg` | `rounded-lg`, `rounded-[12px]` |
| Shadow | `shadow-elevation-low` | `shadow-md` |

### Allowed Exceptions
- Layout: `flex`, `grid`, `absolute`, `relative`
- Sizing: `w-full`, `h-screen`, `max-w-*`
- Prefixes: `sm:`, `md:`, `hover:`, `focus:`

### Token Reference (`src/themes/tokens.ts`)
- **Colors**: `surface-*`, `text-*`, `border-*`, `status-*`
- **Spacing**: `space-xs/sm/base/md/lg/xl/2xl`
- **Radius**: `radius-sm/md/lg/xl/full`
- **Elevation**: `elevation-low/medium/high`
- **Icons**: `icon-sm/md/lg/xl/2xl`

Dark mode: Automatic via tokens. Never use `dark:` prefix.

### Shell and Scene Tokens (MANDATORY)

Shells, templates, and page states must use scene-level semantic tokens:

- `components-app-shell-*`
- `components-main-workbench-*`
- `components-page-header-*`
- `components-page-toolbar-*`
- `components-page-state-*`
- `components-settings-rail-*`
- `components-console-*`
- `components-workspace-*`
- `components-studio-*`
- `components-split-pane-*`

Do not rebuild skeletons with `bg-white`, `text-gray-*`, or `border-gray-*`.

### Forbidden in `src/pages/**` (MANDATORY)

- ❌ No new `bg-white`, `text-gray-*`, `border-gray-*`
- ❌ No new native `<input>` / `<textarea>` unless the component layer cannot express the requirement and the file explains why
- ❌ No page-level `style={{ color/backgroundColor/... }}` for normal visual semantics
- ❌ No second fullscreen page shell, no standalone page white-card wrapper, no alternate root layout
- ✅ Prefer `@/components/ui/*`, then `@/components/patterns/*`, then `@/components/page-templates/*`

## State Management

**Server State** → TanStack Query (`src/hooks/use-*-request.ts`)
**Client State** → Zustand (`src/stores/`) - UI preferences only

```typescript
// ❌ FORBIDDEN - causes quota exceeded
persist({ knowledgeBases: [], conversations: [] }, { name: 'storage' })

// ✅ CORRECT
persist({ theme: 'light', sidebarCollapsed: false }, { name: 'ui-storage' })
```

```typescript
// ❌ OLD: Store + useEffect
useEffect(() => { loadKnowledgeBases(params) }, [params])

// ✅ NEW: TanStack Query
const { knowledgeBases, isLoading } = useFetchKnowledgeList(params)
```

## Performance Optimization

### Memoization Rules

```typescript
// ✅ Export components with memo for re-render prevention
export default memo(MyComponent);

// ✅ Memoize expensive calculations
const filteredList = useMemo(() => 
  list.filter(item => item.status === status), [list, status]);

// ✅ Memoize callbacks passed to children
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### Route Lazy Loading

```typescript
// ✅ Always lazy load page components
const KnowledgePage = lazy(() => import('@/pages/knowledge'));

// Route config with error boundary
{
  path: '/knowledge',
  element: <Suspense fallback={<Loading />}><KnowledgePage /></Suspense>,
  errorElement: <ErrorFallback />,
}
```

## Error Handling

### Error Boundaries (Required for Pages)

Every route must have `errorElement`. Create reusable `ErrorFallback`:

```typescript
// components/error-fallback.tsx
export const ErrorFallback: React.FC<{ error?: Error; reset?: () => void }> = ({
  error, reset
}) => (
  <div className="flex flex-col items-center gap-space-md p-space-lg">
    <h2>{t('error.title')}</h2>
    {error && <details>{error.message}</details>}
    <Button onClick={() => window.location.reload()}>{t('error.reload')}</Button>
  </div>
);
```

## Figma MCP Integration

When generating code from Figma:

1. **Map to design tokens** - Never use Figma's arbitrary values
2. **Use Lucide React** - Only icon library allowed
3. **Use `@/components/ui/*`** - No new UI libraries
4. **Generate presentational components** - Pure display, props interface

**Figma → Token Mapping**:
| Figma | Token |
|-------|-------|
| 4/8/12/16/24/32px | `space-xs/sm/base/md/lg/xl` |
| Primary | `surface-accent`, `text-accent` |
| Background | `surface-primary/secondary` |
| Text | `text-primary/secondary` |

Unmappable values: Add TODO comment, ask for confirmation, use closest token.
