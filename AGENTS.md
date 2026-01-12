# Repository Guidelines

## Project Overview
Multi-RAG Frontend - 一个基于 React 19 + TypeScript 5.8 + Vite 7 的智能对话和知识库管理前端应用，支持 Agent Canvas 可视化工作流、多格式文档预览和 MCP (Model Context Protocol) 集成。

## Project Structure & Module Organization

Web 客户端代码位于 `src/`，采用以下目录结构：

```
src/
├── api/           # API 层 (14 个模块)
│   ├── client.ts  # 统一 API 客户端 (认证、拦截器、错误处理)
│   ├── auth.ts, conversation.ts, knowledge.ts, llm.ts
│   ├── agent.ts, mcp.ts, mcp-chat.ts, document.ts
│   └── dialog.ts, environment.ts, system.ts
├── components/    # 可复用组件 (96+ 组件)
│   ├── ui/        # 48 个基础 UI 组件 (Radix UI 封装)
│   ├── vendor/ui/ # 12 个 Ant Design 风格组件
│   ├── chat/      # 17 个聊天组件 (消息、输入、工具调用)
│   ├── knowledge/ # 10 个知识库组件 (文档预览、模型选择)
│   ├── auth/      # 认证相关组件
│   ├── layout/    # 布局组件 (Header, Sidebar, Layout)
│   ├── environment/ # 环境管理组件
│   ├── forms/     # 表单字段组件
│   └── mcp/       # MCP 服务器配置组件
├── pages/         # 页面模块 (15 个功能模块)
│   ├── agent/     # Agent Canvas 系统 (可视化工作流)
│   ├── knowledge/ # 知识库管理 (32+ 文件)
│   ├── chat/      # 聊天页面
│   ├── settings/  # 设置页面 (模型提供商、MCP、安全)
│   ├── explore/   # 探索页面
│   ├── studio/    # 应用工作室
│   ├── ai-tools/  # AI 工具页面
│   └── dialog/, auth/, system/, home/
├── stores/        # Zustand 状态管理
│   └── auth.ts, chat.ts, conversation.ts, knowledge.ts, model.ts, ui.ts, environmentStore.ts
├── hooks/         # 自定义 Hooks
│   └── use-auth.ts, use-conversations.ts, use-dialog-apps.ts, use-system-status.ts, useDebouncedValue.ts
├── lib/           # 工具库
│   └── router.tsx, query-client.ts, utils.ts, toast.ts
├── themes/        # 设计系统
│   └── tokens.ts, build-themes.ts, light.css, dark.css
├── types/         # TypeScript 类型定义 (1,284+ 行)
├── constants/     # 常量定义
├── assets/        # 静态资源 (SVG 图标、图片)
└── styles/        # 全局样式
```

使用 `@/` 路径别名导入 `src/` 内的任何模块以保持导入路径稳定。

## Key Architecture Features

### Agent Canvas System
位于 `src/pages/agent/`，使用 @xyflow/react 实现的可视化工作流编辑器：
- 节点类型：Begin、Agent、Message、Retrieval、Splitter、Parser、Tool、Switch、Note 等
- 边缘编辑器、上下文菜单、工具栏
- DSL 构建和图形保存功能

### Document Preview System
支持多格式文档预览：
- PDF (react-pdf-highlighter)
- DOCX (docx-preview, mammoth)
- Excel (@js-preview/excel)
- PowerPoint (pptx-preview)

### Design System
`src/themes/` 包含完整的设计系统：
- 设计令牌定义 (`tokens.ts`)
- 自动主题生成 (`build-themes.ts`)
- Light/Dark 模式支持
- Tailwind CSS 语义化颜色映射

## Build, Test, and Development Commands
- `npm run dev` — 启动 Vite 开发服务器 (默认 http://localhost:5173)，支持热模块重载
- `npm run build` — 运行 TypeScript 项目检查 (`tsc -b`) 并使用 Vite 生成生产构建
- `npm run preview` — 在发布前预览生产构建进行冒烟测试
- `npm run lint` — 使用 ESLint 检查整个工作区；PR 前需解决所有警告
- `npm run build:themes` — 修改 `src/themes/` 后重新生成编译的主题文件

## Coding Style & Naming Conventions
遵循严格的 TypeScript 和 React 函数组件模式。使用两空格缩进、单引号和尾随逗号（由 ESLint 强制执行）。React 组件和 UI 原语使用 kebab-case 文件名（如 `status-indicator.tsx`），并通过本地 `index.ts` 桶导出共享入口点。将 Hooks 放在 `hooks/` 中并命名为 `useSomething`。优先使用 `@/` 绝对导入而非相对路径，导入顺序为：外部、内部、然后是样式，并利用 Tailwind 工具类加主题令牌保持样式一致性。

## Component Architecture Guidelines

### Presentational vs Container Components (展示与逻辑分离)
**强制规则**：组件必须明确区分职责，保持展示组件的纯粹性。

#### 展示组件 (Presentational Components)
- **定义**：叶子组件，只负责 UI 渲染和视觉呈现
- **特征**：
  - ✅ 只接收 props，通过 props 接收数据和回调函数
  - ✅ 使用受控组件模式（controlled components）
  - ✅ 可以包含样式和 UI 逻辑（动画、展开/收起等）
  - ❌ **禁止使用** `useState`、`useEffect`、`useRef`（除了 DOM 引用）
  - ❌ **禁止直接调用** API 或访问全局状态
  - ❌ **禁止包含**业务逻辑（数据抓取、状态管理、副作用）
- **位置**：`src/components/ui/`、`src/components/vendor/ui/`
- **命名规范**：使用描述性名称，如 `MessageBubble`、`DocumentCard`、`StatusBadge`

**示例**：
```typescript
// ✅ 正确：纯展示组件
interface MessageBubbleProps {
  content: string;
  sender: string;
  timestamp: string;
  isCurrentUser: boolean;
  onEdit?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  sender,
  timestamp,
  isCurrentUser,
  onEdit,
}) => {
  return (
    <div className={cn(
      'flex flex-col gap-space-xs p-space-base rounded-radius-lg',
      isCurrentUser ? 'bg-surface-accent' : 'bg-surface-secondary'
    )}>
      <div className="text-text-body-lg">{content}</div>
      <div className="flex justify-between text-text-caption">
        <span>{sender}</span>
        <span>{timestamp}</span>
      </div>
      {onEdit && <button onClick={onEdit}>编辑</button>}
    </div>
  );
};
```

```typescript
// ❌ 错误：展示组件中包含状态和副作用
export const MessageBubble: React.FC<MessageBubbleProps> = ({ messageId }) => {
  const [message, setMessage] = useState(null); // ❌ 禁止
  
  useEffect(() => {
    fetchMessage(messageId).then(setMessage); // ❌ 禁止
  }, [messageId]);
  
  return <div>{message?.content}</div>;
};
```

#### 容器组件 (Container Components)
- **定义**：负责业务逻辑、数据获取和状态管理的组件
- **特征**：
  - ✅ 可以使用所有 React Hooks
  - ✅ 调用 API、访问 Zustand stores、使用 TanStack Query
  - ✅ 包含业务逻辑和副作用处理
  - ✅ 将数据和回调函数通过 props 传递给展示组件
  - ⚠️ 尽量少包含 UI 代码，主要负责组合展示组件
- **位置**：`src/pages/`、`src/components/chat/`、`src/components/knowledge/`
- **命名规范**：使用功能性名称，如 `ChatContainer`、`KnowledgeListContainer`

**示例**：
```typescript
// ✅ 正确：容器组件负责逻辑，展示组件负责渲染
export const ChatContainer: React.FC = () => {
  const { messages, isLoading } = useChatStore();
  const [input, setInput] = useState('');
  const sendMessageMutation = useSendMessage();
  
  const handleSend = async () => {
    await sendMessageMutation.mutateAsync(input);
    setInput('');
  };
  
  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={sendMessageMutation.isPending}
      />
    </div>
  );
};
```

#### ESLint 规则强制执行
为确保展示组件的纯粹性，建议添加以下 ESLint 规则（需配置）：
```javascript
// eslint.config.js 中添加规则
{
  files: ['src/components/ui/**/*.tsx', 'src/components/vendor/ui/**/*.tsx'],
  rules: {
    'react-hooks/rules-of-hooks': 'off', // 允许不使用 hooks
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['@/api/*', '@/stores/*'],
        message: '展示组件禁止直接导入 API 或 stores'
      }]
    }]
  }
}
```

### Tailwind CSS Design Token Constraints (样式系统约束)
**强制规则**：禁止自由使用任意值，必须使用设计系统定义的令牌。

#### 设计令牌使用规范
项目的设计系统位于 `src/themes/`，包含：
- **颜色令牌**：`bg-surface-*`、`text-text-*`、`border-border-*`
- **间距令牌**：`p-space-*`、`m-space-*`、`gap-space-*`
- **圆角令牌**：`rounded-radius-*`
- **阴影令牌**：`shadow-elevation-*`

#### 禁止的用法 ❌
```typescript
// ❌ 禁止：使用任意数值
<div className="p-4 m-8 bg-blue-600 text-[#333333] rounded-[12px]" />

// ❌ 禁止：使用 Tailwind 原生数值系统
<div className="p-4 m-8 gap-6 rounded-lg" />

// ❌ 禁止：使用任意颜色值
<div className="bg-[#1a2b3c] text-[rgb(255,100,50)]" />
```

#### 正确的用法 ✅
```typescript
// ✅ 正确：使用设计令牌
<div className="p-space-base m-space-lg bg-surface-accent text-text-body rounded-radius-md shadow-elevation-low" />

// ✅ 正确：使用语义化令牌
<button className="px-space-md py-space-sm bg-surface-primary hover:bg-surface-primary-hover text-text-primary rounded-radius-lg">
  提交
</button>
```

#### 允许的例外情况
仅在以下场景允许使用 Tailwind 原生类：
- 布局属性：`flex`、`grid`、`absolute`、`relative`
- 尺寸属性：`w-full`、`h-screen`、`max-w-*`（使用预设值）
- 响应式前缀：`sm:`、`md:`、`lg:`、`xl:`
- 状态前缀：`hover:`、`focus:`、`active:`、`disabled:`

#### ESLint + Stylelint 规则强制执行
建议配置 `eslint-plugin-tailwindcss` 或自定义规则：
```javascript
// eslint.config.js
{
  plugins: ['tailwindcss'],
  rules: {
    'tailwindcss/no-arbitrary-value': 'error', // 禁止任意值
    'tailwindcss/enforces-negative-arbitrary-values': 'error',
  }
}
```

#### 设计令牌更新流程
当需要新的样式变体时：
1. **优先**：检查 `src/themes/tokens.ts` 是否已有合适的令牌
2. **如果没有**：向产品/设计团队确认是否需要添加到设计系统
3. **禁止**：自行创建临时的任意值绕过设计系统
4. **添加新令牌后**：运行 `npm run build:themes` 重新生成主题文件

### Design System Integration (设计系统集成)

#### 主题令牌优先级
在编写样式时，按以下优先级选择类名：
1. **语义化令牌**（最优先）：`bg-surface-primary`、`text-text-body`
2. **功能性令牌**：`p-space-base`、`gap-space-md`
3. **Tailwind 布局类**：`flex`、`grid`、`absolute`
4. **禁止任意值**：避免 `[#hex]`、`[12px]` 等

#### 响应式设计规范
```typescript
// ✅ 正确：使用断点前缀 + 设计令牌
<div className="p-space-sm md:p-space-base lg:p-space-lg bg-surface-primary">
  响应式内容
</div>

// ❌ 错误：混用任意值
<div className="p-2 md:p-[16px] lg:p-8">
  响应式内容
</div>
```

#### 深色模式支持
项目支持自动深色模式切换，所有颜色令牌已内置深色变体：
```typescript
// ✅ 自动适配深色模式
<div className="bg-surface-primary text-text-primary border border-border-default">
  内容
</div>

// ❌ 不要手动添加 dark: 前缀
<div className="bg-white dark:bg-gray-900">
  内容
</div>
```

## State Management
- **Zustand** - 客户端状态管理，支持持久化
- **TanStack Query** - 服务器状态管理和缓存
- **React Hook Form + Zod** - 表单验证

## Key Dependencies
### Core
- React 19.1, TypeScript 5.8, Vite 7.0
- Zustand 5.0, TanStack Query 5.83, React Router DOM 7.7

### UI
- Tailwind CSS 3.4 (含 Forms、Typography、Scrollbar 插件)
- Radix UI (20+ 原语), Ant Design 6.0
- Lucide React (图标), class-variance-authority (样式变体)

### Specialized
- @xyflow/react 12.9 (Agent Canvas)
- @monaco-editor/react 4.7 (代码编辑)
- Recharts 3.1 (数据可视化)
- DOMPurify 3.3 (XSS 防护)

## Environment Configuration
复制 `.env.example` 到 `.env.local` 并配置：
```bash
VITE_API_BASE_URL=http://localhost:8000  # 后端 API 端点
VITE_WS_BASE_URL=ws://localhost:8000     # WebSocket 端点
```

## Testing Guidelines
自动化测试尚未纳入工具链；对于新功能，在可行时添加 Vitest + React Testing Library 覆盖（`feature-name.test.tsx`）并记录执行的手动 QA。将集成模拟放在相关目录下，将测试夹具保存在 `__fixtures__/` 文件夹中。在引入测试套件之前，通过 `npm run dev` 在本地验证关键流程，并在 PR 描述中附上复现步骤。

## Figma MCP Integration (设计稿加速开发)

### 使用 Figma MCP 生成首版展示代码
当设计团队在 Figma 中完成 UI 设计后，可以使用 MCP (Model Context Protocol) 拉取设计稿并生成第一版展示代码，加速开发流程。

#### 使用流程
1. **确认设计稿就绪**：设计师在 Figma 中标注完成，组件已命名规范化
2. **通过 MCP 拉取设计**：使用 MCP 工具读取 Figma 设计稿的结构和样式
3. **生成展示组件代码**：AI 根据设计稿生成符合项目规范的 React 组件
4. **人工审查和调整**：开发者检查生成的代码，确保符合项目约束

#### 强制约束规则
**必须遵守的规范**（代理生成代码时必须遵循）：

##### 1. 样式系统约束
```typescript
// ✅ 正确：使用项目设计令牌
<button className="px-space-md py-space-sm bg-surface-primary text-text-primary rounded-radius-lg">
  提交
</button>

// ❌ 错误：使用 Figma 中的任意值
<button className="px-[20px] py-[10px] bg-[#1a73e8] text-white rounded-[8px]">
  提交
</button>
```

##### 2. 图标库约束
项目使用 **Lucide React** 作为统一图标库：
```typescript
import { Search, User, Settings } from 'lucide-react';

// ✅ 正确：使用 Lucide React 图标
<Search className="w-icon-md h-icon-md text-text-secondary" />

// ❌ 错误：使用其他图标库或自定义 SVG
<PhosphorIcon /> // ❌ 不要使用 Phosphor
<CustomSVG /> // ❌ 不要自行创建 SVG
```

##### 3. 组件库约束
项目使用 **Radix UI + 自定义封装** 作为基础组件：
```typescript
// ✅ 正确：使用项目现有组件
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';

// ❌ 错误：引入新的 UI 库
import { Button } from 'antd'; // ❌ 不要引入未经批准的库
import { Modal } from 'react-modal'; // ❌ 使用项目已有的 Dialog
```

##### 4. 颜色映射规则
当 Figma 设计稿中使用了自定义颜色时，必须映射到最接近的设计令牌：

| Figma 颜色类型 | 映射到设计令牌 |
|---------------|---------------|
| Primary 品牌色 | `bg-surface-accent`、`text-text-accent` |
| Background 背景色 | `bg-surface-primary`、`bg-surface-secondary` |
| Text 文本色 | `text-text-primary`、`text-text-secondary` |
| Border 边框色 | `border-border-default`、`border-border-subtle` |
| Success/Error/Warning | `bg-status-success`、`bg-status-error`、`bg-status-warning` |

**如果无法找到合适的映射**：
- ❌ **禁止**：自行创建任意颜色值（如 `bg-[#abc123]`）
- ✅ **正确做法**：在代码中添加注释，标注 Figma 原始值，并向用户/设计师提出疑问：

```typescript
// TODO: Figma 设计稿使用 #5E3AEE，但设计系统中无对应令牌
// 请确认：是否应该添加到 src/themes/tokens.ts？
// 临时使用最接近的 bg-surface-accent
<div className="bg-surface-accent">
```

##### 5. 间距和尺寸映射
| Figma 间距 | 映射到设计令牌 |
|-----------|---------------|
| 4px | `space-xs` |
| 8px | `space-sm` |
| 12px | `space-base` |
| 16px | `space-md` |
| 24px | `space-lg` |
| 32px | `space-xl` |
| 其他值 | ⚠️ 需要确认是否添加到设计系统 |

#### 生成代码的质量标准
MCP 生成的代码必须：
- ✅ 符合展示/逻辑分离原则（生成纯展示组件）
- ✅ 使用项目设计令牌，不使用任意值
- ✅ 使用 Lucide React 图标库
- ✅ 使用项目现有的 UI 组件（`@/components/ui/*`）
- ✅ 包含 TypeScript 类型定义
- ✅ 遵循项目命名规范（kebab-case 文件名）
- ✅ 包含必要的 props 接口定义

#### 无法匹配现有规范时的处理
当 Figma 设计稿与项目设计系统存在差异时：
1. **优先**：在生成的代码中添加 `TODO` 注释，说明差异
2. **询问用户**：
   - "设计稿使用了 [具体值]，但设计系统中没有对应令牌，是否需要添加？"
   - "设计稿使用了 [图标库/组件库]，项目使用 Lucide React，是否需要切换？"
3. **禁止**：不经确认就引入新的依赖或创建临时变量
4. **记录决策**：将用户的决策记录到项目文档或设计系统说明中

#### 示例工作流
```bash
# 1. AI 读取 Figma 设计稿（通过 MCP）
读取组件：UserProfileCard
- 尺寸：320x200px
- 背景：#F5F5F5
- 文字：#333333, 16px, Inter
- 间距：padding 16px, gap 12px
- 圆角：8px

# 2. AI 映射到设计令牌
背景：#F5F5F5 → bg-surface-secondary
文字：#333333 → text-text-primary
间距：16px → p-space-md, gap-space-base
圆角：8px → rounded-radius-lg

# 3. AI 生成组件代码
export interface UserProfileCardProps {
  name: string;
  avatar: string;
  bio: string;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  name,
  avatar,
  bio,
}) => {
  return (
    <div className="flex flex-col gap-space-base p-space-md bg-surface-secondary rounded-radius-lg">
      <img src={avatar} alt={name} className="w-icon-2xl h-icon-2xl rounded-full" />
      <h3 className="text-text-primary text-body-lg">{name}</h3>
      <p className="text-text-secondary text-body-sm">{bio}</p>
    </div>
  );
};

# 4. 如果遇到无法映射的值
// TODO: Figma 使用 #5E3AEE 作为强调色，设计系统中无此颜色
// 请确认是否需要添加到 src/themes/tokens.ts 作为 accent-purple？
// 临时使用 bg-surface-accent
```

## Commit & Pull Request Guidelines
使用祈使语气的 Conventional Commit 前缀（`feat`、`fix`、`docs` 等），与现有历史保持一致（`fix: improve IME handling…`）。保持变更范围小，使每个提交讲述一个故事。每个 PR 应包含：简洁的摘要、链接的问题或任务 ID、UI 更新的截图或屏幕录制（浅色和深色主题）、适用时的主题重建说明，以及确认 `npm run lint` 和 `npm run build` 成功完成。
