# AGENTS.md

面向 AI 编码工具（Cursor、Claude Code、Copilot 等）的强约束规范。当前项目版本 `0.9.8`。英文同步版本：`CLAUDE.md`。面向人的详尽手册：`AI前端技术栈开发规范.md`。

## 命令

```bash
npm run dev          # Vite 开发服务器，默认仅本机访问，端口 5173
npm run dev:host     # 绑定 0.0.0.0，用于局域网联调
npm run build        # tsc -b && vite build
npm run build:analyze # 生成 dist/stats.html bundle treemap（不部署）
npm run lint         # eslint src
npm run lint:all     # eslint .
npm run lint:typed   # type-aware lint，先覆盖 Agent 关键目录
npm run typecheck:agent-strict # Agent 关键目录严格类型检查
npm run build:themes # 修改 tokens.ts 后重新生成 src/themes/{light,dark}.css
npm run preview      # 预览生产构建
npm run test:agent-t1 # 通过 tsx 跑 node --test（目前唯一正式测试脚本）
```

**注意**：暂无通用 `test`、`format`、`typecheck` 脚本。全量类型检查由 `npm run build` 完成；Agent 关键目录补充跑 `npm run typecheck:agent-strict`。格式化通过 Prettier + lint-staged 作用于 staged 文件，**不要做全仓格式化**。现有正式测试仍用 `tsx --test`，Vitest 基础配置已落地用于后续新增/迁移，**不要引入 Jest**。

## 技术栈（2026-05 校核）

| 层                       | 工具                                                                          | 版本          |
| ------------------------ | ----------------------------------------------------------------------------- | ------------- |
| 框架                     | React                                                                         | 19.1          |
| 语言                     | TypeScript                                                                    | 5.8（strict） |
| 构建                     | Vite                                                                          | 7.3           |
| 路由                     | react-router-dom                                                              | 7.7           |
| 服务器状态               | @tanstack/react-query                                                         | 5.83          |
| 客户端状态               | Zustand                                                                       | 5.0           |
| 样式                     | Tailwind CSS 3.4 + 语义化设计令牌                                             | —             |
| 原子组件                 | Radix UI（16 个包）                                                           | 1.1–2.2       |
| 表单                     | react-hook-form + zod                                                         | 7.60 / 4.0    |
| 图标                     | lucide-react（**唯一允许的图标库**）                                          | 0.525         |
| 聊天 UI                  | @ant-design/x + x-card + x-markdown + x-sdk                                   | 2.7           |
| 画布                     | @xyflow/react / @antv/g6                                                      | 12.9 / 5.0    |
| 编辑器                   | @monaco-editor/react、@lexical/react                                          | 4.7 / 0.40    |
| Markdown                 | react-markdown + markdown-it + remark-gfm + mathjax3                          | —             |
| 流式                     | eventsource-parser                                                            | 3.0           |
| 拖拽                     | @dnd-kit/core + sortable + utilities                                          | —             |
| 文档预览                 | docx-preview、pptx-preview、mammoth、@js-preview/excel、react-pdf-highlighter | —             |
| 图表                     | recharts                                                                      | 3.1           |
| 流程图                   | mermaid                                                                       | 11.12         |
| 净化                     | DOMPurify                                                                     | 3.3           |
| 国际化                   | react-i18next + i18next + browser-languagedetector                            | 16.5 / 25.8   |
| Toast / Drawer / Command | sonner / vaul / cmdk                                                          | —             |
| 可拖动分栏               | react-resizable-panels                                                        | 2.1           |

`patch-package` 在 postinstall 时跑：补丁失败要修补丁，**不要直接删**。

## 目录结构

```
src/
├── api/              # 按领域拆分的 API 客户端（agent、conversation、knowledge、search、system 等）
├── components/
│   ├── ui/           # 65+ 原子组件（Radix 封装）+ vendor/ 用于第三方适配
│   ├── patterns/     # 页面结构块（PageHeader、PageToolbar、page-states、SettingsRail、StatCard/Grid、ListPagination、SectionCard、StudioPanelShell）
│   ├── page-templates/ # 页面骨架（Console、Workspace、Studio、StudioTriPane、SplitDetail、List）
│   ├── layout/       # AppShell、Layout（路由壳）
│   ├── auth/ canvas/ chat/ dynamic-form/ environment/ feature/ forms/
│   │ jsonjoy-builder/ knowledge/ mcp/ memory/ prompt-editor/ studio/
│   └── spotlight.tsx
├── pages/            # 路由模块（agent、agents、ai-tools、auth、dashboard、dialog、
│                     # document-preview、documents、environment-demo、explore、home、
│                     # knowledge、mcp-servers、memory、search、settings、studio、system、
│                     # team、theme-demo、workflow）
├── hooks/            # TanStack Query hooks（use-*-request.ts）+ 通用 hooks
├── stores/           # Zustand stores（auth、ui、chat、conversation、knowledge、model、
│                     # environmentStore、home、search、studio、team、memory）
├── themes/           # tokens.ts（约 1452 个）、theme-generator.ts、build-themes.ts、
│                     # light.css、dark.css、tailwind-vars.ts、scoped-theme.tsx、
│                     # design-system.md、development-guide.md、migration-guide.md
├── types/            # 全局类型（含 types/agent.ts）
├── lib/              # 领域工具、运行时工具、adapters
├── locales/          # i18n: i18n.ts + en-US/* + zh-CN/*
└── assets/
```

统一使用 `@/` 路径别名。

## 文件组织（强制）

### 文件大小

| 行数    | 状态    | 操作     |
| ------- | ------- | -------- |
| < 300   | ✅ 理想 | —        |
| 300–400 | ⚠️ 警告 | 计划拆分 |
| 400–600 | 🔶 注意 | 排期重构 |
| > 600   | ❌ 禁止 | 必须拆分 |

**已知技术债**（不得继续扩张）：`ApiKeysPage.tsx`(3293)、`ExplorePage.tsx`(2279)、`DocumentChunksPage.tsx`(2239)、`api-key-modal.tsx`(1757)、`agent/options/google.ts`(1589)、`agent/constant/index.ts`(1443)、`MCPChatPage.tsx`(1409)、`KnowledgeListPage.tsx`(1219)。修改这些文件时必须**减少**或拆分，不得增加。`CreateAppPage.tsx` 已拆为 `pages/studio/create-app/`，参考此模式。

### 模块形态

- **简单**（< 200）：单文件 `component.tsx`
- **中等**（200–400）：目录 + `index.tsx` + `hooks.ts` + 子组件
- **复杂**（400+）：完整模块 — `index.tsx`、`types.ts`、`hooks.ts`、`constants.ts`、`utils.ts`、`components/`
- **页面模块**：`pages/<feature>/{index.tsx, types.ts, hooks/, components/, sub-feature/}`

### 命名

| 类型 | 文件                                       | 导出           |
| ---- | ------------------------------------------ | -------------- |
| 组件 | `kebab-case.tsx` 或 `kebab-case/index.tsx` | `PascalCase`   |
| Hook | `use-*.ts`                                 | `useCamelCase` |
| 类型 | `types.ts`                                 | 命名导出       |
| 常量 | `constants.ts`                             | 命名导出       |
| 工具 | `utils.ts`                                 | 命名导出       |

**默认使用命名导出**。仅在已有遗留页面文件保留原默认导出。新文件不得新增 default export。

### Hook 命名

| 用途     | 模式                                              |
| -------- | ------------------------------------------------- |
| 查询     | `useFetch*`、`useGet*`（`useFetchKnowledgeList`） |
| 变更     | `useCreate*`、`useUpdate*`、`useDelete*`          |
| UI 状态  | `useSet*`、`useShow*`、`useToggle*`               |
| 领域编排 | `use<Feature>`（`useCreateAppPage`）              |

### 常量必须用枚举

```ts
// ✅
export enum RunningStatus {
  UNSTART = '0',
  RUNNING = '1',
  DONE = '3',
  FAIL = '4',
}

// ❌ 魔法字符串
if (doc.status === '1') {
}
```

### 重构顺序

1. 抽 hooks → `hooks/use-*.ts`
2. 抽子组件
3. 抽类型 → `types.ts`
4. 抽常量 → `constants.ts`
5. 仅在确有跨页复用时再抬升到 `operators/`、`adapters/` 等平台层

## 组件架构

### 展示组件 vs 容器组件（强制）

**展示组件**（`src/components/ui/`、`src/components/vendor/`、`src/components/patterns/`）：

- 纯展示，只接收 props
- ❌ 禁止：业务态 `useState`、加载数据的 `useEffect`、API 调用、读 store
- 局部 UI 态（开/关、hover）允许

**容器组件**（`src/pages/`、feature 组件）：

- 拥有 hooks、queries、mutations、store 访问
- 组合展示组件

### 页面骨架分层（强制）

| 层  | 目录                             | 职责         |
| --- | -------------------------------- | ------------ |
| L1  | `src/components/ui/`             | 仅原子组件   |
| L2  | `src/components/patterns/`       | 页面结构块   |
| L3  | `src/components/page-templates/` | 完整页面骨架 |
| L4  | `src/pages/`                     | 仅业务编排   |

规则：

- 新页面**必须**优先选 `page-template`，不得自定义新整页壳层
- 页面级 header/toolbar/loading/empty/error **必须**复用 `patterns/`
- `Layout` 是路由入口壳，紧贴 `AppShell`，**不得**再造第二根布局（`/settings/*` 的历史回归是反例，不要重蹈）
- 跨 feature 复用面（如 `studio-panel-shell`、`stat-grid`）放 `patterns/`，不放 pages

### 页面模板选择（强制）

| 场景         | 模板                        | 适用                              |
| ------------ | --------------------------- | --------------------------------- |
| Console      | `ConsolePageTemplate`       | 设置、系统、资源管理、列表        |
| Workspace    | `WorkspacePageTemplate`     | 首页、聊天、搜索工作区            |
| Studio       | `StudioPageTemplate`        | Agent Canvas、Prompt Studio、编排 |
| Studio 三栏  | `StudioTriPanePageTemplate` | 左 + 中 + 右轨的 Studio           |
| Split Detail | `SplitDetailPageTemplate`   | 列表/详情、检索工作台             |
| List         | `ListPageTemplate`          | 可筛选资源列表                    |

### 页面状态组件（强制）

统一从 `patterns/page-states.tsx` 导出：

- `PageLoadingState`
- `PageEmptyState`
- `PageErrorState`

不得再写"spinner + text-gray-\*"临时空态块。

## 设计令牌（强制 — 禁止任意值）

`src/themes/tokens.ts` 定义约 1452 个 token。明暗调色板在 `theme-generator.ts`，CSS 通过 `npm run build:themes` 生成。深色模式自动适配，**业务代码禁止使用 `dark:` 前缀**。

| 类别     | ✅ 使用                                                         | ❌ 禁止                                   |
| -------- | --------------------------------------------------------------- | ----------------------------------------- |
| 表面     | `bg-surface-primary`、`bg-surface-secondary`                    | `bg-white`、`bg-[#1a73e8]`、`bg-blue-600` |
| 文字     | `text-text-primary`、`text-text-secondary`、`text-text-caption` | `text-gray-*`、`text-black`               |
| 边框     | `border-border-default`、`border-border-subtle`                 | `border-gray-*`                           |
| 状态     | `text-status-success`、`bg-status-error-subtle`                 | `text-green-500`、`bg-red-100`            |
| 间距     | `p-space-base`、`gap-space-md`                                  | `p-4`、`p-[20px]`                         |
| 圆角     | `rounded-radius-lg`                                             | `rounded-lg`、`rounded-[12px]`            |
| 阴影     | `shadow-elevation-low/medium/high`                              | `shadow-md`、`shadow-sm`                  |
| 图标尺寸 | `size-icon-sm/md/lg/xl/2xl`                                     | `w-4 h-4`                                 |

允许的非 token Tailwind 类：布局（`flex`、`grid`、`absolute`）、尺寸（`w-full`、`h-screen`、`max-w-*`）、状态前缀（`hover:`、`focus:`、`disabled:`、`sm:`、`md:`）。

### 场景 token（壳层 / 模板 / 状态块强制）

`tokens.ts` 中确认存在的前缀：

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

加上更细粒度的 `components-button-*`、`components-input-*`、`components-card-*` 等。

### `src/pages/**` 禁止项

- ❌ 新增 `bg-white`、`text-gray-*`、`border-gray-*`
- ❌ 新增原生 `<input>` / `<textarea>`（用 `@/components/ui/input` / `textarea`） — 例外必须写注释说明 UI 层无能力
- ❌ 用 `style={{ color, backgroundColor, … }}` 表达普通视觉语义（仅允许动画、进度比例等动态计算值）
- ❌ 第二套全屏页壳、独立白卡容器、备用根布局
- ✅ 优先级：`@/components/ui/*` → `@/components/patterns/*` → `@/components/page-templates/*`

### 作用域主题

嵌入式表面（agent share widget、外部 embed）通过 `src/themes/scoped-theme.tsx` 把 token 限定到子树，**不得**用 `dark:` 或内联 `style` 覆盖嵌入视觉。

## 状态管理

| 类别            | 工具                      | 位置                                 |
| --------------- | ------------------------- | ------------------------------------ |
| 服务器状态      | TanStack Query            | `src/hooks/use-*-request.ts`         |
| UI / 客户端状态 | Zustand                   | `src/stores/*`                       |
| 流式 chunks     | 局部 ref / store 临时字段 | 组件或 store（**不进 Query cache**） |
| 表单状态        | react-hook-form + zod     | 组件局部                             |

```ts
// ❌ 持久化服务器数据 — 会触发 localStorage 配额超限
persist({ knowledgeBases: [], conversations: [] }, { name: 'storage' })

// ✅ 仅持久化 UI 偏好
persist({ theme: 'light', sidebarCollapsed: false }, { name: 'ui-storage' })

// ❌ 手写 fetch + useEffect
useEffect(() => {
  loadKnowledgeBases(params)
}, [params])

// ✅ 用对应 hook
const { data, isLoading } = useFetchKnowledgeList(params)
```

Zustand selector 卫生（React 19）：**禁止 selector 返回新对象字面量**，会触发 `getSnapshot` 死循环。用 `useShallow` 或拆成原子 selector。

## React 19 范式（强制，按场景）

- **`useOptimistic`**：所有用户主动变更（发消息、收藏、改名）应即时显示，在 mutation 的 `onSettled` 回调里对账。
- **`useActionState` + `<form action>`**：新代码的简单表单提交（认证、设置）优先用。复杂多步表单仍归 react-hook-form。
- **`use()` hook**：Suspense 边界内读取 promise/context，替代 render 中 await。
- **React Compiler 暂未启用**。继续克制使用 `memo`、`useMemo`、`useCallback`。启用后将单独通知，届时反过来要*移除*被编译器接管的手写记忆化。
- **`<ViewTransition>`** 实验态，未立项不要采用。

## AI 流式 UI（强制）

流式是产品核心（聊天、Agent 运行时、日志工作台、结构化输出）。规则：

1. **流式 chunk 不进 Query cache**。用 Zustand 临时字段或 `useRef` 缓冲；流结束后再 `queryClient.setQueryData` 写回。
2. **AbortController 必须自持**。每条流一个，组件卸载、用户取消、上游请求 key 变化时立即 abort。
3. **SSE 用 `eventsource-parser`**，不要手写 `\n\n` 拆分。
4. **重连 / 续传**：服务端支持 `Last-Event-ID` 时续传；否则在 store 里把流标记为 `interrupted`，前端给出"重试"入口，**不要静默重发**。
5. **生成式 UI**：结构化输出与 tool-call payload 走 `src/pages/agent/operators/`、`pages/agent/adapters/` 的注册表。新节点渲染器加在那里，**不要**在页面组件里 switch case。
6. **Suspense 边界**仅用于*首屏*加载。流式进度归 store/UI，不写在 suspending fallback 里。
7. **可访问性**：流式文字容器加 `aria-live="polite"`、流式期间 `aria-busy="true"`；流式期间**禁止**抢焦点。
8. **Token / 成本统计**：归口在 `lib/agent/` 聚合器，不在组件里现算。

## Tool Calling 与结构化输出

- JSON Schema 是唯一真相源。Schema → 表单/渲染走 `jsonjoy-builder` / `schema-editor` / `pages/agent/features/form-sheet/`。
- Tool-call 请求/响应 shape 在 `types/agent.ts`，**不在页面里重新定义**。
- 部分输出走相同渲染器注册表；缺失字段渲染为骨架，不渲染为错误。
- MCP 工具集成走 `src/components/mcp/`、`src/pages/mcp-servers/`、`src/hooks/use-mcp-request.ts`。**任何有副作用的 MCP 工具调用都必须在 UI 上做二次确认**。

## Agent Share / Widget 嵌入

agent share 表面（`src/pages/agent/share/` 及相关运行时组件）通过 iframe 外嵌。修改时：

- 主题统一走 `scoped-theme.tsx`，**不得**用全局 CSS override。
- 跨域消息走 `lib/agent/embed/` 的类型化 `postMessage` envelope。新事件加进类型映射，**不要**用 untyped。
- 外部展示的附件必须走已有的代理/下载链路，**不得**直接给内部 blob 存储 URL。
- Widget bundle 必须懒加载重型依赖（Lexical、Monaco、mermaid、pdf-highlighter）。合并前用 `npm run build` 校核体积。

## 国际化（强制）

- 所有用户可见字符串走 `react-i18next`。locale 在 `src/locales/{en-US,zh-CN}/`。
- 按 feature 拆 namespace（`common`、`datasource`、`flow`…）。新 namespace 单独建，不要塞 `common`。
- 默认语言由 `i18next-browser-languagedetector` 检测；**禁止**在组件里硬写 `lng`。
- 复数与插值用 i18next API（`{{ count }}`、`_plural` keys），**禁止**字符串拼接。

## 性能

```ts
// ✅ 缓存昂贵派生
const filtered = useMemo(() => list.filter(/* … */), [list, filter])

// ✅ 稳定回调给已 memo 的子组件
const onSelect = useCallback((id: string) => doSomething(id), [])

// ✅ 路由级懒加载
const KnowledgePage = lazy(() => import('@/pages/knowledge'))
```

- 重型依赖（Lexical、Monaco、mermaid、react-pdf-highlighter、docx/pptx-preview）**必须**在路由或 feature 边界懒加载。
- locale 资源按语言分包，**不得**全语言预加载。
- 分栏布局用 `react-resizable-panels`，**不要**自己算像素。
- 列表 > 200 行用虚拟滚动（TanStack Table 虚拟化或手写虚拟列表），**不得**全量渲染 DOM。

## 可访问性

- 所有交互元素键盘可达，禁止鼠标专用交互。
- 焦点：
  - Modal/Dialog/Sheet 用 Radix 自带 trap，不要覆盖
  - 流式 UI 在 `aria-busy="true"` 时**禁止**抢焦点
- 屏读器：流式文字 `aria-live="polite"`；仅紧急错误用 `aria-live="assertive"`
- 状态色不能是唯一信号 — 配图标或文字

## 安全与隐私

- 模型产出的 HTML 全部走 DOMPurify
- 用户输入流入 URL 参数、query string、innerHTML 时，必须在边界编码/净化
- **禁止**把对话内容、prompt、tool 输出写入 localStorage。仅持久化 UI 偏好
- 敏感字段（API key、token）UI 里掩码，**不写日志**、**不发第三方**
- Trace ID 可写日志；prompt 内容不可
- 浏览器侧环境变量必须 `VITE_*` 前缀；**不得**内联密钥

## 错误处理

每条路由必须声明 `errorElement`，统一用 `ErrorFallback`：

```tsx
{
  path: '/knowledge',
  element: <Suspense fallback={<PageLoadingState />}><KnowledgePage /></Suspense>,
  errorElement: <ErrorFallback />,
}
```

Mutation 错误用 `sonner` toast 暴露，不用 dialog 阻塞，除非用户必须现场恢复状态。

## 测试

现状：20 个 `*.test.ts(x)` 文件，通过 `tsx --test` 运行。覆盖在 `pages/agent/operators`、`adapters`、`runtime-workbench`、`pipeline-workbench`、`prompt-editor`、`schema-editor`。目前唯一正式测试脚本仍是 `test:agent-t1`。

接触下面层时**必须**配套测试：

- Serializer、adapter、registry、parser
- `lib/` 下的纯工具
- 流式 reducer — 测 chunk 合并逻辑，不测网络

**禁止引入 Jest**。Vitest 基础配置已落地，但不要顺手迁移存量测试；现阶段存量仍沿用 `tsx --test` 风格，放在 `__tests__/` 目录。新增 Vitest 测试必须保持范围清晰，并不得替换 `test:agent-t1` 门禁。

## Git

- Conventional Commits：`feat`、`fix`、`docs`、`refactor`、`chore`、`perf`、`test`、`style`，可选 scope（`feat(agent): …`）
- PR 描述包含：摘要、UI 变更的明暗双主题截图、`npm run lint` 与 `npm run build` 通过确认；接触 Agent serializer/adapter/operator 时补充 `npm run lint:typed`、`npm run typecheck:agent-strict`、`npm run test:agent-t1`
- **不得**用 `--no-verify` 绕过 hook，除非用户明确要求；hook 失败要修根因

## 拿不准时去看

1. `src/themes/design-system.md`、`development-guide.md`、`migration-guide.md` — token 细节
2. `docs/agent-frontend-rewrite-plan.md`、`docs/agent-capability-completion-roadmap.md` — Agent 大方向
3. `docs/agent-t*-summary.md` — 最新落地能力（T1 地基、T2 form-sheet、T3 pipeline 节点、T4 runtime、T6 日志工作台、T7 share/publish/webhook、T8 可观测性、T9 explore、T10 变量与结构化输出）
4. 面向人的手册 `AI前端技术栈开发规范.md` — 每条规则**为什么**这么定
