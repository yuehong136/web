import { Suspense, lazy, type ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ROUTES } from '@/constants'

// ---------------------------------------------------------------------------
// Static imports — critical path for first paint
// ---------------------------------------------------------------------------
import { LoginPage, RegisterPage } from '@/pages/auth'
import { HomePage } from '@/pages/home'

// ---------------------------------------------------------------------------
// Suspense loading fallback
// ---------------------------------------------------------------------------
const PageLoading = () => (
  <div className="flex h-full items-center justify-center">
    <div className="h-icon-lg w-icon-lg animate-spin rounded-radius-full border-2 border-border-default border-t-transparent" />
  </div>
)

/** Wrap a lazy component with Suspense */
function withLoading(LazyComponent: React.LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={<PageLoading />}>
      <LazyComponent />
    </Suspense>
  )
}

// ---------------------------------------------------------------------------
// Helper for lazy-loading named exports
// ---------------------------------------------------------------------------
function lazyNamed<K extends string>(
  factory: () => Promise<Record<K, ComponentType>>,
  name: K,
) {
  return lazy(() => factory().then(m => ({ default: m[name] })))
}

// ---------------------------------------------------------------------------
// Lazy imports — code-split per route
// ---------------------------------------------------------------------------

// Knowledge
const KnowledgeListPage = lazyNamed(() => import('@/pages/knowledge/KnowledgeListPage'), 'KnowledgeListPage')
const KnowledgeDetailLayout = lazyNamed(() => import('@/pages/knowledge/KnowledgeDetailLayout'), 'KnowledgeDetailLayout')
const KnowledgeDocumentsPage = lazyNamed(() => import('@/pages/knowledge/documents'), 'KnowledgeDocumentsPage')
const KnowledgeSearchPage = lazyNamed(() => import('@/pages/knowledge/KnowledgeSearchPage'), 'KnowledgeSearchPage')
const KnowledgeGraphPage = lazyNamed(() => import('@/pages/knowledge/graph'), 'KnowledgeGraphPage')
const KnowledgeSettingsPage = lazyNamed(() => import('@/pages/knowledge/KnowledgeSettingsPage'), 'KnowledgeSettingsPage')
const KnowledgeCreatePage = lazyNamed(() => import('@/pages/knowledge/KnowledgeCreatePage'), 'KnowledgeCreatePage')
const KnowledgeImportPage = lazyNamed(() => import('@/pages/knowledge/KnowledgeImportPage'), 'KnowledgeImportPage')
const DocumentChunksPage = lazyNamed(() => import('@/pages/knowledge/DocumentChunksPage'), 'DocumentChunksPage')
const KnowledgeLogsPage = lazyNamed(() => import('@/pages/knowledge/logs'), 'KnowledgeLogsPage')

// Memory
const MemoryListPage = lazyNamed(() => import('@/pages/memory'), 'MemoryListPage')
const MemoryDetailLayout = lazyNamed(() => import('@/pages/memory'), 'MemoryDetailLayout')
const MemoryMessagesPage = lazyNamed(() => import('@/pages/memory'), 'MemoryMessagesPage')
const MemorySettingsPage = lazyNamed(() => import('@/pages/memory'), 'MemorySettingsPage')

// Explore & Search
const ExplorePage = lazyNamed(() => import('@/pages/explore'), 'ExplorePage')
const SearchListPage = lazyNamed(() => import('@/pages/search'), 'SearchListPage')
const SearchDetailPage = lazyNamed(() => import('@/pages/search/detail/SearchDetailPage'), 'SearchDetailPage')

// Agent
const AgentListPage = lazy(() => import('@/pages/agent'))
const AgentCanvasPage = lazy(() => import('@/pages/agent/AgentCanvasPage'))

// Studio
const StudioPage = lazyNamed(() => import('@/pages/studio'), 'StudioPage')
const CreateAppPage = lazyNamed(() => import('@/pages/studio/CreateAppPage'), 'CreateAppPage')

// Dialog
const PromptEditorPage = lazyNamed(() => import('@/pages/dialog/PromptEditorPage'), 'PromptEditorPage')
const DialogListPage = lazyNamed(() => import('@/pages/dialog/DialogListPage'), 'DialogListPage')

// AI Tools
const AIToolsHomePage = lazyNamed(() => import('@/pages/ai-tools'), 'AIToolsHomePage')
const AutoFillWorkbenchPage = lazyNamed(() => import('@/pages/ai-tools'), 'AutoFillWorkbenchPage')

// MCP Chat
const MCPChatPage = lazy(() => import('@/pages/MCPChatPage'))

// Settings
const SettingsLayout = lazyNamed(() => import('@/pages/settings/SettingsLayout'), 'SettingsLayout')
const ProfilePage = lazyNamed(() => import('@/pages/settings/profile'), 'ProfilePage')
const SecurityPage = lazyNamed(() => import('@/pages/settings/SecurityPage'), 'SecurityPage')
const ModelProvidersPage = lazyNamed(() => import('@/pages/settings/model-providers'), 'ModelProvidersPage')
const MCPServersPage = lazyNamed(() => import('@/pages/settings/MCPServersPage'), 'MCPServersPage')
const MCPToolsPage = lazyNamed(() => import('@/pages/settings/MCPToolsPage'), 'MCPToolsPage')
const MCPTestPage = lazyNamed(() => import('@/pages/settings/MCPTestPage'), 'MCPTestPage')
const MCPBatchPage = lazyNamed(() => import('@/pages/settings/MCPBatchPage'), 'MCPBatchPage')
const ApiKeysPage = lazy(() => import('@/pages/settings/ApiKeysPage'))
const SystemPage = lazyNamed(() => import('@/pages/system'), 'SystemPage')
const TeamPage = lazyNamed(() => import('@/pages/team'), 'TeamPage')
const DataSourcePage = lazy(() => import('@/pages/settings/datasource'))
const DataSourceDetailPage = lazy(() => import('@/pages/settings/datasource/detail'))
const AdminUsersPage = lazyNamed(() => import('@/pages/settings/admin'), 'AdminUsersPage')

// Theme Demo
const ThemeDemoPage = lazyNamed(() => import('@/pages/theme-demo/ThemeDemoPage'), 'ThemeDemoPage')

// ---------------------------------------------------------------------------
// Placeholder pages
// ---------------------------------------------------------------------------
const Documents = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">文件中心</h1>
    <p className="text-gray-600">文件中心功能开发中...</p>
  </div>
)

const Workflow = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">工作流</h1>
    <p className="text-gray-600">工作流功能开发中...</p>
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

// ---------------------------------------------------------------------------
// Route configuration
// ---------------------------------------------------------------------------
const authRoutes: { path: string; element: React.ReactElement }[] = [
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  }
]

if (import.meta.env.VITE_ENABLE_REGISTRATION === 'true') {
  authRoutes.push({
    path: ROUTES.REGISTER,
    element: <RegisterPage />,
  })
}

export const router = createBrowserRouter([
  ...authRoutes,

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
        path: '/mcp-chat',
        element: withLoading(MCPChatPage),
      },
      {
        path: ROUTES.KNOWLEDGE,
        element: withLoading(KnowledgeListPage),
      },
      {
        path: ROUTES.MEMORY,
        element: withLoading(MemoryListPage),
      },
      {
        path: '/memory/:id',
        element: withLoading(MemoryDetailLayout),
        children: [
          {
            index: true,
            element: withLoading(MemoryMessagesPage),
          },
          {
            path: 'settings',
            element: withLoading(MemorySettingsPage),
          },
        ],
      },
      {
        path: ROUTES.EXPLORE,
        element: withLoading(ExplorePage),
      },
      {
        path: ROUTES.SEARCH,
        element: withLoading(SearchListPage),
      },
      {
        path: '/search/:id',
        element: withLoading(SearchDetailPage),
      },
      {
        path: '/theme-demo',
        element: withLoading(ThemeDemoPage),
      },
      {
        path: '/knowledge/create',
        element: withLoading(KnowledgeCreatePage),
      },
      {
        path: '/knowledge/import',
        element: withLoading(KnowledgeImportPage),
      },
      {
        path: '/knowledge/:id',
        element: withLoading(KnowledgeDetailLayout),
        children: [
          {
            index: true,
            element: <Navigate to="documents" replace />,
          },
          {
            path: 'documents',
            element: withLoading(KnowledgeDocumentsPage),
          },
          {
            path: 'search',
            element: withLoading(KnowledgeSearchPage),
          },
          {
            path: 'graph',
            element: withLoading(KnowledgeGraphPage),
          },
          {
            path: 'logs',
            element: withLoading(KnowledgeLogsPage),
          },
          {
            path: 'settings',
            element: withLoading(KnowledgeSettingsPage),
          },
          {
            path: 'documents/:docId/chunks',
            element: withLoading(DocumentChunksPage),
          },
        ],
      },
      {
        path: ROUTES.DOCUMENTS,
        element: <Documents />,
      },
      {
        path: ROUTES.AI_TOOLS,
        element: withLoading(AIToolsHomePage),
      },
      {
        path: '/tools',
        element: withLoading(AIToolsHomePage),
      },
      {
        path: '/tools/auto-fill',
        element: withLoading(AutoFillWorkbenchPage),
      },
      {
        path: ROUTES.WORKFLOW,
        element: <Workflow />,
      },
      {
        path: ROUTES.AGENTS,
        element: withLoading(AgentListPage),
      },
      {
        path: '/agent/:id',
        element: withLoading(AgentCanvasPage),
      },
      {
        path: ROUTES.MCP_SERVERS,
        element: <Navigate to="/settings/mcp-servers" replace />,
      },
      {
        path: ROUTES.STUDIO,
        element: withLoading(StudioPage),
      },
      {
        path: ROUTES.STUDIO_CREATE_APP,
        element: withLoading(CreateAppPage),
      },
      {
        path: ROUTES.SYSTEM,
        element: <Navigate to="/settings/system" replace />,
      },
      {
        path: '/dialogs',
        element: withLoading(DialogListPage),
      },
      {
        path: '/dialog/:id/prompt-editor',
        element: withLoading(PromptEditorPage),
      },
      {
        path: '/settings',
        element: withLoading(SettingsLayout),
        children: [
          {
            index: true,
            element: <Navigate to={ROUTES.SETTINGS_PROFILE} replace />,
          },
          {
            path: 'datasource',
            element: withLoading(DataSourcePage),
          },
          {
            path: 'datasource-detail',
            element: withLoading(DataSourceDetailPage),
          },
          {
            path: 'profile',
            element: withLoading(ProfilePage),
          },
          {
            path: 'team',
            element: withLoading(TeamPage),
          },
          {
            path: 'security',
            element: withLoading(SecurityPage),
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
            element: withLoading(ModelProvidersPage),
          },
          {
            path: 'mcp-servers',
            element: withLoading(MCPServersPage),
          },
          {
            path: 'mcp-tools',
            element: withLoading(MCPToolsPage),
          },
          {
            path: 'mcp-test',
            element: withLoading(MCPTestPage),
          },
          {
            path: 'mcp-batch',
            element: withLoading(MCPBatchPage),
          },
          {
            path: 'api-keys',
            element: withLoading(ApiKeysPage),
          },
          {
            path: 'system',
            element: withLoading(SystemPage),
          },
          {
            path: 'admin',
            element: withLoading(AdminUsersPage),
          },
        ],
      },
    ],
  },
])
