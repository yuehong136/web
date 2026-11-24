import { lazy, type ComponentType } from 'react'
import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { RouteDocument } from '@/components/layout/route-document'
import { routeMeta, type PageTitleKey } from '@/components/layout/route-meta'
import { ROUTES } from '@/constants'
import { ErrorFallback, NotFoundPage, PageErrorFallback } from '@/pages/error'
import { skillRoutes } from '@/pages/skills/skill-routes'
import { RouteLocaleBoundary } from '@/locales/locale-boundary'
import { API_KEYS_PATH, MCP_PATH } from '@/pages/settings/settings-routes'
import { memoryRoutes } from '@/pages/memory/memory-routes'
import { withLoading } from './route-loading'

// ---------------------------------------------------------------------------
// Static imports — critical path for first paint
// ---------------------------------------------------------------------------
import { LoginPage } from '@/pages/auth/LoginPage'
import { HomePage } from '@/pages/home'
import * as Page from './route-pages'
import {
  AgentLogRedirect,
  MCPChatRedirect,
  PromptEditorRedirect,
  SearchRedirect,
} from './route-redirects'

// ---------------------------------------------------------------------------
// Route configuration
// ---------------------------------------------------------------------------
const authRoutes: RouteObject[] = [
  {
    path: ROUTES.LOGIN,
    handle: routeMeta(undefined, 'login'),
    element: <LoginPage />,
  },
]

if (import.meta.env.VITE_ENABLE_REGISTRATION === 'true') {
  authRoutes.push({
    path: ROUTES.REGISTER,
    handle: routeMeta(undefined, 'register'),
    element: withLoading(Page.RegisterPage),
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
    element: withLoading(Page.AgentSharePage),
  },

  {
    path: ROUTES.CHAT_WIDGET,
    element: withLoading(Page.AgentWidgetPage),
  },

  ...embedRoutes,

  {
    path: '/',
    element: <Layout />,
    children: [
      {
        // A page that fails recovers inside the workbench: the rail and the
        // secondary panel stay, and the next navigation clears the error.
        errorElement: <PageErrorFallback />,
        children: workbenchRoutes(),
      },
    ],
  },
]

function workbenchRoutes(): RouteObject[] {
  return [
    {
      index: true,
      element: <Navigate to={ROUTES.HOME} replace />,
    },
    {
      path: ROUTES.HOME,
      handle: routeMeta('home', 'home'),
      element: <HomePage />,
    },
    {
      path: '/mcp-chat',
      element: <MCPChatRedirect />,
    },
    {
      path: ROUTES.KNOWLEDGE,
      handle: routeMeta('knowledge', 'knowledge'),
      element: withLoading(Page.KnowledgeListPage),
    },
    ...skillRoutes,
    ...memoryRoutes,
    {
      path: ROUTES.EXPLORE,
      handle: routeMeta('explore', 'explore'),
      element: withLoading(Page.ExplorePage),
    },
    {
      path: ROUTES.SEARCH,
      handle: routeMeta('explore', 'search'),
      element: withLoading(Page.SearchListPage),
    },
    {
      path: '/search/:id',
      handle: routeMeta('explore', 'searchApp'),
      element: withLoading(Page.SearchDetailPage),
    },
    {
      // Previewing a document belongs to the knowledge it came from.
      path: '/document/:docId/preview',
      handle: routeMeta('knowledge', 'documentPreview'),
      element: withLoading(Page.DocumentPreviewPage),
    },
    {
      path: '/knowledge/create',
      handle: routeMeta('knowledge', 'knowledgeCreate'),
      element: withLoading(Page.KnowledgeCreatePage),
    },
    {
      // Keeps `import` from being read as a knowledge base id.
      path: '/knowledge/import',
      element: <Navigate to={ROUTES.KNOWLEDGE} replace />,
    },
    {
      path: '/knowledge/:id',
      handle: routeMeta('knowledge', 'knowledge'),
      element: withLoading(Page.KnowledgeDetailLayout),
      children: [
        {
          index: true,
          element: <Navigate to="documents" replace />,
        },
        {
          path: 'documents',
          handle: routeMeta(undefined, 'knowledgeDocuments'),
          element: withLoading(Page.KnowledgeDocumentsPage),
        },
        {
          path: 'search',
          handle: routeMeta(undefined, 'knowledgeRetrieval'),
          element: withLoading(Page.KnowledgeSearchPage),
        },
        {
          path: 'graph',
          handle: routeMeta(undefined, 'knowledgeGraph'),
          element: withLoading(Page.KnowledgeGraphPage),
        },
        {
          path: 'logs',
          handle: routeMeta(undefined, 'knowledgeLogs'),
          element: withLoading(Page.KnowledgeLogsPage),
        },
        {
          path: 'settings',
          handle: routeMeta(undefined, 'knowledgeSettings'),
          element: withLoading(Page.KnowledgeSettingsPage),
        },
      ],
    },
    {
      path: '/knowledge/:id/documents/:docId/chunks',
      handle: routeMeta('knowledge', 'documentChunks'),
      element: withLoading(Page.KnowledgeChunksLayout),
      children: [
        {
          index: true,
          element: withLoading(Page.DocumentChunksPage),
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
      handle: routeMeta('tools', 'autoFill'),
      element: withLoading(Page.AutoFillWorkbenchPage),
    },
    {
      path: ROUTES.AGENTS,
      handle: routeMeta('agents', 'agents'),
      element: withLoading(Page.AgentListPage),
    },
    {
      path: ROUTES.AGENT_LOGS,
      handle: routeMeta('agents', 'agentLogs'),
      element: withLoading(Page.AgentLogsPage),
    },
    {
      path: ROUTES.AGENT_TEMPLATES,
      handle: routeMeta('agents', 'agentTemplates'),
      element: withLoading(Page.AgentTemplatesPage),
    },
    {
      path: ROUTES.AGENT_LOG_REDIRECT,
      element: <AgentLogRedirect />,
    },
    {
      path: '/agent/:id',
      handle: routeMeta('agents', 'agentEditor'),
      element: withLoading(Page.AgentEditorPage),
    },
    {
      path: ROUTES.AGENT_EXPLORE,
      handle: routeMeta('agents', 'agentExplore'),
      element: withLoading(Page.AgentExplorePage),
    },
    {
      path: ROUTES.DATAFLOW_RESULT,
      handle: routeMeta('agents', 'pipelineResult'),
      element: withLoading(Page.PipelineResultPage),
    },
    {
      path: ROUTES.MCP_SERVERS,
      element: <Navigate to={MCP_PATH} replace />,
    },
    {
      path: ROUTES.STUDIO,
      handle: routeMeta('agents', 'studio'),
      element: withLoading(Page.StudioPage),
    },
    {
      path: ROUTES.STUDIO_CREATE_APP,
      handle: routeMeta('agents', 'studioEditor'),
      element: withLoading(Page.CreateAppPage),
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
    settingsRoutes(),
    {
      path: '*',
      handle: routeMeta(undefined, 'notFound'),
      element: <NotFoundPage placement="surface" />,
    },
  ]
}

function settingsRoutes(): RouteObject {
  const page = (
    path: string,
    title: PageTitleKey,
    Component: React.LazyExoticComponent<ComponentType>,
  ): RouteObject => ({
    path,
    handle: routeMeta(undefined, title),
    element: withLoading(Component),
  })
  return {
    path: '/settings',
    handle: routeMeta('settings', 'settings'),
    element: withLoading(Page.SettingsLayout),
    children: [
      {
        index: true,
        element: withLoading(Page.SettingsIndexRedirect),
      },
      page('datasource', 'datasource', Page.DataSourcePage),
      page('datasource-detail', 'datasourceDetail', Page.DataSourceDetailPage),
      page('profile', 'profile', Page.ProfilePage),
      page('team', 'team', Page.TeamPage),
      page('appearance', 'appearance', Page.AppearancePage),
      page('model-providers', 'modelProviders', Page.ModelProvidersPage),
      page('model-gateway', 'modelGateway', Page.ModelGatewayPage),
      page('mcp', 'mcp', Page.MCPPage),
      { path: 'mcp-servers', element: <SearchRedirect to={MCP_PATH} /> },
      {
        path: 'mcp-tools',
        element: <SearchRedirect to={MCP_PATH} tab="tools" />,
      },
      {
        path: 'mcp-test',
        element: <SearchRedirect to={MCP_PATH} tab="test" />,
      },
      {
        path: 'mcp-batch',
        element: <SearchRedirect to={MCP_PATH} tab="batch" />,
      },
      page('channels', 'channels', Page.ChannelsPage),
      {
        path: 'api-keys',
        element: <Navigate to={API_KEYS_PATH} replace />,
      },
      {
        path: 'api',
        children: [
          {
            index: true,
            element: <Navigate to={API_KEYS_PATH} replace />,
          },
          page('keys', 'apiKeys', Page.ApiKeysPage),
          page('docs', 'apiDocs', Page.ApiDocsPage),
        ],
      },
      page('system', 'systemStatus', Page.SystemPage),
      page('admin', 'userManagement', Page.AdminUsersPage),
      page('sandbox', 'sandbox', Page.SandboxPage),
    ],
  }
}

export const appRoutes: RouteObject[] = [
  {
    errorElement: <ErrorFallback />,
    element: (
      <RouteDocument>
        <RouteLocaleBoundary />
      </RouteDocument>
    ),
    // Unknown addresses fall to the workbench's `*` route: a product 404 in
    // the shell once signed in, the login page (with the address kept) before.
    children: topLevelRoutes,
  },
]

export const router = createBrowserRouter(appRoutes)
