# Multi-RAG 前端技术栈开发规范（团队手册）

面向团队成员的详尽规范。讲清楚**做什么、不做什么、为什么**。
- 强约束清单见 `AGENTS.md`（中文）/ `CLAUDE.md`（英文）
- 设计令牌细节见 `src/themes/design-system.md` / `development-guide.md` / `migration-guide.md`
- Agent 领域专项见 `docs/agent-*` 系列

文档目标读者：在这个仓库写代码、改代码、Review 代码的人。

---

## 1. 项目定位与现状

Multi-RAG Frontend 是企业级 AI 前端，覆盖：

- 智能对话工作区（Chat / Search）
- 知识库与文档处理
- Agent / Pipeline 编排（Studio）
- Agent Share Widget（外部 iframe 嵌入）
- MCP Servers 接入与管理
- 系统设置与资源管理

当前代码体量（2026-05 校核）：
- 65+ 原子 UI 组件、6 个页面模板、约 1452 个设计 token
- 13 个 Zustand store、20+ 测试文件
- React 19 / TypeScript 5.8 / Vite 7 / TanStack Query 5 / React Router 7

## 2. 技术栈一览（已校核版本）

| 层 | 选型 | 版本 |
|---|---|---|
| 框架 | React | 19.1 |
| 语言 | TypeScript（strict） | 5.8 |
| 构建 | Vite | 7.3 |
| 路由 | react-router-dom | 7.7 |
| 服务器状态 | TanStack Query | 5.83 |
| 客户端状态 | Zustand | 5.0 |
| 样式 | Tailwind CSS + 语义化 token | 3.4 |
| 原子组件 | Radix UI | 1.1 – 2.2 |
| 表单 | react-hook-form + zod | 7.60 / 4.0 |
| 图标 | lucide-react（**唯一**） | 0.525 |
| 聊天 UI | @ant-design/x 套件（x、x-card、x-markdown、x-sdk） | 2.7 |
| 画布 | @xyflow/react、@antv/g6 | 12.9 / 5.0 |
| 编辑器 | @monaco-editor/react、@lexical/react | 4.7 / 0.40 |
| Markdown | react-markdown + markdown-it + remark-gfm + mathjax3 | — |
| 流式 | eventsource-parser | 3.0 |
| 拖拽 | @dnd-kit/core / sortable / utilities | — |
| 文档预览 | docx-preview、pptx-preview、mammoth、@js-preview/excel、react-pdf-highlighter | — |
| 图表 | recharts | 3.1 |
| 流程图 | mermaid | 11.12 |
| 净化 | DOMPurify | 3.3 |
| 国际化 | react-i18next + i18next + browser-languagedetector | 16.5 / 25.8 |
| Toast / Drawer / Command | sonner / vaul / cmdk | — |
| 可拖动分栏 | react-resizable-panels | 2.1 |

**已正式弃用 / 不再使用**：
- ❌ Next.js 体系（不写 SSR、不用 `next-intl`、不用 `next/image`、不用 `dynamic()`）
- ❌ "layout/feature/forms" 旧目录叙事
- ❌ Day.js 之外的旧 moment 系（避免新增）
- ❌ Jest（测试用 `tsx --test`，未来迁 Vitest）
- ❌ Emotion / styled-components / 任意 CSS-in-JS（统一 Tailwind + token）
- ❌ 自带的或第三方的图标库（`heroicons`、`react-icons`、`@ant-design/icons` 之外的等等）

## 3. 目录结构基线

```
src/
├── api/              # 按领域拆分的 API 客户端
├── components/
│   ├── ui/           # 65+ 原子组件（Radix 封装，含 vendor/）
│   ├── patterns/     # 页面结构块
│   ├── page-templates/ # 6 个页面骨架
│   ├── layout/       # AppShell + Layout
│   ├── auth/ canvas/ chat/ dynamic-form/ environment/ feature/
│   │ forms/ jsonjoy-builder/ knowledge/ mcp/ memory/ prompt-editor/ studio/
│   └── spotlight.tsx
├── pages/            # 路由模块
├── hooks/            # use-*-request.ts 与跨页面 hooks
├── stores/           # 13 个 Zustand stores
├── themes/           # 设计令牌 + 主题生成 + 主题文档
├── types/            # 全局类型
├── lib/              # 领域工具与运行时工具
├── locales/          # i18n 资源
└── assets/
```

`pages/` 顶层模块：`agent`、`agents`、`ai-tools`、`auth`、`dashboard`、`dialog`、`document-preview`、`documents`、`environment-demo`、`explore`、`home`、`knowledge`、`mcp-servers`、`memory`、`search`、`settings`、`studio`、`system`、`team`、`theme-demo`、`workflow`。

统一 `@/` 路径别名。

### 为什么这样分

- **`ui/` ↔ `patterns/` ↔ `page-templates/` ↔ `pages/` 四层**：把"原子组件 / 块 / 整页骨架 / 业务编排"分开，避免新成员每写一页就"复制粘贴一套白卡 + header + 间距"。这次重构的最大收益就是这条。
- **`hooks/use-*-request.ts`**：统一 query/mutation 命名空间，让"领域 + 动作"一目了然，CR 时不用反复对接是不是 server state。
- **`stores/` 与 `hooks/` 严格分工**：服务端状态走 Query，UI 状态走 Zustand。早期混着写导致 localStorage 配额超限的事故，靠这条规则收敛。

## 4. 页面骨架与模板

### 4.1 四层分工（强制）

| 层 | 目录 | 职责 |
|---|---|---|
| L1 | `components/ui/` | 单组件语义，纯展示 |
| L2 | `components/patterns/` | 页面结构块（PageHeader、PageToolbar、page-states、SettingsRail、StatCard、StudioPanelShell …） |
| L3 | `components/page-templates/` | 整页骨架 |
| L4 | `pages/` | 业务编排，不自建视觉体系 |

### 4.2 页面模板选择

| 场景 | 模板 | 典型 |
|---|---|---|
| Console | `ConsolePageTemplate` | 设置、系统、资源管理 |
| Workspace | `WorkspacePageTemplate` | 首页、聊天、搜索 |
| Studio | `StudioPageTemplate` | Agent Canvas、Prompt Studio |
| Studio 三栏 | `StudioTriPanePageTemplate` | 左 + 中 + 右轨工作台 |
| Split Detail | `SplitDetailPageTemplate` | 列表/详情、检索工作台 |
| List | `ListPageTemplate` | 可筛选资源列表 |

**强制**：新页面优先选 template；页面层不重新发明整页布局。

### 4.3 反例（历史教训）

> `/settings/*` 曾经被人在 `pages/settings/` 里再造了一套根布局，导致 header / 主题切换 / 路由保护要维护两份。这次重构强制拉回到主 `AppShell` 下作为场景内容。**永远不要再造第二根布局**。

## 5. 设计系统与设计令牌

### 5.1 基本原则

1. **只用语义化 token**，不硬编码颜色
2. **页面层**禁用 `bg-white`、`text-gray-*`、`border-gray-*`
3. 普通视觉语义不写内联 `style`
4. 深色模式自动适配，**禁用 `dark:` 前缀**

### 5.2 必备 token 清单

`src/themes/tokens.ts` 包含约 1452 个 token。常用：

- 颜色：`surface-*`、`text-*`、`border-*`、`status-*`
- 间距：`space-xs/sm/base/md/lg/xl/2xl`
- 圆角：`radius-sm/md/lg/xl/full`
- 阴影：`elevation-low/medium/high`
- 图标：`icon-sm/md/lg/xl/2xl`

**场景 token**（壳层、模板、状态块强制使用）：
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

加上 `components-button-*`、`components-input-*`、`components-card-*` 等组件级 token。

### 5.3 推荐 / 避免

```tsx
// ✅
<div className="rounded-radius-lg border border-border-default bg-surface-primary p-space-base">
  <h2 className="text-text-primary font-medium">标题</h2>
  <p className="text-text-secondary">说明</p>
</div>

// ❌
<div className="bg-white border border-gray-200 p-4">
  <h2 className="text-gray-900">标题</h2>
  <p className="text-gray-600">说明</p>
</div>
```

修改 `tokens.ts` 后必须 `npm run build:themes` 重生 CSS。详见 `src/themes/design-system.md`、`development-guide.md`、`migration-guide.md`。

### 5.4 作用域主题（agent share）

外嵌 widget 用 `src/themes/scoped-theme.tsx` 把 token 作用域限定到子树。**不要**用 `dark:` 或全局 CSS 覆盖外嵌视觉。

## 6. React 组件规范

### 6.1 组件形式

- 函数组件 + TypeScript
- 组件名 `PascalCase`
- **默认命名导出**，仅遗留页面文件保留默认导出
- Props 类型 `组件名 + Props`

### 6.2 展示组件 vs 容器组件

**展示组件**（`components/ui`、`components/patterns`、`components/vendor`）：
- 只接收 props
- 不读 store、不发请求、不做页面级副作用
- 局部 UI 态（开/关、hover）允许

**容器组件**（`pages/`、feature 目录）：
- 编排 hooks、queries、mutations、store 读写
- 组合展示组件

```tsx
import type { UserInfo } from '@/types/api'

interface UserProfileProps {
  user: UserInfo
  className?: string
}

export function UserProfile({ user, className }: UserProfileProps) {
  return (
    <div className={className}>
      <h3 className="text-text-primary font-medium">{user.name}</h3>
      <p className="text-text-secondary">{user.email}</p>
    </div>
  )
}
```

### 6.3 文件大小硬约束

| 行数 | 状态 | 操作 |
|---|---|---|
| < 300 | ✅ 理想 | — |
| 300–400 | ⚠️ 警告 | 考虑拆分 |
| 400–600 | 🔶 注意 | 排期重构 |
| > 600 | ❌ 禁止 | 必须拆 |

**已知技术债（不得继续扩张）**：
`ApiKeysPage.tsx`(3293)、`ExplorePage.tsx`(2279)、`DocumentChunksPage.tsx`(2239)、`api-key-modal.tsx`(1757)、`agent/options/google.ts`(1589)、`agent/constant/index.ts`(1443)、`MCPChatPage.tsx`(1409)、`KnowledgeListPage.tsx`(1219)。修改时必须减少或拆分。

**正面参考**：`pages/studio/create-app/` 是把原来 2178 行的 `CreateAppPage.tsx` 拆模块的标准范例。

### 6.4 重构顺序

1. 抽 hooks → `hooks/use-*.ts`
2. 抽子组件
3. 抽类型 → `types.ts`
4. 抽常量 → `constants.ts`
5. 仅在确有跨页复用时再抬升到平台层（`operators/`、`adapters/`）

## 7. TypeScript 规范

- 公开函数参数与返回值必须有明确类型
- 优先 `interface`，类型别名（`type`）用于联合类型与映射类型
- **禁用 `any`**，必要时 `unknown` + 类型守卫
- 领域实体优先复用 `src/types/`，不在页面里重定义后端 shape
- 常量用枚举（`enum`），不用魔法字符串

```ts
// ✅
export enum RunningStatus {
  UNSTART = '0',
  RUNNING = '1',
  DONE = '3',
  FAIL = '4',
}

interface AITranslateRequest {
  zh_text: string
  llm_name: string
}
```

## 8. API 与 Hooks

### 8.1 API 层（`src/api/`）

按领域拆分（`agent.ts`、`conversation.ts`、`knowledge.ts`、`search.ts`、`system.ts`、`mcp.ts` …）。

- 页面**不直接** `fetch`，统一走 API client
- 后端字段适配放 `lib/` 或 `pages/<feature>/adapters/`，不扩散到页面

### 8.2 Hooks 命名

| 用途 | 模式 | 示例 |
|---|---|---|
| 查询 | `useFetch*` / `useGet*` | `useFetchKnowledgeList` |
| 变更 | `useCreate*` / `useUpdate*` / `useDelete*` | `useCreateConversation` |
| UI 状态 | `useSet*` / `useShow*` / `useToggle*` | `useSetModalState` |
| 领域编排 | `use<Feature>` | `useCreateAppPage` |

### 8.3 服务器状态走 TanStack Query

```ts
// ✅
const { data, isLoading } = useFetchKnowledgeList(params)
const createConversation = useCreateConversation()

// ❌
useEffect(() => { loadKnowledgeList(params) }, [params])
```

合理设置 `staleTime`、`gcTime`；mutation 成功用 `queryClient.invalidateQueries` 失效，不要手写同步 cache。

### 8.4 Agent 领域

Agent 相关复用：
- `src/types/agent.ts`
- `src/hooks/use-agent-*.ts`
- `src/pages/agent/operators/`（节点定义、序列化）
- `src/pages/agent/adapters/`（前后端字段适配）
- `src/pages/agent/features/form-sheet/`（schema → 表单）
- `src/pages/agent/features/runtime-workbench/`（运行时）
- `src/pages/agent/features/pipeline-workbench/`（pipeline）
- `src/pages/agent/features/log-workbench/`（日志）

**禁止**在页面层新增第二套 Agent API 封装或回退到旧的平铺表单。

## 9. Zustand 规范

### 9.1 适合放进 store

- 主题、侧边栏折叠、当前选中节点
- 画布局部编辑态、局部 UI 面板态
- **流式 chunks 临时缓冲**（流结束后再写回 Query cache）

### 9.2 不放进 store

- 列表接口响应
- 搜索结果缓存
- 任何能由 Query 管理的服务端状态
- 重副作用逻辑

### 9.3 持久化

只持久化 UI 偏好，**不**持久化大对象、列表、对话内容、prompt。早期一次错把对话历史 persist 到 localStorage，触发配额超限事故。

### 9.4 React 19 selector 卫生

```ts
// ❌ 每次返回新对象 — getSnapshot 死循环
const { a, b } = useStore(s => ({ a: s.a, b: s.b }))

// ✅ 用 useShallow
import { useShallow } from 'zustand/react/shallow'
const { a, b } = useStore(useShallow(s => ({ a: s.a, b: s.b })))

// ✅ 或拆原子 selector
const a = useStore(s => s.a)
const b = useStore(s => s.b)
```

## 10. 路由与页面

### 10.1 页面职责

页面只做：组织模板、调 hooks、处理交互、连业务组件。

页面**不**做：自定义第二套 header、自建整页布局、直接处理后端字段差异。

### 10.2 推荐写法

```tsx
import { PageErrorState, PageHeader, PageLoadingState } from '@/components/patterns'
import { StudioPageTemplate } from '@/components/page-templates'
import { Button } from '@/components/ui/button'

export function ExampleStudioPage() {
  const { data, isLoading, error } = useFetchExampleData()

  if (isLoading) return <PageLoadingState title="加载中" />
  if (error) return <PageErrorState title="加载失败" />

  return (
    <StudioPageTemplate
      toolbar={<PageHeader title="Agent Studio" actions={<Button>保存</Button>} />}
    >
      <div className="p-space-lg">{/* 内容 */}</div>
    </StudioPageTemplate>
  )
}
```

### 10.3 路由配置

每条路由必须 `errorElement`，使用 `lazy` + `Suspense`：

```tsx
const KnowledgePage = lazy(() => import('@/pages/knowledge'))
{
  path: '/knowledge',
  element: <Suspense fallback={<PageLoadingState />}><KnowledgePage /></Suspense>,
  errorElement: <ErrorFallback />,
}
```

## 11. React 19 时代的范式更新

### 11.1 `useOptimistic`

聊天发送、收藏、改名等乐观更新优先用 `useOptimistic`，在 mutation 的 `onSettled` 里对账。

```tsx
const [optimisticMessages, addOptimistic] = useOptimistic(messages, (state, msg) => [...state, msg])

const send = (text: string) => {
  addOptimistic({ id: 'temp', text, pending: true })
  sendMutation.mutate({ text })
}
```

### 11.2 `useActionState` + `<form action>`

新代码的简单表单（认证、设置切换）优先用。复杂多步表单仍归 react-hook-form。

### 11.3 `use()` hook

Suspense 边界内读取 promise / context，替代在 render 中 `await`。

### 11.4 React Compiler

**当前未启用**。继续克制使用 `memo`、`useMemo`、`useCallback`：仅在 props 稳定且收益明确时用。启用后会反向：要求**移除**手写记忆化。届时单独通知。

### 11.5 `<ViewTransition>` / Activity

实验态，未立项不要用。

## 12. AI 流式 UI（核心规范）

流式是产品骨干（聊天、Agent runtime、日志工作台、结构化输出生成）。下面这套规范由实际事故和迭代沉淀而来。

### 12.1 流式数据不进 Query cache

**原因**：Query cache 设计假设是"完整的、可重放的快照"。流式 chunk 是部分的、瞬时的，写入 cache 会让其他订阅者看到半截数据并触发非预期重渲染。

**做法**：用 Zustand 临时字段（如 `streamingMessages`）或 `useRef` 缓冲。流结束后：

```ts
queryClient.setQueryData(['conversation', id], finalSnapshot)
```

### 12.2 AbortController 必须自持

每条流配一个 `AbortController`：
- 组件卸载 → abort
- 用户取消 → abort
- 上游请求 key（会话 id 等）变化 → abort 旧的、起新的

```ts
useEffect(() => {
  const ctrl = new AbortController()
  startStream({ signal: ctrl.signal })
  return () => ctrl.abort()
}, [conversationId])
```

### 12.3 SSE 解析

用 `eventsource-parser`，不要手写 `\n\n` 拆分（边界 chunk 半截会丢事件）。

### 12.4 重连与续传

- 服务端支持 `Last-Event-ID` 时实现续传
- 否则把流标记为 `interrupted`，前端给"重试"入口
- **禁止**静默重发 — 用户会以为流已结束

### 12.5 生成式 UI（Generative UI）

结构化输出与 tool-call payload 渲染走 `pages/agent/operators/` 与 `pages/agent/adapters/` 的注册表。新节点渲染器**加注册表**，不在页面里 `switch (kind)`。

部分输出渲染原则：缺失字段渲染为骨架（`<Skeleton />`），不渲染为错误。

### 12.6 Suspense 与流式的边界

- Suspense 仅用于*首屏*加载（拿到第一帧前）
- 流式进度归 store/UI，不写在 suspending fallback 里
- 错误边界（`errorElement`）只兜首屏错误，流式中错误用 toast + 重试

### 12.7 可访问性

- 流式文字容器加 `aria-live="polite"`
- 流式期间整个 message bubble 加 `aria-busy="true"`
- 流式期间**禁止**抢焦点（屏读器会重读全段）

### 12.8 Token / 成本

`lib/agent/` 里聚合，UI 里不现算。生产环境向用户展示用量是 2026 现代 AI 前端的事实标准（控制成本 + 透明）。

## 13. Tool Calling 与结构化输出

### 13.1 单一真相源：JSON Schema

Schema → 表单 / 渲染走：
- `src/components/jsonjoy-builder/`
- `src/components/ui/schema-editor`
- `src/pages/agent/features/form-sheet/`

新节点先定 schema，再让渲染器跟随。

### 13.2 类型定义集中

Tool-call 请求 / 响应 shape 在 `types/agent.ts`，**不在页面里重新定义**。

### 13.3 部分输出与失败

- 部分字段缺失：渲染骨架
- 解析失败：展示原始 JSON + 重试入口（运营阶段需要排错）

### 13.4 MCP 集成（已落地）

走 `src/components/mcp/`、`src/pages/mcp-servers/`、`src/hooks/use-mcp-request.ts`。

**强制**：任何有副作用的 MCP 工具调用必须在 UI 上做二次确认（写文件、发邮件、改数据库等）。

## 14. Agent Share / Widget 嵌入

agent share 表面（`src/pages/agent/share/` 与运行时组件）外嵌 iframe。

### 14.1 主题作用域

走 `src/themes/scoped-theme.tsx`，把 token 限定到子树。**不**用 `dark:`、**不**用全局 CSS override。

### 14.2 跨域消息

走 `lib/agent/embed/` 的类型化 `postMessage` envelope。新事件加进类型映射，不要 untyped。

### 14.3 附件链路

外部展示的附件必须走代理 / 下载链路（已有），**不得**直接给内部 blob 存储 URL。

### 14.4 Bundle 体积

Widget bundle 是关键链路 — 重型依赖（Lexical、Monaco、mermaid、pdf-highlighter）必须懒加载，合并前 `npm run build` 校核体积。

## 15. 多模态输入

- **拖拽上传**：`react-dropzone` + `@dnd-kit/core`（如需排序）
- **大文件**：分片 + 断点续传（`api/` 已封装）
- **预览**：图（`react-photo-view`）/ PDF（`react-pdf-highlighter`）/ docx（`docx-preview` + `mammoth`）/ pptx（`pptx-preview`）/ Excel（`@js-preview/excel`）/ CSV（`papaparse`）

## 16. 国际化（i18n）

- 全部用户可见字符串走 `react-i18next`
- locale 在 `src/locales/{en-US,zh-CN}/`
- 按 feature 拆 namespace（`common`、`datasource`、`flow` …），新 namespace 单独建
- 默认语言由 `i18next-browser-languagedetector` 检测，**禁止**硬写 `lng`
- 复数与插值用 i18next API，**禁止**字符串拼接

## 17. 实时能力（SSE / WebSocket）

- 连接建立与销毁集中在 hook 内
- 页面卸载必须清理（abort / close）
- 流式状态**不写**全局 store，写局部或临时字段
- 长任务统一抽象为 query / adapter / runtime hook，不散落在页面

## 18. 测试

### 18.1 现状

- 20+ `*.test.ts(x)` 文件，跑在 `tsx --test`（node native test runner）
- 覆盖：`pages/agent/operators`、`adapters`、`runtime-workbench`、`pipeline-workbench`、`prompt-editor`、`schema-editor`、`api/agent`、`lib/agent`、`lib/search`
- 唯一脚本：`npm run test:agent-t1`

### 18.2 必须测的层

- Serializer、adapter、registry、parser
- `lib/` 下纯工具
- 流式 reducer（chunk 合并逻辑）
- 关键页面状态切换

### 18.3 不要

- ❌ 引入 Jest（明确决定走 Vitest 路径，但暂未迁移）
- ❌ 测实现细节，只测稳定外部行为
- ❌ Mock 真实流（用 fixture）

### 18.4 待办

Vitest 迁移已规划，迁移前沿用 `tsx --test` 风格，文件放 `__tests__/` 目录。

## 19. 性能

### 19.1 记忆化

- 仅在 props 稳定且收益明确时用 `useMemo` / `useCallback` / `memo`
- React Compiler 启用后将整体反向（详见 §11.4）

### 19.2 懒加载

```ts
// ✅ 路由级
const KnowledgePage = lazy(() => import('@/pages/knowledge'))

// ✅ feature 级（重型依赖）
const Monaco = lazy(() => import('@monaco-editor/react'))
```

重型依赖必须懒加载：Lexical、Monaco、mermaid、react-pdf-highlighter、docx-preview、pptx-preview、@js-preview/excel。

### 19.3 列表

- < 200 行：直接渲染
- ≥ 200 行：虚拟滚动（TanStack Table 虚拟化或手写）

### 19.4 分栏

用 `react-resizable-panels`，**不**自己算像素。

### 19.5 Bundle

- locale 资源按语言分包
- 监控 `npm run build` 输出，单 chunk > 500KB 必须分析
- 关注 LCP（首屏首字节）与 TTI（流式 TPS、tokens/s）

## 20. 可访问性（a11y）

- 所有交互键盘可达，禁止鼠标专用交互
- 焦点：
  - Modal / Dialog / Sheet 用 Radix 自带 trap
  - 流式 UI `aria-busy="true"` 时**禁止**抢焦点
- 屏读器：流式文字 `aria-live="polite"`，紧急错误 `assertive`
- 颜色不能是唯一信号 — 配图标 / 文字
- 表单字段必有 `<label>` 关联

## 21. 安全与隐私

### 21.1 输入与输出

- 模型产出 HTML 必须 DOMPurify
- 用户输入流入 URL / innerHTML / query string 必须在边界编码

### 21.2 持久化

- **禁止**把对话内容、prompt、tool 输出写入 localStorage
- 仅持久化 UI 偏好
- IndexedDB 用于离线缓存时也要走加密 / 脱敏

### 21.3 敏感字段

- API key、token UI 上掩码
- **不写日志**、**不发第三方**
- Trace ID 可写日志；prompt 内容不可

### 21.4 环境变量

- 浏览器侧必须 `VITE_*` 前缀
- **不得**内联密钥
- `.env.example` 必须保持最新

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_APP_VERSION=0.9.8
```

## 22. 可观测性（观测与上报）

- 前端 trace ID 透传（与后端 LLM trace 打通）
- 错误上报含 model、token 元数据；**不含** prompt 原文
- 性能埋点：流式 TTFB、tokens/s、TTI、LCP
- 用户行为埋点用 feature 级 hook 包，不散落在组件

## 23. Git 与协作

### 23.1 分支

- `feature/*`、`fix/*`、`docs/*`、`refactor/*`、`perf/*`、`chore/*`
- 长期分支：`master`（主干）

### 23.2 提交信息

Conventional Commits：
```
feat(agent): support downloadable runtime attachments
fix(agent-share): support multi-file uploads
refactor(knowledge): split DocumentChunksPage hooks
docs: refresh handbook for 2026 stack
```

### 23.3 提交前检查

```bash
npm run lint
npx tsc --noEmit   # 或 npm run build
```

UI 改动：附明暗双主题截图。

### 23.4 PR

- 标题简洁（< 70 字符）
- Body 含摘要、变更范围、测试清单、双主题截图
- **不**用 `--no-verify` 绕过 hook（除非用户明确）

## 24. 文档导航

- `CLAUDE.md` — Agent 行为约束（英文）
- `AGENTS.md` — Agent 行为约束（中文）
- `AI前端技术栈开发规范.md`（本文）— 团队详尽手册
- `src/themes/design-system.md` — 设计系统总论
- `src/themes/development-guide.md` — token 开发指南
- `src/themes/migration-guide.md` — token 迁移指南
- `docs/agent-frontend-rewrite-plan.md` — Agent 前端重写计划
- `docs/agent-capability-completion-roadmap.md` — Agent 能力路线图
- `docs/agent-t*-summary.md` — 各阶段（T1–T10）落地纪要
- `docs/agent-share-*.md` — Agent Share 集成与重构指南
- `docs/style-modernization-roadmap.md` — 视觉现代化路线
- `docs/project-style-*.md` — 视觉风格库

`README.md` / `README_zh.md` 是项目门面，不放规范细节。

## 25. 常用命令汇总

```bash
npm install
npm run dev               # 开发服务器（5173）
npm run build             # tsc -b && vite build
npm run preview           # 预览生产构建
npm run lint              # eslint src
npm run lint:all          # eslint .
npm run build:themes      # 重生 themes/{light,dark}.css
npm run test:agent-t1     # 跑 agent T1 相关测试
npx tsc --noEmit          # 类型检查
```

## 26. 总结：什么是"现代 AI 前端"在这里的含义

到 2026 年，"现代 AI 前端"的事实标准是：

1. **流式优先**：非流式是例外
2. **生成式 UI**：模型产出 → 注册表渲染，而不是页面 switch
3. **Tool calling 与 MCP 一等公民**：UI 必须能呈现工具调用并做权限把关
4. **可嵌入**：核心能力以 widget 形式可被外部宿主嵌入
5. **多模态**：文本 + 文件 + 图 + 音频是默认输入
6. **可观测可计量**：trace、token、cost 都向用户暴露
7. **可访问**：流式 UI 不破坏屏读器与键盘体验
8. **隐私优先**：对话内容不本地化、不三方化
9. **类型 + Schema 驱动**：JSON Schema 是表单/渲染/校验的单一真相
10. **测试关键映射**：序列化、解析、注册表必有测试

本仓库的所有规则都在服务这十条。每次修改时回头对一下，不要让规则成为僵化的形式。
