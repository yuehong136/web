# Multi-RAG 前端

基于 React 构建的现代化前端应用程序，为 Multi-RAG 系统提供智能对话、知识库管理、系统监控等功能。

## 🆕 v0.6.1 版本新特性

- **🔧 增强文档管理**: 高级批量操作、文件上传/下载、重命名功能
- **📝 文档解析控制**: 集成文档处理状态和控制功能
- **🎨 现代化侧边栏设计**: 新的浮动卡片设计，改善导航体验
- **🛠️ 向量模型选择器修复**: 解决了嵌入模型下拉回显问题和动态 SVG 加载
- **📚 完整的知识库管理**: 完整的 CRUD 操作、文档上传、搜索和设置功能
- **🎨 增强的 UI 组件**: 40+ UI 组件，支持 40+ 种文件类型图标
- **🔧 LLM 提供商集成**: 支持多种 LLM 提供商的配置管理
- **📊 高级系统监控**: 实时系统状态和任务执行器图表监控
- **🏗️ 架构升级**: 升级到 React 19、Vite 7 和最新依赖
- **🎯 更好的开发体验**: 完善的 TypeScript 类型定义，改进的错误处理

## 🚀 主要特性

- **智能对话**：AI 驱动的聊天界面，支持实时流式响应
- **知识库管理**：文档上传、处理和智能检索
- **系统监控**：实时系统状态和任务执行器监控
- **模型管理**：支持多种 LLM 提供商和配置
- **MCP 服务器**：模型上下文协议服务器管理
- **用户管理**：身份验证和个人资料管理
- **响应式设计**：使用 Tailwind CSS 的移动优先设计

## 📋 技术栈

- **框架**: React 19.1 + TypeScript 5.8
- **构建工具**: Vite 7.0
- **样式**: Tailwind CSS 3.4 + Tailwind Forms + Tailwind Typography
- **状态管理**: Zustand 5.0 + TanStack Query 5.8
- **路由**: React Router DOM 7.7
- **图表**: Recharts 3.1
- **表单**: React Hook Form 7.6 + Zod 4.0 + Hookform Resolvers
- **图标**: Lucide React 0.525
- **UI 组件**: Class Variance Authority + Tailwind Merge + CLSX
- **文件处理**: React Dropzone 14.3
- **HTTP 客户端**: 基于 fetch 的自定义 API 客户端
- **开发工具**: ESLint 9.30 + TypeScript ESLint 8.35

## 🏗️ 项目结构

```
src/
├── api/                    # API 客户端和类型
│   ├── client.ts          # 基础 API 客户端（认证和错误处理）
│   ├── auth.ts            # 身份验证 API
│   ├── conversation.ts    # 聊天/对话 API
│   ├── knowledge.ts       # 知识库 API
│   ├── llm.ts             # LLM 提供商 API
│   ├── system.ts          # 系统监控 API
│   └── index.ts           # API 导出
├── components/            # 可复用 UI 组件
│   ├── ui/               # 基础 UI 组件（40+ 组件）
│   │   ├── button.tsx    # 按钮组件（支持多种变体）
│   │   ├── input.tsx     # 表单输入组件
│   │   ├── card.tsx      # 卡片布局组件
│   │   ├── modal.tsx     # 模态框组件
│   │   ├── table.tsx     # 数据表格组件
│   │   ├── file-icon.tsx # 文件类型图标（40+ 类型）
│   │   ├── avatar.tsx    # 用户头像组件
│   │   ├── badge.tsx     # 状态徽章组件
│   │   ├── checkbox.tsx  # 表单复选框组件
│   │   ├── dropdown.tsx  # 下拉菜单组件
│   │   ├── tooltip.tsx   # 工具提示组件
│   │   └── ...           # 更多 UI 组件
│   ├── auth/             # 身份验证组件
│   │   └── AuthGuard.tsx # 路由保护组件
│   ├── knowledge/        # 知识库组件
│   │   ├── EmbeddingModelSelector.tsx # 嵌入模型选择器
│   │   └── QuickEditModal.tsx # 快速编辑模态框
│   ├── forms/            # 表单组件
│   ├── feature/          # 功能特定组件
│   └── layout/           # 布局组件
│       ├── Layout.tsx    # 主应用布局
│       ├── Header.tsx    # 应用头部
│       └── Sidebar.tsx   # 导航侧边栏
├── pages/                # 应用程序页面
│   ├── auth/             # 身份验证页面
│   │   ├── LoginPage.tsx # 登录页面
│   │   └── RegisterPage.tsx # 注册页面
│   ├── dashboard/        # 仪表板页面
│   │   └── DashboardPage.tsx # 仪表板页面
│   ├── chat/             # 聊天界面
│   │   └── ChatPage.tsx  # 聊天页面
│   ├── knowledge/        # 知识库管理
│   │   ├── KnowledgeListPage.tsx      # 知识库列表
│   │   ├── KnowledgeCreatePage.tsx    # 创建知识库
│   │   ├── KnowledgeImportPage.tsx    # 导入文档
│   │   ├── KnowledgeDetailLayout.tsx  # 知识库详情布局
│   │   ├── KnowledgeDocumentsPage.tsx # 文档管理
│   │   ├── KnowledgeSearchPage.tsx    # 搜索界面
│   │   └── KnowledgeSettingsPage.tsx  # 知识库设置
│   ├── system/           # 系统监控
│   │   └── SystemPage.tsx # 系统监控页面
│   ├── settings/         # 设置页面
│   │   ├── SettingsLayout.tsx         # 设置布局
│   │   ├── ProfilePage.tsx            # 用户资料
│   │   └── ModelProvidersPage.tsx     # LLM 提供商设置
│   ├── documents/        # 文档管理（占位符）
│   ├── ai-tools/         # AI 工具（占位符）
│   ├── workflow/         # 工作流管理（占位符）
│   └── mcp-servers/      # MCP 服务器管理（占位符）
├── stores/               # Zustand 状态存储
│   ├── auth.ts           # 身份验证状态
│   ├── ui.ts             # UI 状态（侧边栏、主题、通知）
│   ├── chat.ts           # 聊天状态
│   ├── conversation.ts   # 对话管理
│   ├── knowledge.ts      # 知识库状态
│   ├── model.ts          # 模型配置
│   └── index.ts          # 存储初始化
├── hooks/                # 自定义 React Hooks
│   ├── use-auth.ts       # 身份验证 Hook
│   ├── use-conversations.ts # 对话 Hook
│   └── use-system-status.ts # 系统状态 Hook
├── lib/                  # 工具和配置
│   ├── router.tsx        # React Router 配置
│   ├── query-client.ts   # TanStack Query 设置
│   ├── utils.ts          # 工具函数
│   └── toast.ts          # 通知工具
├── types/                # TypeScript 类型定义
│   ├── api.ts            # API 响应类型（950+ 行）
│   └── index.ts          # 类型导出
├── constants/            # 应用程序常量
│   └── index.ts          # 路由、API URL 等
├── assets/               # 静态资源
│   ├── react.svg         # React 图标
│   └── svg/              # SVG 图标
│       └── file-icon/    # 文件类型图标（40+ 种）
│           ├── pdf.svg, docx.svg, txt.svg
│           ├── jpg.svg, png.svg, gif.svg
│           ├── mp4.svg, mp3.svg, avi.svg
│           └── ...       # 更多文件类型图标
└── utils/                # 额外工具函数
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
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产版本
npm run lint         # 运行 ESLint

# 类型检查
npx tsc --noEmit     # TypeScript 类型检查
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

## 📱 功能概览

### 1. 身份验证系统
- 登录/注册页面
- JWT 令牌管理
- AuthGuard 保护路由
- 自动令牌刷新

### 2. 仪表板
- 系统概览
- 快速访问主要功能
- 活动摘要

### 3. 智能对话
- 实时聊天界面
- 消息历史
- 对话管理
- 流式响应

### 4. 知识库管理
- **知识库创建**: 创建和配置具有自定义设置的知识库，修复了向量模型选择问题
- **高级文档管理**: 
  - 支持多种文件类型 (PDF, DOCX, TXT, MD 等 40+ 种文件类型)
  - 批量操作：上传、下载、重命名和删除多个文档
  - 实时文档处理状态，支持解析控制
  - 文档元数据管理和组织
- **增强文档操作**:
  - 单个文件上传/下载，支持进度跟踪
  - 批量文档操作，支持选择管理
  - 文档重命名和组织工具
  - 高级过滤和搜索功能
- **嵌入模型**: 改进的嵌入模型选择器，修复了下拉问题和动态提供商图标
- **搜索界面**: 知识库内的高级搜索和检索
- **导入/导出**: 批量导入文档和导出知识库数据
- **处理控制**: 实时文档处理状态，支持启动/停止控制
- **快速编辑**: 知识库设置的就地编辑

### 5. 系统监控
- 实时系统状态
- 组件健康检查 (数据库、Redis、存储、文档引擎)
- 任务执行器图表监控
- 性能指标

### 6. 设置和配置
- **用户资料**: 个人信息和账户设置
- **模型提供商**: 配置 LLM 提供商（OpenAI、Anthropic 等）
- **API 密钥**: 各种服务的安全 API 密钥管理
- **安全设置**: 密码、双因素认证和安全偏好（计划中）
- **通知设置**: 通知偏好和设置（计划中）
- **界面设置**: 主题、语言和 UI 自定义（计划中）
- **系统偏好**: 应用程序范围的配置选项

### 7. 其他功能（开发中）
- **文档管理**: 集中式文档存储库
- **AI 工具**: AI 驱动的实用工具集合
- **工作流管理**: 自动化工作流创建和执行
- **MCP 服务器**: 模型上下文协议服务器管理

## 🎨 UI 组件

应用程序使用全面的设计系统构建：

### 基础 UI 组件（40+ 组件）
- **表单组件**: Button、Input、Checkbox、Custom Select、Dropdown
- **布局组件**: Card、Modal、Table、Avatar、Badge
- **交互组件**: Tooltip、Loading、Status Card
- **文件组件**: File Icon（40+ 文件类型）、Dropzone 集成
- **数据可视化**: Task Executor Chart、System Status Cards

### 布局系统
- **主布局**: Header、Sidebar、Content 区域，响应式设计
- **现代化侧边栏**: 新的浮动卡片设计，改善视觉层次和导航体验
- **身份验证守卫**: 路由保护和用户会话管理
- **增强导航**: 动态侧边栏，支持活动状态管理和视觉增强

### 设计特性
- **响应式设计**: 使用 Tailwind CSS 的移动优先方法
- **组件变体**: 使用 Class Variance Authority 实现一致的样式
- **文件类型识别**: 支持 40+ 文件类型的综合文件图标系统
- **无障碍性**: ARIA 标签、键盘导航、屏幕阅读器支持
- **主题系统**: 一致的色彩调色板和排版（深色模式计划中）

## 📊 状态管理

### Zustand 存储
- **`auth`**: 用户身份验证、JWT 令牌、用户资料、租户信息
- **`ui`**: UI 状态管理（侧边栏可见性、通知、主题偏好）
- **`chat`**: 聊天界面状态和消息管理
- **`conversation`**: 对话历史、设置和流式状态
- **`knowledge`**: 知识库管理、文档状态、搜索结果
- **`model`**: LLM 提供商配置和模型设置

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

**版本**: 0.6.1 | 使用 ❤️ 构建，基于 React 19 + TypeScript 5.8 + Vite 7