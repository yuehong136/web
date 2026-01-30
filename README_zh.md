# Multi-RAG 前端

全面的基于 React 的前端应用程序，为 Multi-RAG 系统提供智能对话、知识库管理、AI 工具、MCP 集成、系统监控等功能。

## 🆕 最新更新

### Agent 画布系统（新功能）
- **🔧 可视化工作流构建器**: 基于 @xyflow/react 的节点式 Agent 设计
- **🤖 Agent 管理**: 通过可视化画布创建、配置和部署 AI Agent
- **🔄 工作流自动化**: 连接节点创建自动化 AI 管道

### 增强文档预览（新功能）
- **📄 多格式支持**: 浏览器内预览 PDF、DOCX、Excel (.xlsx)、PowerPoint (.pptx)
- **🔍 搜索高亮**: HighlightText 组件，基于 DOMPurify 的 XSS 安全关键词高亮
- **📊 文档块可视化**: 增强的搜索结果与高亮内容

### API 管理与文档
- **🔑 API 密钥管理**: 全面的 API 密钥 CRUD 操作，安全令牌处理
- **📚 OpenAPI 集成**: 交互式 API 文档，集成 Monaco 编辑器和实时测试
- **🌐 环境管理**: 完整的环境系统，支持变量解析和模板替换
- **🔄 拖拽界面**: 增强用户体验，支持可排序列表和直观交互
- **🛡️ 增强安全性**: Portal 基础下拉菜单、安全令牌重生成和访问控制

### 设计系统与性能优化
- **🎨 高级设计令牌系统**: 完整的 CSS 变量主题化与自动主题生成
- **⚡ 性能优化**: 优化 Think 状态组件，移除 backdrop-blur 提升性能
- **🌗 增强深色模式**: 改善所有组件的色彩一致性和视觉层次

### AI 与 MCP 集成
- **🤖 MCP 聊天增强**: 结构化输出支持，统一工具解析和改进的流式传输
- **🔧 MCP 服务器管理**: 全面的 MCP 服务器配置、测试和批量操作
- **📝 AI 工具扩展**: 自动填充工作台与文档集成，AI 驱动的实用工具

### 知识库功能
- **📚 高级文档管理**: 多格式支持，专业解析器（PDF、DOCX、Excel、PPTX、法律文档等）
- **🔍 增强搜索与探索**: 改进的搜索界面，HighlightText 组件与文档块可视化
- **📊 解析器配置**: 可视化解析器设置，针对不同文档类型的实时预览

### 开发者体验
- **🏗️ React 19 + Vite 7**: 最新框架版本与改进的 TypeScript 集成
- **🎯 组件架构**: 96 个功能组件 + 48 个 UI 组件与全面的设计系统
- **📱 响应式设计**: 移动优先方法与增强的无障碍性

## 🚀 核心功能

### 💬 智能对话
- **AI 驱动聊天**: 多 LLM 提供商的实时流式对话
- **MCP 聊天集成**: 增强的模型上下文协议工具与结构化输出
- **对话管理**: 历史记录、设置和上下文管理

### 📚 知识库系统
- **多格式文档支持**: PDF、DOCX、TXT、MD、演示文稿、法律文档、音频、图像
- **高级文档解析**: 针对不同内容类型的专业解析器与可视化配置
- **智能搜索检索**: 基于向量的搜索与块可视化和相关性评分
- **批量操作**: 高效的文档上传、下载、重命名和组织

### 🌐 环境管理
- **环境变量**: 全面的变量管理，支持模板替换功能
- **多环境支持**: 无缝切换开发、测试、生产环境
- **变量解析**: 高级模板系统，支持 `{{variable}}` 语法和验证
- **全局环境集成**: 系统级环境变量，支持分层解析
- **拖拽界面**: 直观的环境和变量管理，支持可排序列表

### 🤖 AI 工具与自动化
- **自动填充工作台**: AI 驱动的数据处理和表单填充，支持文档集成
- **文档处理**: 自动化内容提取和分析
- **工作流自动化**: 自定义 AI 驱动工作流（开发中）

### 🔧 Agent 工作流构建器
- **可视化画布编辑器**: 基于 @xyflow/react 的节点式工作流设计
- **Agent 管理**: 创建、配置和部署 AI Agent
- **工作流自动化**: 连接节点创建自动化 AI 管道
- **画布组件**: 专业化节点、连接线和边缘类型用于 Agent 设计

### 🔧 MCP 集成
- **服务器管理**: 配置、测试和监控 MCP 服务器
- **工具发现**: 浏览和利用不同服务器的 MCP 工具
- **批量操作**: 高效管理多个 MCP 连接

### 🏢 Studio 与开发
- **应用创建 Studio**: 构建和部署 AI 应用程序
- **对话管理**: 创建和管理对话流程
- **提示工程**: 高级提示编辑器与模板

### 📊 系统监控
- **实时仪表板**: 系统健康状态、性能指标和资源使用情况
- **任务执行监控**: 后台作业跟踪与详细图表
- **组件健康检查**: 数据库、Redis、存储和处理引擎状态

## 📋 技术栈

### 核心框架
- **框架**: React 19.1 + TypeScript 5.8
- **构建工具**: Vite 7.0
- **样式**: Tailwind CSS 3.4 + Tailwind Forms + Tailwind Typography + Tailwind Scrollbar

### 状态与数据
- **状态管理**: Zustand 5.0 + TanStack Query 5.83
- **路由**: React Router DOM 7.7
- **表单**: React Hook Form 7.60 + Zod 4.0 + Hookform Resolvers

### UI 与组件
- **UI 原语**: Radix UI (20+ 组件) + Ant Design 6.0 + @ant-design/x
- **图标**: Lucide React 0.525
- **样式工具**: Class Variance Authority + Tailwind Merge + CLSX
- **图表**: Recharts 3.1

### Agent 与工作流
- **画布编辑器**: @xyflow/react 12.9 用于节点式工作流构建
- **拖拽**: DND Kit 6.3+ 用于可排序界面

### 文档处理
- **PDF**: react-pdf-highlighter 6.1
- **DOCX**: docx-preview 0.3.7 + mammoth 1.11
- **Excel**: @js-preview/excel 1.7.14
- **PowerPoint**: pptx-preview 1.0.7

### 编辑器与工具
- **代码编辑器**: Monaco Editor 4.7 用于语法高亮
- **Markdown**: React Markdown 10.1 + markdown-it 14.1
- **文件处理**: React Dropzone 14.3
- **HTTP 客户端**: 基于 fetch 的自定义 API 客户端

### 安全与开发
- **XSS 防护**: DOMPurify 3.3
- **开发工具**: ESLint 9.30 + TypeScript ESLint 8.35

## 🏗️ 项目结构

```
src/
├── api/                    # API 客户端和类型（14 个模块）
│   ├── client.ts          # 基础 API 客户端（认证和错误处理）
│   ├── auth.ts            # 身份验证 API
│   ├── conversation.ts    # 聊天/对话 API
│   ├── knowledge.ts       # 知识库 API
│   ├── llm.ts             # LLM 提供商 API
│   ├── system.ts          # 系统监控 API
│   ├── environment.ts     # 环境管理 API
│   ├── agent.ts           # Agent 管理 API
│   ├── mcp.ts             # MCP 服务器 API
│   ├── mcp-chat.ts        # MCP 聊天服务 API
│   ├── document.ts        # 文档操作 API
│   ├── dialog.ts          # 对话/提示 API
│   └── index.ts           # API 导出
├── components/            # 可复用 UI 组件（96 个功能组件 + 48 个 UI 组件）
│   ├── ui/               # 基础 UI 组件（48 个组件）
│   │   ├── button.tsx    # 按钮组件（支持多种变体）
│   │   ├── input.tsx     # 表单输入组件
│   │   ├── card.tsx      # 卡片布局组件
│   │   ├── file-icon.tsx # 文件类型图标（40+ 类型）
│   │   ├── provider-icon.tsx # LLM 提供商图标
│   │   ├── theme-switcher.tsx # 深色/浅色模式切换
│   │   ├── task-executor-chart.tsx # 系统监控图表
│   │   └── ...           # 更多专业化 UI 组件
│   ├── auth/             # 身份验证组件
│   │   ├── AuthGuard.tsx # 路由保护组件
│   │   ├── AuthCarousel.tsx # 登录/注册轮播
│   │   └── ImageWithFallback.tsx # 带回退的图片加载
│   ├── knowledge/        # 知识库组件（10 个文件）
│   │   ├── DocumentPreview.tsx # 多格式预览（PDF、DOCX、Excel、PPTX）
│   │   ├── HighlightText.tsx # 搜索结果高亮，XSS 防护
│   │   ├── EmbeddingModelSelector.tsx # 向量模型选择
│   │   ├── RerankModelSelector.tsx # 重排模型选择
│   │   ├── ParserTypeSelector.tsx # 文档解析器选择
│   │   └── QuickEditModal.tsx # 快速编辑功能
│   ├── chat/             # 聊天界面组件（19 个文件）
│   │   ├── ChatInput.tsx  # 聊天输入（支持附件）
│   │   ├── ChatMessage.tsx # 消息渲染
│   │   ├── ChatHeader.tsx # 聊天头部控制
│   │   ├── ChatModelSelector.tsx # 模型选择
│   │   ├── MarkdownRenderer.tsx # Markdown 内容渲染
│   │   ├── ToolCallDisplay.tsx # 工具调用可视化
│   │   ├── InlineSourceRef.tsx # 内联源引用
│   │   ├── ReferenceDocumentList.tsx # 引用文档列表
│   │   └── WelcomeMessage.tsx # 聊天欢迎界面
│   ├── mcp/              # MCP 集成组件
│   │   └── MCPServerForm.tsx # MCP 服务器配置
│   ├── environment/      # 环境管理组件
│   │   ├── EnvironmentDetail.tsx # 环境详情视图
│   │   ├── EnvironmentList.tsx # 环境列表（支持拖拽）
│   │   ├── EnvironmentVariablesTable.tsx # 变量管理表格
│   │   ├── ModernEnvironmentSelector.tsx # 环境选择界面
│   │   ├── NewEnvironmentManager.tsx # 环境创建/编辑
│   │   └── index.ts       # 环境组件导出
│   ├── forms/            # 专业化表单组件
│   │   ├── CommonFormFields.tsx # 通用表单输入
│   │   ├── GraphRagFormFields.tsx # Graph RAG 配置
│   │   ├── RaptorFormFields.tsx # RAPTOR 算法设置
│   │   └── AutoKeywordsFormField.tsx # 自动关键词提取
│   └── layout/           # 布局组件
│       ├── Layout.tsx    # 主应用布局（含认证守卫）
│       ├── Header.tsx    # 应用头部（含用户菜单）
│       └── Sidebar.tsx   # 导航侧边栏（现代化设计）
├── pages/                # 应用程序页面（97 个文件，34 个模块）
│   ├── auth/             # 身份验证
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── dashboard/        # 仪表板
│   │   └── DashboardPage.tsx
│   ├── chat/             # 聊天界面
│   │   └── ChatPage.tsx
│   ├── agent/            # Agent 工作流构建器
│   │   ├── AgentListPage.tsx # Agent 列表和管理
│   │   ├── AgentCanvasPage.tsx # 可视化工作流画布
│   │   └── components/   # 画布节点、边缘、控件
│   ├── knowledge/        # 知识库管理
│   │   ├── KnowledgeListPage.tsx # 知识库列表和管理
│   │   ├── KnowledgeCreatePage.tsx # 知识库创建向导
│   │   ├── KnowledgeImportPage.tsx # 文档导入
│   │   ├── KnowledgeDetailLayout.tsx # 知识库详情布局
│   │   ├── KnowledgeDocumentsPage.tsx # 文档管理
│   │   ├── KnowledgeSearchPage.tsx # 搜索界面
│   │   ├── KnowledgeSettingsPage.tsx # 知识库配置
│   │   ├── DocumentChunksPage.tsx # 文档块查看器
│   │   └── settings/     # 解析器配置组件
│   │       ├── configuration/ # 专业化解析器配置
│   │       ├── ParserVisualizationPanel.tsx
│   │       └── configuration-form-container.tsx
│   ├── ai-tools/         # AI 工具和实用程序
│   │   ├── AIToolsHomePage.tsx # 工具主页
│   │   ├── AutoFillWorkbenchPage.tsx # 自动填充工作台
│   │   └── ref/          # 参考实现
│   ├── studio/           # 应用创建工作室
│   │   ├── StudioPage.tsx # 工作室主页
│   │   ├── CreateAppPage.tsx # 应用创建向导
│   │   └── components/   # 工作室专用组件
│   ├── dialog/           # 对话管理
│   │   ├── DialogListPage.tsx # 对话列表
│   │   └── PromptEditorPage.tsx # 提示编辑
│   ├── explore/          # 内容探索
│   │   └── ExplorePage.tsx # 探索界面
│   ├── system/           # 系统监控
│   │   └── SystemPage.tsx # 系统仪表板
│   ├── settings/         # 应用设置
│   │   ├── SettingsLayout.tsx # 设置布局
│   │   ├── ProfilePage.tsx # 用户资料
│   │   ├── SecurityPage.tsx # 安全设置
│   │   ├── ModelProvidersPage.tsx # LLM 提供商配置
│   │   ├── MCPServersPage.tsx # MCP 服务器管理
│   │   ├── MCPToolsPage.tsx # MCP 工具浏览器
│   │   ├── MCPTestPage.tsx # MCP 测试界面
│   │   ├── MCPBatchPage.tsx # MCP 批量操作
│   │   └── ApiKeysPage.tsx # 全面的 API 密钥管理，支持 OpenAPI 文档
│   ├── MCPChatPage.tsx   # MCP 增强聊天
│   ├── MCPDashboard.tsx  # MCP 仪表板
│   └── theme-demo/       # 主题演示
├── stores/               # Zustand 状态管理（8 个 Store）
│   ├── auth.ts           # 身份验证状态（令牌、用户、租户）
│   ├── ui.ts             # UI 状态（侧边栏、主题、通知）
│   ├── chat.ts           # 聊天状态和历史
│   ├── conversation.ts   # 对话管理和流式状态
│   ├── knowledge.ts      # 知识库状态
│   ├── model.ts          # 模型配置
│   ├── environmentStore.ts # 环境和变量管理
│   └── index.ts          # 存储初始化（initializeStores、resetAllStores）
├── themes/               # 高级设计系统
│   ├── tokens.ts         # 设计令牌定义
│   ├── theme-generator.ts # 自动主题生成
│   ├── build-themes.ts   # 主题构建脚本
│   ├── tailwind-vars.ts  # Tailwind CSS 集成
│   ├── light.css         # 浅色主题 CSS 变量
│   ├── dark.css          # 深色主题 CSS 变量
│   └── *.md              # 设计系统文档
├── hooks/                # 自定义 React Hooks（5 个文件）
│   ├── use-auth.ts       # 身份验证 Hook
│   ├── use-conversations.ts # 对话 Hook（8KB）
│   ├── use-dialog-apps.ts # 对话/应用管理 Hook
│   ├── use-system-status.ts # 系统状态 Hook
│   └── useDebouncedValue.ts # 防抖工具 Hook
├── lib/                  # 核心工具和配置
│   ├── router.tsx        # React Router 配置（嵌套路由）
│   ├── query-client.ts   # TanStack Query 设置
│   ├── utils.ts          # 工具函数
│   └── toast.ts          # 通知系统
├── utils/                # 附加工具
│   └── variableResolver.ts # 环境变量解析和模板化
├── types/                # TypeScript 类型定义
│   ├── api.ts            # 全面的 API 类型（1,284 行）
│   └── index.ts          # 类型导出
├── constants/            # 应用程序常量
│   └── index.ts          # 路由、API URL、文件类型等
└── assets/               # 静态资源
    ├── react.svg         # React 图标
    └── svg/              # SVG 图标库
        └── file-icon/    # 文件类型图标（40+ 格式）
```

## 🛠️ 开发设置

### 环境要求

- Node.js 18+ 
- npm 或 yarn
- 现代浏览器

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd web
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境配置**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 配置您的设置
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

   应用程序将在 `http://localhost:5173` 可用

### 可用脚本

```bash
# 开发
npm run dev          # 启动开发服务器（localhost:5173，支持外部访问）
npm run build        # 构建生产版本（TypeScript + Vite）
npm run preview      # 预览生产版本
npm run lint         # 运行 ESLint 代码质量检查

# 设计系统
npm run build:themes # 从设计令牌生成 CSS 主题文件

# 类型检查与质量
npx tsc --noEmit     # TypeScript 类型检查（不输出文件）
```

## ⚙️ 配置

### 环境变量

在根目录创建 `.env.local` 文件：

```env
VITE_API_BASE_URL=http://localhost:8000  # 后端 API URL
```

### API 配置

应用程序使用自定义 API 客户端 (`src/api/client.ts`)，提供：

- 自动令牌管理
- 请求/响应拦截器
- 错误处理
- 超时管理
- 文件上传支持

### 🔧 设置与配置
- **用户管理**: 个人资料、安全设置、API 密钥和身份验证设置
- **LLM 提供商**: 配置多个 AI 提供商（OpenAI、Anthropic、Claude 等）
- **API 密钥管理**: 全功能 API 密钥管理，支持 CRUD 操作、搜索和分页
- **API 文档**: 交互式 OpenAPI 文档系统，集成 Monaco 编辑器
- **环境管理**: 完整的环境变量系统，支持模板替换
- **MCP 集成**: 服务器管理、工具发现、测试和批量操作
- **安全与隐私**: 高级安全设置和访问控制
- **主题系统**: 浅色/深色模式与高级设计令牌自定义

## 🎨 设计系统与 UI

### 高级设计系统
- **设计令牌**: 全面的令牌系统，支持自动化 CSS 生成
- **主题支持**: 高级浅色/深色模式，使用 CSS 自定义属性
- **组件库**: 96 个功能组件 + 48 个 UI 组件，具有一致的样式
- **图标系统**: 文件类型图标（40+ 格式）、提供商图标和 SVG 资源

### 关键 UI 组件
- **表单系统**: 高级表单组件，结合 React Hook Form + Zod 验证
- **代码编辑器**: Monaco Editor 集成，支持只读模式和语法高亮
- **数据可视化**: 任务执行器图表、系统状态卡片和指标显示
- **API 文档**: 交互式 OpenAPI 查看器，支持请求/响应格式化
- **文件管理**: 文件图标、拖拽上传、批量操作界面
- **导航**: 现代侧边栏，浮动卡片设计和响应式布局
- **身份验证**: 基于轮播的登录/注册，带图片回退

### 布局架构
- **响应式设计**: 使用 Tailwind CSS 的移动优先方法
- **组件变体**: 使用 Class Variance Authority 实现系统化样式
- **无障碍性**: ARIA 标签、键盘导航和屏幕阅读器支持
- **性能**: 移除 backdrop-blur 和高效 CSS 优化渲染

## 📊 状态管理

### Zustand 存储
- **`auth`**: 用户身份验证、JWT 令牌、用户资料、租户信息
- **`ui`**: UI 状态管理（侧边栏可见性、通知、主题偏好）
- **`chat`**: 聊天界面状态和消息管理
- **`conversation`**: 对话历史、设置和流式状态
- **`knowledge`**: 知识库管理、文档状态、搜索结果
- **`model`**: LLM 提供商配置和模型设置
- **`environmentStore`**: 环境和变量管理，支持模板解析

### 存储特性
- **持久化**: 使用 localStorage 自动状态持久化
- **中间件**: DevTools 集成用于调试
- **类型安全**: 完整的 TypeScript 支持和正确的类型定义
- **初始化**: 集中式存储初始化系统

### TanStack Query
- API 状态管理
- 缓存和同步
- 后台重新获取
- 乐观更新

## 🔒 安全特性

- JWT 令牌身份验证
- 路由保护
- XSS 防护
- CSRF 防护
- 安全 API 通信
- 使用 Zod 进行输入验证

## 📈 性能优化

- 使用 React.lazy 进行代码分割
- 图片优化
- Bundle 大小优化
- 使用 React.memo 高效重新渲染
- API 响应缓存
- 防抖搜索输入

## 🌍 浏览器支持

- Chrome (最新 2 个版本)
- Firefox (最新 2 个版本)  
- Safari (最新 2 个版本)
- Edge (最新 2 个版本)

## 🤝 贡献指南

1. Fork 仓库
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -m 'feat: 添加新功能'`
4. 推送到分支: `git push origin feature/new-feature`
5. 提交 pull request

### 提交约定

遵循 [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - 新功能
- `fix:` - 错误修复
- `docs:` - 文档更改
- `style:` - 代码样式更改
- `refactor:` - 代码重构
- `test:` - 测试添加/修改
- `chore:` - 构建过程或辅助工具更改

## 📄 许可证

本项目为专有软件。保留所有权利。

## 📞 支持

如需支持和问题咨询：
- 在仓库中创建 issue
- 查看文档
- 联系开发团队

---

**版本**: 0.9.8 | 使用 ❤️ 构建，基于 React 19 + TypeScript 5.8 + Vite 7 + @xyflow/react

## 🏗️ 架构亮点

- **现代技术栈**: React 19、Vite 7、TypeScript 5.8 与最新生态系统工具
- **Agent 画布**: 基于 @xyflow/react 的可视化工作流构建器，用于节点式 Agent 设计
- **设计系统**: 高级主题化，自动化 CSS 生成和设计令牌
- **状态管理**: Zustand + TanStack Query 实现最佳客户端/服务器状态
- **文档处理**: 多格式预览（PDF、DOCX、Excel、PPTX），浏览器内渲染
- **MCP 集成**: 全面的模型上下文协议支持
- **安全性**: 基于 DOMPurify 的 XSS 防护，Zod 输入验证
- **性能**: 优化的包大小、高效渲染和响应式设计
- **开发者体验**: TypeScript 优先、全面工具链和现代实践