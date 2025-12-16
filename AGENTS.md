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

## Commit & Pull Request Guidelines
使用祈使语气的 Conventional Commit 前缀（`feat`、`fix`、`docs` 等），与现有历史保持一致（`fix: improve IME handling…`）。保持变更范围小，使每个提交讲述一个故事。每个 PR 应包含：简洁的摘要、链接的问题或任务 ID、UI 更新的截图或屏幕录制（浅色和深色主题）、适用时的主题重建说明，以及确认 `npm run lint` 和 `npm run build` 成功完成。
