# Multi-RAG 前端

基于 React 构建的现代化前端应用程序，为 Multi-RAG 系统提供智能对话、知识库管理、系统监控等功能。

## 🚀 主要特性

- **智能对话**：AI 驱动的聊天界面，支持实时流式响应
- **知识库管理**：文档上传、处理和智能检索
- **系统监控**：实时系统状态和任务执行器监控
- **模型管理**：支持多种 LLM 提供商和配置
- **MCP 服务器**：模型上下文协议服务器管理
- **用户管理**：身份验证和个人资料管理
- **响应式设计**：使用 Tailwind CSS 的移动优先设计

## 📋 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **样式**: Tailwind CSS 3.4
- **状态管理**: Zustand 5.0 + TanStack Query 5.8
- **路由**: React Router DOM 7.7
- **图表**: Recharts 3.1
- **表单**: React Hook Form 7.6 + Zod 4.0
- **图标**: Lucide React
- **HTTP 客户端**: 基于 fetch 的自定义 API 客户端

## 🏗️ 项目结构

```
src/
├── api/                    # API 客户端和类型
│   ├── client.ts          # 基础 API 客户端
│   ├── auth.ts            # 身份验证 API
│   ├── conversation.ts    # 聊天/对话 API
│   ├── knowledge.ts       # 知识库 API
│   ├── system.ts          # 系统监控 API
│   └── index.ts           # API 导出
├── components/            # 可复用 UI 组件
│   ├── ui/               # 基础 UI 组件
│   ├── auth/             # 身份验证组件
│   ├── feature/          # 功能特定组件
│   └── layout/           # 布局组件
├── pages/                # 应用程序页面
│   ├── auth/             # 身份验证页面
│   ├── dashboard/        # 仪表板页面
│   ├── chat/             # 聊天界面
│   ├── knowledge/        # 知识库管理
│   ├── system/           # 系统监控
│   └── settings/         # 设置页面
├── stores/               # Zustand 状态存储
├── hooks/                # 自定义 React Hooks
├── lib/                  # 工具和配置
├── types/                # TypeScript 类型定义
├── constants/            # 应用程序常量
└── assets/               # 静态资源
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
- 文档上传 (PDF, DOCX, TXT, MD)
- 知识库创建和管理
- 文档处理状态
- 搜索和检索

### 5. 系统监控
- 实时系统状态
- 组件健康检查 (数据库、Redis、存储、文档引擎)
- 任务执行器图表监控
- 性能指标

### 6. 设置
- 用户资料管理
- 模型提供商配置
- API 密钥管理
- 系统偏好设置

## 🎨 UI 组件

应用程序使用一致的设计系统构建：

- **基础组件**: Button、Input、Card、Modal 等
- **布局组件**: Header、Sidebar、Layout 包装器
- **功能组件**: StatusCard、TaskExecutorChart 等
- **响应式设计**: 移动优先方法
- **深色模式**: 系统偏好检测

## 📊 状态管理

### Zustand 存储
- `auth`: 身份验证状态
- `ui`: UI 状态 (侧边栏、通知、主题)
- `chat`: 对话管理
- `knowledge`: 知识库状态
- `model`: 模型配置

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

使用 React + TypeScript + Vite 构建 ❤️