# Multi-RAG 前端技术栈开发规范

本文档用于说明本仓库当前采用的前端技术栈、工程边界和开发约束。若与 `AGENTS.md`、`DEVELOPER_GUIDE.md` 冲突，以那两份文档为准。

## 1. 当前技术栈

- 框架：React 19
- 语言：TypeScript 5.8，严格模式
- 构建工具：Vite 7
- 路由：React Router 7
- 服务端状态：TanStack Query 5
- 客户端状态：Zustand 5
- 样式系统：Tailwind CSS 3.4 + 语义化设计令牌
- UI 基础组件：Radix UI 封装组件
- 表单：React Hook Form 7 + Zod 4
- 图标：Lucide React
- 画布编排：@xyflow/react
- 文件上传：react-dropzone
- 图表：recharts

不再使用的旧口径：

- 不按 Next.js 体系写规范
- 不使用 `next-intl`
- 不使用 Next.js `Image`、`Font`、`dynamic()`
- 不再以“layout/feature/forms”作为主要目录叙事

## 2. 工程目标

技术栈规范服务于以下目标：

- 页面骨架统一
- 领域类型统一
- API 与 hooks 收敛
- 设计系统语义化
- 复杂产品页可演进，尤其是 `Workspace`、`Studio`、`Workbench` 场景

## 3. 当前目录结构基线

```text
src/
├── api/                # API 客户端
├── components/
│   ├── ui/             # 原子 UI
│   ├── patterns/       # 页面结构块
│   ├── page-templates/ # 页面骨架模板
│   ├── chat/           # 聊天组件
│   ├── knowledge/      # 知识库组件
│   └── studio/         # Studio/Workbench 复用组件
├── hooks/              # query/mutation hooks 与通用 hooks
├── pages/              # 页面模块
├── stores/             # Zustand stores
├── themes/             # 设计令牌与主题生成
├── types/              # 全局类型
├── lib/                # 工具与领域辅助
└── assets/             # 静态资源
```

统一使用 `@/` 路径别名导入。

## 4. 页面骨架与模板体系

页面必须遵循四层分工：

| 层级 | 目录 | 职责 |
| --- | --- | --- |
| L1 | `components/ui` | 原子组件 |
| L2 | `components/patterns` | 页面结构块 |
| L3 | `components/page-templates` | 整页骨架 |
| L4 | `pages` | 业务编排与交互逻辑 |

页面模板选择规则：

| 场景 | 模板 | 典型页面 |
| --- | --- | --- |
| Console | `ConsolePageTemplate` | 系统、设置、资源管理 |
| Workspace | `WorkspacePageTemplate` | 首页、聊天、搜索 |
| Studio | `StudioPageTemplate` | Agent Canvas、Prompt Studio、流程编排 |
| Split Detail | `SplitDetailPageTemplate` | 列表详情、检索工作台 |

强制要求：

- 新页面优先复用 `page-templates`
- 页面级头部、工具条、状态区优先复用 `patterns`
- 页面层不重新发明一套新的整页布局

## 5. 样式与设计系统

### 5.1 基本原则

- 只使用语义化设计令牌，不硬编码颜色
- 页面层禁止继续使用 `bg-white`、`text-gray-*`、`border-gray-*`
- 普通视觉语义不使用内联 `style`
- 深色模式自动适配，不用 `dark:` 表达业务层语义

### 5.2 必须优先使用的 token

- `surface-*`
- `text-*`
- `border-*`
- `status-*`
- `space-*`
- `radius-*`
- `elevation-*`

骨架层和工作台相关 token：

- `components-app-shell-*`
- `components-main-workbench-*`
- `components-page-header-*`
- `components-page-toolbar-*`
- `components-page-state-*`
- `components-console-*`
- `components-workspace-*`
- `components-studio-*`
- `components-split-pane-*`

### 5.3 推荐写法

```tsx
<div className="rounded-radius-lg border border-border-secondary bg-surface-primary p-space-base">
  <h2 className="text-text-primary font-medium">标题</h2>
  <p className="text-text-secondary">说明文字</p>
</div>
```

### 5.4 避免写法

```tsx
<div className="bg-white border border-gray-200 p-4">
  <h2 className="text-gray-900">标题</h2>
  <p className="text-gray-600">说明文字</p>
</div>
```

## 6. React 组件规范

### 6.1 组件形式

- 使用函数组件 + TypeScript
- 组件名使用 `PascalCase`
- 默认优先使用命名导出
- Props 使用 `组件名 + Props`

### 6.2 展示组件 vs 容器组件

展示组件：

- 只接收 props
- 不直接访问 store
- 不直接发请求
- 不承担页面级副作用

容器组件：

- 负责 hooks、请求、交互编排
- 位于 `pages/` 或具体 feature 模块中

### 6.3 示例

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

## 7. TypeScript 规范

- 所有公开函数参数和返回值应有明确类型
- 优先使用 `interface` 定义对象结构
- 避免 `any`，必要时使用 `unknown`
- 领域实体优先复用 `src/types/`
- 页面私有类型不要重复定义后端结构

示例：

```ts
interface AITranslateRequest {
  zh_text: string
  llm_name: string
}

interface AITranslateResponse {
  status: 'success' | 'error'
  data: {
    original_text: string
    translated_text: string
  }
}
```

## 8. API 层规范

所有请求统一进入 `src/api/`，按领域拆分：

- `api/agent.ts`
- `api/conversation.ts`
- `api/knowledge.ts`
- `api/search.ts`
- `api/system.ts`

强制要求：

- 页面不要直接写 `fetch`
- 统一经过 API client
- 类型适配优先放在 `lib/` 或 `adapters/`
- 不把后端字段差异扩散到页面层

## 9. Hooks 规范

### 9.1 服务器状态

服务器状态统一走 TanStack Query。

命名规范：

- 查询：`useFetch*` / `useGet*`
- 变更：`useCreate*` / `useUpdate*` / `useDelete*`
- UI 状态：`useSet*` / `useShow*`

推荐：

```ts
const { data, isLoading } = useFetchKnowledgeList(params)
const mutation = useCreateConversation()
```

避免：

```ts
useEffect(() => {
  loadData()
}, [])
```

### 9.2 Agent 领域

Agent 相关能力优先复用：

- `src/types/agent.ts`
- `src/hooks/use-agent-query.ts`
- `src/hooks/use-agent-mutation.ts`
- `src/pages/agent/operators/`
- `src/pages/agent/adapters/`
- `src/pages/agent/features/form-sheet/`

## 10. Zustand 规范

Zustand 只承接客户端原子状态：

- 主题
- 侧边栏状态
- 画布局部状态
- 节点选中态
- 局部 UI 面板状态

不要放入 Zustand 的内容：

- 列表接口响应
- 搜索结果缓存
- 可由 Query 管理的服务端状态
- 重副作用逻辑

## 11. 路由规范

- 使用 React Router 7
- 页面级路由可以使用 `React.lazy`
- 路由保护通过现有认证组件实现
- 不再使用 Next.js 风格的文件路由心智

对 Agent 领域的额外要求：

- `/agents`、`/agent/:id`、`/agent/:id/explore`、`/agent/share` 走统一产品流
- `Studio` 是工作台，不是 demo 聚合页

## 12. Agent / Studio / Workbench 约束

对于 Agent Canvas、Prompt Studio、流程编排页：

- 目标交互是稳定的 `Technical Workflow Studio`
- 顶部工具栏、主工作区、右侧配置轨必须层级清晰
- 运行、调试、日志属于工作台正式能力
- 不要长期依赖过渡性抽屉交互作为终局方案

对当前 Agent 重构的工程要求：

- 参考 RAGFlow 的能力模型，不照搬其旧 UI
- 保持 `form-sheet`、`operators`、`adapters` 这些平台层稳定
- 在新壳层上逐步替换旧 canvas 周边能力

## 13. 实时能力规范

如果使用 SSE / WebSocket：

- 连接建立与销毁必须在 hook 内集中管理
- 页面卸载时必须清理连接
- 流式状态不要无约束写入全局 store
- 长任务优先通过 query / adapter / runtime hook 抽象

## 14. 测试规范

- 测试文件：`*.test.ts` / `*.test.tsx`
- 纯逻辑优先单元测试
- UI 交互优先 Testing Library
- 稳定映射逻辑必须有测试：如 serializer、registry、adapter、renderer

## 15. 性能规范

- 合理使用 `React.memo`
- 仅在收益明确时使用 `useMemo` / `useCallback`
- 大页面和重模块可使用 `React.lazy`
- 定期关注 bundle 和页面交互性能
- 在 React 19 + Zustand 5 场景下，避免 selector 返回新对象导致循环订阅

## 16. 安全与环境变量

- 用户输入必须验证
- 渲染富文本或 HTML 时使用 DOMPurify
- 敏感信息只放环境变量
- 页面层不出现明文密钥逻辑

环境变量示例：

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_VERSION=0.9.8
```

## 17. Git 与协作规范

- 分支命名：`feature/*`、`fix/*`、`docs/*`、`refactor/*`
- 提交信息：Conventional Commits
- 提交前至少执行：

```bash
npm run lint
npx tsc --noEmit
```

## 18. 常用命令

```bash
npm install
npm run dev
npm run build
npm run lint
npm run build:themes
npx tsc --noEmit
```

## 19. 最后说明

这份文档负责说明“当前技术栈和实现边界应该怎么用”。更细的执行规范请继续参考：

- `AGENTS.md`
- `DEVELOPER_GUIDE.md`
- `docs/agent-frontend-rewrite-plan.md`
- `docs/agent-capability-completion-roadmap.md`
