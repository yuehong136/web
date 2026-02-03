# Repository Guidelines

## 项目概述

Multi-RAG Frontend - React 19 + TypeScript 5.8 + Vite 7 智能对话和知识库管理前端。

**技术栈**: Zustand (客户端状态) + TanStack Query (服务器状态) + React Router 7 + Tailwind CSS + Radix UI

## 目录结构

```
src/
├── api/           # API 客户端（按领域划分）
├── components/    # 可复用组件
│   ├── ui/        # 48 个基础 UI 组件（Radix UI 封装）
│   ├── chat/      # 聊天组件
│   └── knowledge/ # 知识库组件
├── pages/         # 页面模块
├── stores/        # Zustand stores
├── hooks/         # TanStack Query hooks（use-*-request.ts）
├── themes/        # 设计令牌和主题生成
└── types/         # TypeScript 类型定义
```

使用 `@/` 路径别名导入。

## 命令

```bash
npm run dev          # 开发服务器 (localhost:5173)
npm run build        # 生产构建
npm run lint         # ESLint 检查
npm run build:themes # 重新生成主题 CSS
```

## 文件组织（强制规范）

### 文件大小限制

| 大小 | 状态 | 操作 |
|-----|------|-----|
| < 300 行 | ✅ 理想 | - |
| 300-400 | ⚠️ 警告 | 考虑拆分 |
| 400-600 | 🔶 注意 | 计划重构 |
| > 600 | ❌ 禁止 | 必须立即拆分 |

**技术债务**: `ApiKeysPage.tsx` (3412), `DocumentChunksPage.tsx` (2241), `CreateAppPage.tsx` (2178), `ExplorePage.tsx` (2048)

### 模块结构

**简单** (< 200 行): 单文件 `component.tsx`

**中等** (200-400 行): 目录 + 拆分文件
```
message-item/
├── index.tsx      # 主组件 + 导出
├── hooks.ts       # 组件 hooks
└── sub-component.tsx
```

**复杂** (400+ 行): 完整模块
```
document-preview/
├── index.tsx      # 入口，导出所有
├── types.ts       # 接口定义
├── hooks.ts       # 共享 hooks
├── constants.ts   # 常量
├── utils.ts       # 工具函数
├── pdf-preview.tsx
└── components/    # 子组件
```

### 命名规范

| 类型 | 文件 | 导出 |
|-----|-----|-----|
| 组件 | `kebab-case/` | `PascalCase` |
| Hook | `use-*.ts` | `useCamelCase` |
| 类型 | `types.ts` | - |
| 常量 | `constants.ts` | - |

### Hook 命名规范

| 用途 | 模式 | 示例 |
|-----|------|-----|
| 查询 | `useFetch*`, `useGet*` | `useFetchKnowledgeList` |
| 变更 | `useCreate*`, `useUpdate*`, `useDelete*` | `useCreateConversation` |
| UI 状态 | `useSet*`, `useShow*` | `useSetModalState` |

### 常量：使用 TypeScript 枚举

```typescript
// ✅ 正确：使用枚举定义常量
export enum RunningStatus {
  UNSTART = '0',
  RUNNING = '1',
  DONE = '3',
  FAIL = '4',
}

// ❌ 避免：普通对象或魔法字符串
const status = { running: '1', done: '3' };
if (doc.status === '1') { ... }
```

### 重构顺序
1. 提取 hooks → `hooks/use-*.ts`
2. 提取子组件
3. 提取类型 → `types.ts`
4. 提取常量 → `constants.ts`

## 组件架构

### 展示 vs 容器（强制分离）

**展示组件** (`src/components/ui/`):
- ✅ 纯展示，只接收 props
- ❌ 禁止: `useState`, `useEffect`, API 调用, store 访问

**容器组件** (`src/pages/`, 功能组件):
- ✅ 业务逻辑, hooks, API, stores
- ✅ 组合展示组件

```typescript
// ✅ 展示组件
export const MessageBubble: React.FC<Props> = ({ content, sender }) => (
  <div className="p-space-base bg-surface-secondary rounded-radius-lg">
    <div>{content}</div>
    <span className="text-text-caption">{sender}</span>
  </div>
);

// ✅ 容器组件
export const ChatContainer: React.FC = () => {
  const { messages } = useChatStore();
  const mutation = useSendMessage();
  return <MessageList messages={messages} onSend={mutation.mutate} />;
};
```

## 设计令牌（强制 - 禁止任意值）

### 必须使用

| 类别 | ✅ 使用 | ❌ 禁止 |
|-----|-------|--------|
| 颜色 | `bg-surface-primary`, `text-text-body` | `bg-[#1a73e8]`, `bg-blue-600` |
| 间距 | `p-space-base`, `gap-space-md` | `p-4`, `p-[20px]` |
| 圆角 | `rounded-radius-lg` | `rounded-lg`, `rounded-[12px]` |
| 阴影 | `shadow-elevation-low` | `shadow-md` |

### 允许例外
- 布局: `flex`, `grid`, `absolute`, `relative`
- 尺寸: `w-full`, `h-screen`, `max-w-*`
- 前缀: `sm:`, `md:`, `hover:`, `focus:`

### 令牌参考 (`src/themes/tokens.ts`)
- **颜色**: `surface-*`, `text-*`, `border-*`, `status-*`
- **间距**: `space-xs/sm/base/md/lg/xl/2xl`
- **圆角**: `radius-sm/md/lg/xl/full`
- **阴影**: `elevation-low/medium/high`
- **图标**: `icon-sm/md/lg/xl/2xl`

深色模式: 自动适配，禁止使用 `dark:` 前缀。

## 状态管理

**服务器状态** → TanStack Query (`src/hooks/use-*-request.ts`)
**客户端状态** → Zustand (`src/stores/`) - 仅 UI 偏好

```typescript
// ❌ 禁止 - 导致配额超限
persist({ knowledgeBases: [], conversations: [] }, { name: 'storage' })

// ✅ 正确
persist({ theme: 'light', sidebarCollapsed: false }, { name: 'ui-storage' })
```

```typescript
// ❌ 旧方式
useEffect(() => { loadKnowledgeBases(params) }, [params])

// ✅ 新方式
const { knowledgeBases, isLoading } = useFetchKnowledgeList(params)
```

## 性能优化

### 记忆化规则

```typescript
// ✅ 导出组件使用 memo 防止不必要的重渲染
export default memo(MyComponent);

// ✅ 缓存昂贵的计算
const filteredList = useMemo(() => 
  list.filter(item => item.status === status), [list, status]);

// ✅ 缓存传递给子组件的回调
const handleClick = useCallback(() => doSomething(id), [id]);
```

### 路由懒加载

```typescript
// ✅ 页面组件必须懒加载
const KnowledgePage = lazy(() => import('@/pages/knowledge'));

// 路由配置需包含错误边界
{
  path: '/knowledge',
  element: <Suspense fallback={<Loading />}><KnowledgePage /></Suspense>,
  errorElement: <ErrorFallback />,
}
```

## 错误处理

### 错误边界（页面必需）

每个路由必须有 `errorElement`，创建可复用的 `ErrorFallback`:

```typescript
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

## Figma MCP 集成

生成代码时的约束：

1. **映射到设计令牌** - 禁止使用 Figma 任意值
2. **使用 Lucide React** - 唯一允许的图标库
3. **使用 `@/components/ui/*`** - 禁止引入新 UI 库
4. **生成展示组件** - 纯展示，包含 props 接口

**Figma → 令牌映射**:
| Figma | 令牌 |
|-------|-----|
| 4/8/12/16/24/32px | `space-xs/sm/base/md/lg/xl` |
| Primary | `surface-accent`, `text-accent` |
| Background | `surface-primary/secondary` |
| Text | `text-primary/secondary` |

无法映射时: 添加 TODO 注释，询问确认，使用最接近的令牌。

## 依赖

**核心**: React 19.1, TypeScript 5.8, Vite 7.0, Zustand 5.0, TanStack Query 5.83

**UI**: Tailwind CSS 3.4, Radix UI, Ant Design 6.0, Lucide React

**专用**: @xyflow/react (Agent Canvas), @monaco-editor/react, Recharts, DOMPurify

## 环境配置

复制 `.env.example` 到 `.env.local`:
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

## Git 规范

使用 Conventional Commit: `feat`, `fix`, `docs` 等。PR 需包含：摘要、截图（浅色/深色主题）、确认 lint 和 build 通过。
