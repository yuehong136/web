import { Suspense, lazy, type ComponentType } from 'react'
import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
  useParams,
} from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { AppScene, PageLoadingState } from '@/components/patterns'
import { ROUTES } from '@/constants'
import { ErrorFallback, NotFoundPage } from '@/pages/error'
import { skillRoutes } from '@/pages/skills/skill-routes'
import { RouteLocaleBoundary } from '@/locales/locale-boundary'
import { useTranslation } from 'react-i18next'

// ---------------------------------------------------------------------------
// Static imports — critical path for first paint
// ---------------------------------------------------------------------------
import { LoginPage } from '@/pages/auth/LoginPage'
import { HomePage } from '@/pages/home'

// ---------------------------------------------------------------------------
// Suspense loading fallback
// ---------------------------------------------------------------------------
function RouteLoadingFallback() {
  const { t } = useTranslation()
  return (
    <PageLoadingState
      scene={AppScene.CONSOLE}
      compact
      title={t('common.loading')}
    />
  )
}

/** Wrap a lazy component with Suspense */
function withLoading(LazyComponent: React.LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
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

const RegisterPage = lazyNamed(
  () => import('@/pages/auth/RegisterPage'),
  'RegisterPage',
)

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

// AI Tools
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
const AppearancePage = lazyNamed(
  () => import('@/pages/settings/appearance/appearance-page'),
  'AppearancePage',
)
const SettingsIndexRedirect = lazyNamed(
  () => import('@/pages/settings/SettingsLayout'),
  'SettingsIndexRedirect',
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
const SandboxPage = lazyNamed(
  () => import('@/pages/settings/admin/sandbox/sandbox-page'),
  'SandboxPage',
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

// ---------------------------------------------------------------------------
// The retired prompt editor edited the same dialog the Studio editor opens.
function PromptEditorRedirect() {
  const { id } = useParams<{ id: string }>()
  return (
    <Navigate
      to={
        id
          ? `${ROUTES.STUDIO_CREATE_APP}?dialog_id=${encodeURIComponent(id)}`
          : ROUTES.STUDIO
      }
      replace
    />
  )
}

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
    element: withLoading(RegisterPage),
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

const topLevelRoutes: RouteObject[] = [
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
      ...skillRoutes,
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
        path: '/document/:docId/preview',
        element: withLoading(DocumentPreviewPage),
      },
      {
        path: '/knowledge/create',
        element: withLoading(KnowledgeCreatePage),
      },
      {
        // Keeps `import` from being read as a knowledge base id.
        path: '/knowledge/import',
        element: <Navigate to={ROUTES.KNOWLEDGE} replace />,
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
      // Retired entries keep old links working.
      {
        path: '/documents',
        element: <Navigate to={ROUTES.KNOWLEDGE} replace />,
      },
      {
        path: '/workflow',
        element: <Navigate to={ROUTES.AGENTS} replace />,
      },
      {
        path: '/ai-tools',
        element: <Navigate to={ROUTES.AUTO_FILL} replace />,
      },
      {
        path: ROUTES.TOOLS,
        element: <Navigate to={ROUTES.AUTO_FILL} replace />,
      },
      {
        path: ROUTES.AUTO_FILL,
        element: withLoading(AutoFillWorkbenchPage),
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
        element: <Navigate to={ROUTES.STUDIO} replace />,
      },
      {
        path: '/dialog/:id/prompt-editor',
        element: <PromptEditorRedirect />,
      },
      {
        path: '/settings',
        element: withLoading(SettingsLayout),
        children: [
          {
            index: true,
            element: withLoading(SettingsIndexRedirect),
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
            path: 'appearance',
            element: withLoading(AppearancePage),
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
          {
            path: 'sandbox',
            element: withLoading(SandboxPage),
          },
        ],
      },
    ],
  },
]

export const appRoutes: RouteObject[] = [
  {
    errorElement: <ErrorFallback />,
    element: <RouteLocaleBoundary />,
    children: [...topLevelRoutes, { path: '*', element: <NotFoundPage /> }],
  },
]

export const router = createBrowserRouter(appRoutes)
