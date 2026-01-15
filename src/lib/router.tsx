import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { LoginPage, RegisterPage } from '@/pages/auth'
import { HomePage } from '@/pages/home'
import { ChatPage } from '@/pages/chat/ChatPage'
import { KnowledgeListPage } from '@/pages/knowledge/KnowledgeListPage'
import { KnowledgeDetailLayout } from '@/pages/knowledge/KnowledgeDetailLayout'
import { KnowledgeDocumentsPage } from '@/pages/knowledge/KnowledgeDocumentsPage'
import { KnowledgeSearchPage } from '@/pages/knowledge/KnowledgeSearchPage'
import { KnowledgeSettingsPage } from '@/pages/knowledge/KnowledgeSettingsPage'
import { KnowledgeCreatePage } from '@/pages/knowledge/KnowledgeCreatePage'
import { KnowledgeImportPage } from '@/pages/knowledge/KnowledgeImportPage'
import { DocumentChunksPage } from '@/pages/knowledge/DocumentChunksPage'
import { KnowledgeLogsPage } from '@/pages/knowledge/logs'
import {
  MemoryListPage,
  MemoryDetailLayout,
  MemoryMessagesPage,
  MemorySettingsPage,
} from '@/pages/memory'
import { SettingsLayout } from '@/pages/settings/SettingsLayout'
import { ProfilePage } from '@/pages/settings/ProfilePage'
import { SecurityPage } from '@/pages/settings/SecurityPage'
import { ModelProvidersPage } from '@/pages/settings/model-providers'
import { MCPServersPage } from '@/pages/settings/MCPServersPage'
import { MCPToolsPage } from '@/pages/settings/MCPToolsPage'
import { MCPTestPage } from '@/pages/settings/MCPTestPage'
import { MCPBatchPage } from '@/pages/settings/MCPBatchPage'
import ApiKeysPage from '@/pages/settings/ApiKeysPage'
import { StudioPage } from '@/pages/studio'
import { CreateAppPage } from '@/pages/studio/CreateAppPage'
import { SystemPage } from '@/pages/system'
import { PromptEditorPage } from '@/pages/dialog/PromptEditorPage'
import { DialogListPage } from '@/pages/dialog/DialogListPage'
import { ExplorePage } from '@/pages/explore'
import { ThemeDemoPage } from '@/pages/theme-demo/ThemeDemoPage'
import { ROUTES } from '@/constants'
import { AIToolsHomePage, AutoFillWorkbenchPage } from '@/pages/ai-tools'
import MCPChatPage from '@/pages/MCPChatPage'
import AgentListPage from '@/pages/agent'
import AgentCanvasPage from '@/pages/agent/AgentCanvasPage'

// 页面组件 (先创建占位符)

// Chat页面已迁移到ChatPage组件

// Knowledge页面已迁移到KnowledgeListPage组件

const Documents = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">文件中心</h1>
    <p className="text-gray-600">文件中心功能开发中...</p>
  </div>
)

// 替换为正式 AI 工具箱页面

const Workflow = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">工作流</h1>
    <p className="text-gray-600">工作流功能开发中...</p>
  </div>
)

// MCP 服务器入口已跳转到设置子路由，无需占位组件


// Settings placeholder components

const NotificationsPage = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-gray-900">通知设置</h2>
    <p className="text-gray-600 mt-2">通知设置功能开发中...</p>
  </div>
)

const AppearancePage = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-gray-900">界面设置</h2>
    <p className="text-gray-600 mt-2">界面设置功能开发中...</p>
  </div>
)

const DataSourcePage = () => (
  <div className="flex flex-col items-center justify-center h-full p-8">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-secondary flex items-center justify-center">
        <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-text-primary mb-2">数据源管理</h2>
      <p className="text-text-secondary mb-4">该功能正在开发中，敬请期待...</p>
      <p className="text-sm text-text-tertiary">数据源管理将支持连接多种外部数据源，包括数据库、API、文件存储等。</p>
    </div>
  </div>
)

const TeamPage = () => (
  <div className="flex flex-col items-center justify-center h-full p-8">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-secondary flex items-center justify-center">
        <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-text-primary mb-2">团队管理</h2>
      <p className="text-text-secondary mb-4">该功能正在开发中，敬请期待...</p>
      <p className="text-sm text-text-tertiary">团队管理将支持邀请成员、角色权限分配、协作空间等功能。</p>
    </div>
  </div>
)


// 创建路由配置
const authRoutes: { path: string; element: React.ReactElement }[] = [
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  }
]

// 条件性添加注册路由
if (import.meta.env.VITE_ENABLE_REGISTRATION === 'true') {
  authRoutes.push({
    path: ROUTES.REGISTER,
    element: <RegisterPage />,
  })
}

export const router = createBrowserRouter([
  // 认证路由（不需要布局）
  ...authRoutes,
  
  // 主应用路由（需要布局和认证）
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.HOME} replace />,
      },
      {
        path: ROUTES.HOME,
        element: <HomePage />,
      },
      {
        path: ROUTES.CHAT,
        element: <ChatPage />,
      },
      {
        path: '/mcp-chat',
        element: <MCPChatPage />,
      },
      {
        path: ROUTES.KNOWLEDGE,
        element: <KnowledgeListPage />,
      },
      {
        path: ROUTES.MEMORY,
        element: <MemoryListPage />,
      },
      {
        path: '/memory/:id',
        element: <MemoryDetailLayout />,
        children: [
          {
            index: true,
            element: <MemoryMessagesPage />,
          },
          {
            path: 'settings',
            element: <MemorySettingsPage />,
          },
        ],
      },
      {
        path: ROUTES.EXPLORE,
        element: <ExplorePage />,
      },
      {
        path: '/theme-demo',
        element: <ThemeDemoPage />,
      },
      {
        path: '/knowledge/create',
        element: <KnowledgeCreatePage />,
      },
      {
        path: '/knowledge/import',
        element: <KnowledgeImportPage />,
      },
      {
        path: '/knowledge/:id',
        element: <KnowledgeDetailLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="documents" replace />,
          },
          {
            path: 'documents',
            element: <KnowledgeDocumentsPage />,
          },
          {
            path: 'search',
            element: <KnowledgeSearchPage />,
          },
          {
            path: 'logs',
            element: <KnowledgeLogsPage />,
          },
          {
            path: 'settings',
            element: <KnowledgeSettingsPage />,
          },
          {
            path: 'documents/:docId/chunks',
            element: <DocumentChunksPage />,
          },
        ],
      },
      {
        path: ROUTES.DOCUMENTS,
        element: <Documents />,
      },
      {
        path: ROUTES.AI_TOOLS,
        element: <AIToolsHomePage />,
      },
      {
        path: '/tools',
        element: <AIToolsHomePage />,
      },
      {
        path: '/tools/auto-fill',
        element: <AutoFillWorkbenchPage />,
      },
      {
        path: ROUTES.WORKFLOW,
        element: <Workflow />,
      },
      {
        path: ROUTES.AGENTS,
        element: <AgentListPage />,
      },
      {
        path: '/agent/:id',
        element: <AgentCanvasPage />,
      },
      {
        path: ROUTES.MCP_SERVERS,
        element: <Navigate to="/settings/mcp-servers" replace />,
      },
      {
        path: ROUTES.STUDIO,
        element: <StudioPage />,
      },
      {
        path: ROUTES.STUDIO_CREATE_APP,
        element: <CreateAppPage />,
      },
      {
        path: ROUTES.SYSTEM,
        element: <SystemPage />,
      },
      {
        path: '/dialogs',
        element: <DialogListPage />,
      },
      {
        path: '/dialog/:id/prompt-editor',
        element: <PromptEditorPage />,
      },
      {
        path: '/settings',
        element: <SettingsLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={ROUTES.SETTINGS_PROFILE} replace />,
          },
          {
            path: 'datasource',
            element: <DataSourcePage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            path: 'team',
            element: <TeamPage />,
          },
          {
            path: 'security',
            element: <SecurityPage />,
          },
          {
            path: 'notifications',
            element: <NotificationsPage />,
          },
          {
            path: 'appearance',
            element: <AppearancePage />,
          },
          {
            path: 'model-providers',
            element: <ModelProvidersPage />,
          },
          {
            path: 'mcp-servers',
            element: <MCPServersPage />,
          },
          {
            path: 'mcp-tools',
            element: <MCPToolsPage />,
          },
          {
            path: 'mcp-test',
            element: <MCPTestPage />,
          },
          {
            path: 'mcp-batch',
            element: <MCPBatchPage />,
          },
          {
            path: 'api-keys',
            element: <ApiKeysPage />,
          },
        ],
      },
    ],
  },
])