import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { LoginPage, RegisterPage } from '../pages/auth'
import { DashboardPage } from '../pages/dashboard'
import { ChatPage } from '../pages/chat/ChatPage'
import { KnowledgeListPage } from '../pages/knowledge/KnowledgeListPage'
import { KnowledgeDetailLayout } from '../pages/knowledge/KnowledgeDetailLayout'
import { KnowledgeDocumentsPage } from '../pages/knowledge/KnowledgeDocumentsPage'
import { KnowledgeSearchPage } from '../pages/knowledge/KnowledgeSearchPage'
import { KnowledgeSettingsPage } from '../pages/knowledge/KnowledgeSettingsPage'
import { KnowledgeCreatePage } from '../pages/knowledge/KnowledgeCreatePage'
import { KnowledgeImportPage } from '../pages/knowledge/KnowledgeImportPage'
import { SettingsLayout } from '../pages/settings/SettingsLayout'
import { ProfilePage } from '../pages/settings/ProfilePage'
import { ModelProvidersPage } from '../pages/settings/ModelProvidersPage'
import { SystemPage } from '../pages/system'
import { ROUTES } from '../constants'

// 页面组件 (先创建占位符)

// Chat页面已迁移到ChatPage组件

// Knowledge页面已迁移到KnowledgeListPage组件

const Documents = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">文档管理</h1>
    <p className="text-gray-600">文档管理功能开发中...</p>
  </div>
)

const AITools = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">AI工具箱</h1>
    <p className="text-gray-600">AI工具箱功能开发中...</p>
  </div>
)

const Workflow = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">工作流</h1>
    <p className="text-gray-600">工作流功能开发中...</p>
  </div>
)

const MCPServers = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">MCP服务器</h1>
    <p className="text-gray-600">MCP服务器管理功能开发中...</p>
  </div>
)


// Settings placeholder components
const SecurityPage = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-gray-900">安全设置</h2>
    <p className="text-gray-600 mt-2">安全设置功能开发中...</p>
  </div>
)

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

const APIKeysPage = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-gray-900">API密钥</h2>
    <p className="text-gray-600 mt-2">API密钥管理功能开发中...</p>
  </div>
)

// 创建路由配置
export const router = createBrowserRouter([
  // 认证路由（不需要布局）
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.REGISTER,
    element: <RegisterPage />,
  },
  
  // 主应用路由（需要布局和认证）
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
      {
        path: ROUTES.DASHBOARD,
        element: <DashboardPage />,
      },
      {
        path: ROUTES.CHAT,
        element: <ChatPage />,
      },
      {
        path: ROUTES.KNOWLEDGE,
        element: <KnowledgeListPage />,
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
            path: 'settings',
            element: <KnowledgeSettingsPage />,
          },
        ],
      },
      {
        path: ROUTES.DOCUMENTS,
        element: <Documents />,
      },
      {
        path: ROUTES.AI_TOOLS,
        element: <AITools />,
      },
      {
        path: ROUTES.WORKFLOW,
        element: <Workflow />,
      },
      {
        path: ROUTES.MCP_SERVERS,
        element: <MCPServers />,
      },
      {
        path: ROUTES.SYSTEM,
        element: <SystemPage />,
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
            path: 'profile',
            element: <ProfilePage />,
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
            path: 'api-keys',
            element: <APIKeysPage />,
          },
        ],
      },
    ],
  },
])