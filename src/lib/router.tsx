import { Suspense, lazy, type ComponentType } from 'react'
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import {
  AppScene,
  PageEmptyState,
  PageLoadingState,
} from '@/components/patterns'
import { ROUTES } from '@/constants'

// ---------------------------------------------------------------------------
// Static imports — critical path for first paint
// ---------------------------------------------------------------------------
import { LoginPage, RegisterPage } from '@/pages/auth'
import { HomePage } from '@/pages/home'

// ---------------------------------------------------------------------------
// Suspense loading fallback
// ---------------------------------------------------------------------------
const pageLoadingFallback = (
  <PageLoadingState
    scene={AppScene.CONSOLE}
    compact
    title="页面加载中"
    description="正在准备当前内容。"
  />
)

/** Wrap a lazy component with Suspense */
function withLoading(LazyComponent: React.LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={pageLoadingFallback}>
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
  return lazy(() => factory().then((m) => ({ default: m[name] })))
}

// ---------------------------------------------------------------------------
// Lazy imports — code-split per route
// ---------------------------------------------------------------------------

// Knowledge
const KnowledgeListPage = lazyNamed(
  () => import('@/pages/knowledge/KnowledgeListPage'),
  'KnowledgeListPage',
)
const KnowledgeDetailLayout = lazyNamed(
  () => import('@/pages/knowledge/KnowledgeDetailLayout'),
  'KnowledgeDetailLayout',
)
const KnowledgeChunksLayout = lazyNamed(
  () => import('@/pages/knowledge'),
  'KnowledgeChunksLayout',
)
const KnowledgeDocumentsPage = lazyNamed(
  () => import('@/pages/knowledge/documents'),
  'KnowledgeDocumentsPage',
)
const KnowledgeSearchPage = lazyNamed(
  () => import('@/pages/knowledge/KnowledgeSearchPage'),
  'KnowledgeSearchPage',
)
const KnowledgeGraphPage = lazyNamed(
  () => import('@/pages/knowledge/graph'),
  'KnowledgeGraphPage',
)
const KnowledgeSettingsPage = lazyNamed(
  () => import('@/pages/knowledge/KnowledgeSettingsPage'),
  'KnowledgeSettingsPage',
)
const KnowledgeCreatePage = lazyNamed(
  () => import('@/pages/knowledge/KnowledgeCreatePage'),
  'KnowledgeCreatePage',
)
const KnowledgeImportPage = lazyNamed(
  () => import('@/pages/knowledge/KnowledgeImportPage'),
  'KnowledgeImportPage',
)
const DocumentChunksPage = lazyNamed(
  () => import('@/pages/knowledge/DocumentChunksPage'),
  'DocumentChunksPage',
)
const KnowledgeLogsPage = lazyNamed(
  () => import('@/pages/knowledge/logs'),
  'KnowledgeLogsPage',
)

// Memory
const MemoryListPage = lazyNamed(
  () => import('@/pages/memory'),
  'MemoryListPage',
)
const MemoryDetailLayout = lazyNamed(
  () => import('@/pages/memory'),
  'MemoryDetailLayout',
)
const MemoryMessagesPage = lazyNamed(
  () => import('@/pages/memory'),
  'MemoryMessagesPage',
)
const MemorySettingsPage = lazyNamed(
  () => import('@/pages/memory'),
  'MemorySettingsPage',
)

// Explore & Search
const ExplorePage = lazyNamed(() => import('@/pages/explore'), 'ExplorePage')
const SearchListPage = lazyNamed(
  () => import('@/pages/search'),
  'SearchListPage',
)
const SearchDetailPage = lazyNamed(
  () => import('@/pages/search/detail/SearchDetailPage'),
  'SearchDetailPage',
)

// Agent
const AgentListPage = lazy(() => import('@/pages/agents'))
const AgentLogsPage = lazy(() => import('@/pages/agents/log'))
const AgentTemplatesPage = lazy(() => import('@/pages/agents/templates'))
const AgentEditorPage = lazy(() => import('@/pages/agent'))
const AgentExplorePage = lazy(() => import('@/pages/agent/explore'))
const AgentSharePage = lazy(() => import('@/pages/agent/share'))
const AgentWidgetPage = lazy(() => import('@/pages/agent/share/widget'))
const PipelineResultPage = lazy(() => import('@/pages/agent/pipeline-result'))

// Studio
const StudioPage = lazyNamed(() => import('@/pages/studio'), 'StudioPage')
const CreateAppPage = lazyNamed(
  () => import('@/pages/studio/CreateAppPage'),
  'CreateAppPage',
)

// Dialog
const PromptEditorPage = lazyNamed(
  () => import('@/pages/dialog/PromptEditorPage'),
  'PromptEditorPage',
)
const DialogListPage = lazyNamed(
  () => import('@/pages/dialog/DialogListPage'),
  'DialogListPage',
)

// AI Tools
const AIToolsHomePage = lazyNamed(
  () => import('@/pages/ai-tools'),
  'AIToolsHomePage',
)
const AutoFillWorkbenchPage = lazyNamed(
  () => import('@/pages/ai-tools'),
  'AutoFillWorkbenchPage',
)

// MCP Chat
const MCPChatPage = lazy(() => import('@/pages/MCPChatPage'))

// Settings
const SettingsLayout = lazyNamed(
  () => import('@/pages/settings/SettingsLayout'),
  'SettingsLayout',
)
const ProfilePage = lazyNamed(
  () => import('@/pages/settings/profile'),
  'ProfilePage',
)
const ModelProvidersPage = lazyNamed(
  () => import('@/pages/settings/model-providers'),
  'ModelProvidersPage',
)
const MCPServersPage = lazyNamed(
  () => import('@/pages/settings/MCPServersPage'),
  'MCPServersPage',
)
const MCPToolsPage = lazyNamed(
  () => import('@/pages/settings/MCPToolsPage'),
  'MCPToolsPage',
)
const MCPTestPage = lazyNamed(
  () => import('@/pages/settings/MCPTestPage'),
  'MCPTestPage',
)
const MCPBatchPage = lazyNamed(
  () => import('@/pages/settings/MCPBatchPage'),
  'MCPBatchPage',
)
const ApiKeysPage = lazy(() => import('@/pages/settings/ApiKeysPage'))
const SystemPage = lazyNamed(() => import('@/pages/system'), 'SystemPage')
const TeamPage = lazyNamed(() => import('@/pages/team'), 'TeamPage')
const DataSourcePage = lazy(() => import('@/pages/settings/datasource'))
const DataSourceDetailPage = lazy(
  () => import('@/pages/settings/datasource/detail'),
)
const AdminUsersPage = lazyNamed(
  () => import('@/pages/settings/admin'),
  'AdminUsersPage',
)
const ChannelsPage = lazyNamed(
  () => import('@/pages/settings/channels'),
  'ChannelsPage',
)

// Document Preview
const DocumentPreviewPage = lazy(() => import('@/pages/document-preview'))

// Theme Demo
const ThemeDemoPage = lazyNamed(
  () => import('@/pages/theme-demo/ThemeDemoPage'),
  'ThemeDemoPage',
)

// ---------------------------------------------------------------------------
// Placeholder pages
// ---------------------------------------------------------------------------
const documentsElement = (
  <div className="p-space-lg flex h-full items-center justify-center">
    <PageEmptyState
      scene={AppScene.CONSOLE}
      title="文件中心即将推出"
      description="文件中心能力正在整理为统一控制台体验。"
      compact
    />
  </div>
)

const workflowElement = (
  <div className="p-space-lg flex h-full items-center justify-center">
    <PageEmptyState
      scene={AppScene.STUDIO}
      title="工作流模块即将推出"
      description="工作流会在后续以统一 Studio 骨架接入。"
      compact
    />
  </div>
)

const notificationsElement = (
  <div className="p-space-lg flex h-full items-center justify-center">
    <PageEmptyState
      scene={AppScene.CONSOLE}
      title="通知设置即将推出"
      description="该设置项会复用统一 Console 模板补充。"
      compact
    />
  </div>
)

const appearanceElement = (
  <div className="p-space-lg flex h-full items-center justify-center">
    <PageEmptyState
      scene={AppScene.CONSOLE}
      title="界面设置即将推出"
      description="界面设置会在新骨架和主题规则稳定后接入。"
      compact
    />
  </div>
)

function AgentLogRedirect() {
  const { id } = useParams<{ id: string }>()
  return (
    <Navigate
      to={`/agents/log${id ? `?canvas=${encodeURIComponent(id)}` : ''}`}
      replace
    />
  )
}

// ---------------------------------------------------------------------------
// Route configuration
// ---------------------------------------------------------------------------
const authRoutes: { path: string; element: React.ReactElement }[] = [
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
]

if (import.meta.env.VITE_ENABLE_REGISTRATION === 'true') {
  authRoutes.push({
    path: ROUTES.REGISTER,
    element: <RegisterPage />,
  })
}

// Temporary embed route — gated by env flag. See `src/pages/agent/embed/README.md`
// for the full removal checklist when the third-party requirement winds down.
// The lazy() call lives inside the conditional so the embed chunk is fully
// tree-shaken when the flag is off.
const embedRoutes: { path: string; element: React.ReactElement }[] =
  import.meta.env.VITE_ENABLE_AGENT_EMBED === 'true'
    ? (() => {
        const AgentEmbedPage = lazy(() => import('@/pages/agent/embed'))
        return [
          { path: '/agent/:id/embed', element: withLoading(AgentEmbedPage) },
        ]
      })()
    : []

export const router = createBrowserRouter([
  ...authRoutes,

  {
    path: ROUTES.AGENT_SHARE,
    element: withLoading(AgentSharePage),
  },

  {
    path: ROUTES.CHAT_WIDGET,
    element: withLoading(AgentWidgetPage),
  },

  ...embedRoutes,

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
        path: '/document/:docId/preview',
        element: withLoading(DocumentPreviewPage),
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
        ],
      },
      {
        path: '/knowledge/:id/documents/:docId/chunks',
        element: withLoading(KnowledgeChunksLayout),
        children: [
          {
            index: true,
            element: withLoading(DocumentChunksPage),
          },
        ],
      },
      {
        path: ROUTES.DOCUMENTS,
        element: documentsElement,
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
        element: workflowElement,
      },
      {
        path: ROUTES.AGENTS,
        element: withLoading(AgentListPage),
      },
      {
        path: ROUTES.AGENT_LOGS,
        element: withLoading(AgentLogsPage),
      },
      {
        path: ROUTES.AGENT_TEMPLATES,
        element: withLoading(AgentTemplatesPage),
      },
      {
        path: ROUTES.AGENT_LOG_REDIRECT,
        element: <AgentLogRedirect />,
      },
      {
        path: '/agent/:id',
        element: withLoading(AgentEditorPage),
      },
      {
        path: ROUTES.AGENT_EXPLORE,
        element: withLoading(AgentExplorePage),
      },
      {
        path: ROUTES.DATAFLOW_RESULT,
        element: withLoading(PipelineResultPage),
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
            path: 'notifications',
            element: notificationsElement,
          },
          {
            path: 'appearance',
            element: appearanceElement,
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
            path: 'channels',
            element: withLoading(ChannelsPage),
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
