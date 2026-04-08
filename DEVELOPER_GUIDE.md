# Multi-RAG Frontend 开发者指南

本文档用于给团队提供一份可执行、与仓库当前真实结构一致的开发规范。若与 `AGENTS.md` 冲突，以 `AGENTS.md` 为最高优先级。

## 1. 项目定位

Multi-RAG Frontend 是一个以 React 19 + TypeScript 5.8 + Vite 7 构建的企业级 AI 前端，覆盖以下产品域：

- 智能对话工作区
- 知识库与文档处理
- Agent / Pipeline 编排 Studio
- 搜索与探索
- 系统设置与资源管理

核心技术栈：

- React 19
- TypeScript 5.8
- Vite 7
- Zustand
- TanStack Query
- React Router 7
- Tailwind CSS
- Radix UI

## 2. 当前目录结构

请以当前仓库结构为准，不再使用旧版 `layout/feature/forms` 叙事。

```text
src/
├── api/                # API 客户端（按领域划分）
├── components/
│   ├── ui/             # 原子 UI 组件
│   ├── patterns/       # 页面结构块
│   ├── page-templates/ # 页面骨架模板
│   ├── chat/           # 聊天相关组件
│   ├── knowledge/      # 知识库相关组件
│   └── studio/         # Studio/Workbench 相关复用组件
├── hooks/              # query / mutation hooks 与跨页面 hooks
├── pages/              # 页面模块
├── stores/             # Zustand stores
├── themes/             # 设计令牌与主题生成
├── types/              # 全局 TypeScript 类型
├── lib/                # 领域工具与运行时工具
└── assets/             # 静态资源
```

统一使用 `@/` 路径别名导入。

## 3. 页面骨架分层

页面结构必须遵循下面 4 层分工：

| 层级 | 目录 | 职责 |
| --- | --- | --- |
| L1 | `src/components/ui/` | 原子组件，只表达单组件语义 |
| L2 | `src/components/patterns/` | 页面结构块，如 `PageHeader`、`PageToolbar`、`PageLoadingState` |
| L3 | `src/components/page-templates/` | 完整页面骨架，如 `ConsolePageTemplate`、`WorkspacePageTemplate`、`StudioPageTemplate`、`SplitDetailPageTemplate` |
| L4 | `src/pages/` | 业务编排、数据流、交互逻辑，不自建新的整页视觉体系 |

强制规则：

- 新页面必须优先选择 `page-templates`
- 页面头部、工具条、空态、错误态优先复用 `patterns`
- 页面层只负责业务编排，不重新发明页面壳层
- `Layout` 或路由根壳仅作为全局应用容器，不再承接页面级骨架职责

## 4. 页面模板选择

按信息架构选择模板，而不是在页面中重新拼装一套布局。

| 场景 | 模板 | 适用页面 |
| --- | --- | --- |
| Console | `ConsolePageTemplate` | 设置、系统、资源管理、列表页 |
| Workspace | `WorkspacePageTemplate` | 首页、聊天、搜索工作区 |
| Studio | `StudioPageTemplate` | Agent Canvas、Prompt Studio、编排页 |
| Split Detail | `SplitDetailPageTemplate` | 左右分栏、列表详情、检索工作台 |

对 Agent 相关页面的额外要求：

- `Agent Canvas`、`Prompt Studio`、流程编排类页面统一归入 `Studio`
- 目标交互是稳定的 `Technical Workflow Studio`
- 右侧配置轨、运行态入口、日志入口都应视为工作台的一部分，而不是孤立弹层能力

## 5. 文件组织规范

### 5.1 文件大小

| 大小 | 状态 | 要求 |
| --- | --- | --- |
| `< 300` 行 | 理想 | 可保持单文件 |
| `300-400` 行 | 警告 | 考虑拆分 |
| `400-600` 行 | 注意 | 需要计划重构 |
| `> 600` 行 | 禁止 | 必须拆分 |

### 5.2 模块形态

简单模块：

```text
component.tsx
```

中等复杂模块：

```text
message-item/
├── index.tsx
├── hooks.ts
└── sub-component.tsx
```

复杂模块：

```text
document-preview/
├── index.tsx
├── types.ts
├── hooks.ts
├── constants.ts
├── utils.ts
└── components/
```

### 5.3 命名规范

| 类型 | 文件/目录 | 导出 |
| --- | --- | --- |
| 组件 | `kebab-case/` 或 `index.tsx` | `PascalCase` |
| Hook | `use-*.ts` | `useCamelCase` |
| 类型 | `types.ts` | 类型导出 |
| 常量 | `constants.ts` | 常量导出 |
| 工具 | `utils.ts` | 命名导出 |

默认使用命名导出。仅在已有约定非常明确时保留默认导出。

## 6. 组件开发规范

### 6.1 展示组件 vs 容器组件

展示组件：

- 放在 `src/components/ui/` 或跨页面复用组件目录
- 只接收 props
- 不直接访问 store
- 不直接发请求
- 不承担页面级副作用

容器组件：

- 放在 `src/pages/` 或具体 feature 模块中
- 负责编排 hooks、请求、状态和交互
- 组合展示组件

### 6.2 推荐结构

```tsx
import type { UserInfo } from '@/types/api'

interface UserProfileProps {
  user: UserInfo
  onEdit?: (user: UserInfo) => void
  className?: string
}

export function UserProfile({ user, onEdit, className }: UserProfileProps) {
  return (
    <div className={className}>
      <div className="rounded-radius-lg border border-border-secondary bg-surface-primary p-space-base">
        <h3 className="text-text-primary font-medium">{user.name}</h3>
        <p className="text-text-secondary">{user.email}</p>
      </div>
      {onEdit ? (
        <button
          type="button"
          onClick={() => onEdit(user)}
          className="mt-space-sm"
        >
          编辑
        </button>
      ) : null}
    </div>
  )
}
```

### 6.3 页面级状态组件

新的页面级 loading / empty / error 必须优先使用：

- `PageLoadingState`
- `PageEmptyState`
- `PageErrorState`

不要在页面里继续散写：

- `spinner + text-gray-*`
- 临时空态盒子
- 自定义 page header 容器

## 7. TypeScript 规范

### 7.1 类型定义

- 优先使用明确接口和类型别名
- 避免 `any`
- 类型定义优先收敛到 `src/types/` 或 feature-local `types.ts`
- 页面私有类型不要重复定义后端实体结构

```ts
interface UserInfo {
  id: string
  name: string
  email: string
  avatar?: string
}

type Status = 'loading' | 'success' | 'error'
```

### 7.2 导入与导出

```ts
import type { UserInfo } from '@/types/api'
import { Button } from '@/components/ui/button'

export function UserProfile({ user }: { user: UserInfo }) {
  return <div>{user.name}</div>
}
```

### 7.3 常量规范

优先使用 TypeScript 枚举或稳定常量，而不是魔法字符串。

```ts
export enum RunningStatus {
  UNSTART = '0',
  RUNNING = '1',
  DONE = '3',
  FAIL = '4',
}
```

## 8. API 与 Hooks 规范

### 8.1 API 层

- 所有后端请求统一进入 `src/api/`
- 按领域拆分文件
- 页面不要直接写 `fetch`
- 适配逻辑优先放在 `adapters/` 或 `lib/`，不要扩散到页面

### 8.2 Hooks 层

命名规范：

| 用途 | 模式 | 示例 |
| --- | --- | --- |
| 查询 | `useFetch*` / `useGet*` | `useFetchKnowledgeList` |
| 变更 | `useCreate*` / `useUpdate*` / `useDelete*` | `useCreateConversation` |
| UI 状态 | `useSet*` / `useShow*` | `useSetModalState` |

强制规则：

- 服务器状态走 TanStack Query
- 页面不要再用 `useEffect + fetch` 手写加载流程
- 页面不要自己拼 query key 约定，优先复用已有 hooks

推荐写法：

```ts
const { data, isLoading } = useFetchKnowledgeList(params)
const createConversation = useCreateConversation()
```

避免写法：

```ts
useEffect(() => {
  loadKnowledgeList(params)
}, [params])
```

## 9. Zustand 使用规范

Zustand 只承接客户端原子状态，不承接页面请求和复杂副作用。

适合放入 store 的内容：

- 主题
- 侧边栏折叠状态
- 画布中的局部编辑态
- 当前选中节点、局部 UI 面板状态

不适合放入 store 的内容：

- 列表数据
- 接口响应缓存
- 路由衍生数据
- 可以由 Query 管理的服务端状态

持久化只保留 UI 偏好，不要把大对象或服务端数据持久化到本地。

## 10. 路由与页面规范

页面层职责：

- 组织模板
- 调用 hooks
- 处理页面级交互
- 连接业务组件

不要在页面中：

- 自定义第二套整页 header
- 重写整页布局体系
- 直接处理 API 字段兼容

推荐写法：

```tsx
import { PageErrorState, PageHeader, PageLoadingState } from '@/components/patterns'
import { StudioPageTemplate } from '@/components/page-templates'
import { Button } from '@/components/ui/button'

export function ExampleStudioPage() {
  const loading = false
  const error = null

  if (loading) {
    return <PageLoadingState title="加载中" />
  }

  if (error) {
    return <PageErrorState title="加载失败" />
  }

  return (
    <StudioPageTemplate
      toolbar={<PageHeader title="Agent Studio" actions={<Button>保存</Button>} />}
    >
      <div className="p-space-lg">内容区</div>
    </StudioPageTemplate>
  )
}
```

## 11. 设计令牌规范

### 11.1 基本原则

- 禁止硬编码颜色
- 禁止页面层回退到 `bg-white`、`text-gray-*`、`border-gray-*`
- 禁止普通视觉语义写内联样式
- 深色模式自动适配，不使用 `dark:` 前缀表达业务视觉

### 11.2 必须优先使用的语义 token

常用类别：

- 颜色：`surface-*`、`text-*`、`border-*`、`status-*`
- 间距：`space-xs/sm/base/md/lg/xl/2xl`
- 圆角：`radius-sm/md/lg/xl/full`
- 阴影：`elevation-low/medium/high`

骨架与场景 token：

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

### 11.3 页面层禁止项

在 `src/pages/**` 中：

- 禁止新增 `bg-white`
- 禁止新增 `text-gray-*`
- 禁止新增 `border-gray-*`
- 禁止新增原生 `<input>` / `<textarea>`，除非组件层没有能力且写明原因
- 禁止继续搭“页面外层白卡”

### 11.4 示例

推荐：

```tsx
<div className="rounded-radius-lg border border-border-secondary bg-surface-primary p-space-base">
  <h2 className="text-text-primary">标题</h2>
  <p className="text-text-secondary">说明文字</p>
</div>
```

避免：

```tsx
<div className="bg-white border border-gray-200 p-4">
  <h2 className="text-gray-900">标题</h2>
  <p className="text-gray-600">说明文字</p>
</div>
```

## 12. 测试规范

优先为以下层次补测试：

- `operators/`、`adapters/`、`lib/` 等纯逻辑模块
- feature-local `utils.ts`
- renderer registry / serializer / parser 等稳定映射逻辑
- 关键页面状态切换和交互链路

推荐：

- 纯逻辑用单元测试
- UI 交互用 Testing Library
- 只验证稳定外部行为，不绑定实现细节

## 13. 性能规范

### 13.1 记忆化

- 导出组件默认考虑 `memo`
- 只有在 props 稳定且收益明确时使用 `useMemo` / `useCallback`
- 不要为了“看起来专业”滥用记忆化

### 13.2 React Query

- 合理设置 `staleTime`
- 避免页面层重复请求同一资源
- mutation 成功后使用 Query 失效刷新，而不是手写同步缓存

### 13.3 Zustand

- 避免 selector 返回新对象
- 对复杂页面状态拆分稳定 selector
- 在 React 19 场景下，尤其避免会触发 `getSnapshot` 循环的写法

## 14. 最佳实践

### 14.1 重构顺序

推荐顺序：

1. 提取 hooks
2. 提取子组件
3. 提取类型
4. 提取常量
5. 最后再抽页面模板或 feature 平台层

### 14.2 Agent 相关开发额外约束

Agent 领域开发时：

- 优先复用 `types/agent.ts`
- 优先复用 `use-agent-query.ts` / `use-agent-mutation.ts`
- 优先复用 `operators/`、`adapters/`、`features/form-sheet/`
- 不要在页面层新增第二套 Agent API 封装
- 不要回退到旧的平铺表单装配路径

### 14.3 Studio 场景约束

对 Agent Canvas、Prompt Studio、流程编排页：

- 目标是稳定的 `Technical Workflow Studio`
- 顶部工具栏、主工作区、右侧配置轨要有明确层级
- 运行、调试、日志能力属于工作台正式能力，不应长期停留在临时过渡交互

## 15. 常用命令

```bash
npm run dev
npm run build
npm run lint
npm run build:themes
npx tsc --noEmit
```

## 16. 最后说明

本文件用于提供团队协作时的公共开发约束，不承担逐页实现说明。对具体领域的执行规则，请继续参考：

- `AGENTS.md`
- `docs/agent-frontend-rewrite-plan.md`
- `docs/agent-capability-completion-roadmap.md`
- 具体 feature 模块下的 summary / roadmap 文档
