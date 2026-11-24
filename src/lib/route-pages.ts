import { lazy } from 'react'
import { lazyNamed } from './route-loading'

/**
 * Route-level code split: every page the router mounts lazily. The router
 * reads them as `Page.<Name>`; LoginPage and HomePage stay static there.
 * Feature route modules (skills, memory) declare their own pages.
 */

export const RegisterPage = lazyNamed(
  () => import('@/pages/auth/RegisterPage'),
  'RegisterPage',
)

// Knowledge
export const KnowledgeListPage = lazyNamed(
  () => import('@/pages/knowledge/KnowledgeListPage'),
  'KnowledgeListPage',
)
export const KnowledgeDetailLayout = lazyNamed(
  () => import('@/pages/knowledge/KnowledgeDetailLayout'),
  'KnowledgeDetailLayout',
)
export const KnowledgeChunksLayout = lazyNamed(
  () => import('@/pages/knowledge'),
  'KnowledgeChunksLayout',
)
export const KnowledgeDocumentsPage = lazyNamed(
  () => import('@/pages/knowledge/documents'),
  'KnowledgeDocumentsPage',
)
export const KnowledgeSearchPage = lazyNamed(
  () => import('@/pages/knowledge/KnowledgeSearchPage'),
  'KnowledgeSearchPage',
)
export const KnowledgeGraphPage = lazyNamed(
  () => import('@/pages/knowledge/graph'),
  'KnowledgeGraphPage',
)
export const KnowledgeSettingsPage = lazyNamed(
  () => import('@/pages/knowledge/KnowledgeSettingsPage'),
  'KnowledgeSettingsPage',
)
export const KnowledgeCreatePage = lazyNamed(
  () => import('@/pages/knowledge/KnowledgeCreatePage'),
  'KnowledgeCreatePage',
)

export const DocumentChunksPage = lazyNamed(
  () => import('@/pages/knowledge/DocumentChunksPage'),
  'DocumentChunksPage',
)
export const KnowledgeLogsPage = lazyNamed(
  () => import('@/pages/knowledge/logs'),
  'KnowledgeLogsPage',
)

// Explore & Search
export const ExplorePage = lazyNamed(
  () => import('@/pages/explore'),
  'ExplorePage',
)
export const SearchListPage = lazyNamed(
  () => import('@/pages/search'),
  'SearchListPage',
)
export const SearchDetailPage = lazyNamed(
  () => import('@/pages/search/detail/SearchDetailPage'),
  'SearchDetailPage',
)

// Agent
export const AgentListPage = lazy(() => import('@/pages/agents'))
export const AgentLogsPage = lazy(() => import('@/pages/agents/log'))
export const AgentTemplatesPage = lazy(() => import('@/pages/agents/templates'))
export const AgentEditorPage = lazy(() => import('@/pages/agent'))
export const AgentExplorePage = lazy(() => import('@/pages/agent/explore'))
export const AgentSharePage = lazy(() => import('@/pages/agent/share'))
export const AgentWidgetPage = lazy(() => import('@/pages/agent/share/widget'))
export const PipelineResultPage = lazy(
  () => import('@/pages/agent/pipeline-result'),
)

// Studio
export const StudioPage = lazyNamed(
  () => import('@/pages/studio'),
  'StudioPage',
)
export const CreateAppPage = lazyNamed(
  () => import('@/pages/studio/CreateAppPage'),
  'CreateAppPage',
)

// AI Tools
export const AutoFillWorkbenchPage = lazyNamed(
  () => import('@/pages/ai-tools'),
  'AutoFillWorkbenchPage',
)

// Settings
export const SettingsLayout = lazyNamed(
  () => import('@/pages/settings/SettingsLayout'),
  'SettingsLayout',
)
export const ProfilePage = lazyNamed(
  () => import('@/pages/settings/profile'),
  'ProfilePage',
)
export const AppearancePage = lazyNamed(
  () => import('@/pages/settings/appearance/appearance-page'),
  'AppearancePage',
)
export const SettingsIndexRedirect = lazyNamed(
  () => import('@/pages/settings/SettingsLayout'),
  'SettingsIndexRedirect',
)
export const ModelProvidersPage = lazyNamed(
  () => import('@/pages/settings/model-providers'),
  'ModelProvidersPage',
)
export const ModelGatewayPage = lazyNamed(
  () => import('@/pages/settings/model-gateway'),
  'ModelGatewayPage',
)
export const MCPPage = lazyNamed(
  () => import('@/pages/settings/mcp/mcp-page'),
  'MCPPage',
)
export const ApiKeysPage = lazyNamed(
  () => import('@/pages/settings/api-keys/api-keys-page'),
  'ApiKeysPage',
)
export const ApiDocsPage = lazyNamed(
  () => import('@/pages/settings/api-docs/api-docs-page'),
  'ApiDocsPage',
)
export const SystemPage = lazyNamed(
  () => import('@/pages/system'),
  'SystemPage',
)
export const TeamPage = lazyNamed(() => import('@/pages/team'), 'TeamPage')
export const DataSourcePage = lazy(() => import('@/pages/settings/datasource'))
export const DataSourceDetailPage = lazy(
  () => import('@/pages/settings/datasource/detail'),
)
export const SandboxPage = lazyNamed(
  () => import('@/pages/settings/admin/sandbox/sandbox-page'),
  'SandboxPage',
)
export const AdminUsersPage = lazyNamed(
  () => import('@/pages/settings/admin'),
  'AdminUsersPage',
)
export const ChannelsPage = lazyNamed(
  () => import('@/pages/settings/channels'),
  'ChannelsPage',
)

// Document Preview
export const DocumentPreviewPage = lazy(
  () => import('@/pages/document-preview'),
)
