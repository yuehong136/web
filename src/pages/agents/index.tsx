import { useAuthStore } from '@/stores/auth'
import { AgentTagEditor } from './components/agent-tag-editor'
import { useConsumedSearchFlag } from '@/hooks/use-consumed-search-flag'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CollectionTemplate } from '@/components/page-templates'
import {
  PageErrorState,
  CollectionSkeleton,
  Pager,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from '@/lib/toast'
import {
  buildAgentCanvasPath,
  buildInitialDsl,
  downloadFlowJson,
  inferCanvasTypeFromGraph,
  resolveCanvasCategory,
  resolveLocalizedText,
} from '@/lib/agent'
import {
  useDeleteAgent,
  useFetchAgentList,
  useFetchAgentTags,
  useSetAgent,
} from '@/hooks/use-agent-request'
import {
  type AgentCanvasType,
  type AgentDsl,
  type AgentFlow,
  type AgentGraph,
} from '@/types/agent'
import { ClipboardList, FileInput, LayoutTemplate, Plus } from 'lucide-react'
import {
  AgentCollection,
  AgentFilterBar,
  type AgentKindFilter,
  type AgentTimeFormat,
} from './components/agent-collection'
import { AgentEmptyState } from './components/agent-empty-state'
import { CreateAgentDialog } from './components/create-agent-dialog'
import { ImportAgentDialog } from './components/import-agent-dialog'
import { RenameAgentDialog } from './components/rename-agent-dialog'
import { useRenameAgent } from './hooks/use-rename-agent'
import { useCollectionView } from '@/stores/collection-view'

const DEFAULT_PAGE_SIZE = 12
const PAGE_SIZES = [6, 12, 24, 48]

export default function AgentsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [flowToEditTags, setFlowToEditTags] = useState<AgentFlow | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [keyword, setKeyword] = useState('')
  const [kind, setKind] = useState<AgentKindFilter>('all')
  const [timeFormat, setTimeFormat] = useState<AgentTimeFormat>('detailed')
  const [sortDesc, setSortDesc] = useState(true)
  const [createOpen, setCreateOpen] = useConsumedSearchFlag('create', '1')
  const [importOpen, setImportOpen] = useState(false)
  const [flowToDelete, setFlowToDelete] = useState<AgentFlow | null>(null)
  const [flowToRename, setFlowToRename] = useState<AgentFlow | null>(null)

  const listQuery = useFetchAgentList({
    page,
    page_size: pageSize,
    keywords: keyword,
    tags: selectedTags,
    canvas_type: kind === 'all' ? undefined : kind,
  })
  const { data: tagCounts } = useFetchAgentTags()
  const setAgent = useSetAgent({ showToast: false })
  const renameAgent = useRenameAgent()
  const deleteAgent = useDeleteAgent()

  const sortedAgents = useMemo(() => {
    const list = listQuery.agents || []
    return [...list].sort((a, b) =>
      sortDesc
        ? (b.update_time || 0) - (a.update_time || 0)
        : (a.update_time || 0) - (b.update_time || 0),
    )
  }, [listQuery.agents, sortDesc])

  const handleCreate = async (payload: {
    title: string
    kind: AgentCanvasType
  }) => {
    const flow = await setAgent.setAgent({
      title: payload.title,
      canvas_type: payload.kind,
      canvas_category: resolveCanvasCategory(payload.kind),
      dsl: buildInitialDsl(payload.kind),
    })

    toast.success(t('agents.created'))
    navigate(buildAgentCanvasPath(flow.id, payload.kind))
  }

  const handleImport = async (payload: { title: string; file: File }) => {
    const content = await payload.file.text()
    const parsed = JSON.parse(content) as {
      graph?: AgentGraph
      dsl?: AgentDsl
      globals?: Record<string, unknown>
      variables?: Record<string, unknown>
    }
    const graph = parsed.graph || parsed.dsl?.graph
    const hasGraph =
      graph && Array.isArray(graph.nodes) && Array.isArray(graph.edges)
    const hasComponents =
      parsed.dsl?.components &&
      typeof parsed.dsl.components === 'object' &&
      !Array.isArray(parsed.dsl.components)
    if ((!hasGraph && !hasComponents) || (graph !== undefined && !hasGraph))
      throw new Error('Unsupported workflow JSON')
    const kind = inferCanvasTypeFromGraph(graph)
    const dsl: AgentDsl = parsed.dsl || {
      components: {},
      history: [],
      graph: graph || { nodes: [], edges: [] },
      messages: [],
      reference: [],
      globals: parsed.globals || {},
      retrieval: [],
      variables: {},
    }

    const flow = await setAgent.setAgent({
      title: payload.title,
      canvas_type: kind,
      canvas_category: resolveCanvasCategory(kind),
      dsl,
    })

    toast.success(t('agents.imported'))
    navigate(buildAgentCanvasPath(flow.id, kind))
  }

  const handleDelete = () => {
    if (!flowToDelete || deleteAgent.isLoading) return
    const id = flowToDelete.id
    void deleteAgent
      .deleteAgent(id)
      .then(() =>
        setFlowToDelete((current) => (current?.id === id ? null : current)),
      )
      .catch(() => {
        // The mutation owner reports the failure; keep the selected asset for retry.
      })
  }

  const handleOpen = (flow: AgentFlow) => {
    navigate(buildAgentCanvasPath(flow.id, flow))
  }

  const handleViewLogs = (flow: AgentFlow) => {
    navigate(`/agents/log?canvas=${encodeURIComponent(flow.id)}`)
  }

  const handleRename = async (nextTitle: string) => {
    if (!flowToRename) {
      return
    }

    await renameAgent.rename(flowToRename, nextTitle)
    setFlowToRename(null)
  }

  const filtered = Boolean(keyword || kind !== 'all' || selectedTags.length)
  const [viewMode, setViewMode] = useCollectionView(
    'agents',
    listQuery.isLoading && !sortedAgents.length ? undefined : listQuery.total,
    filtered,
  )
  const pageState: 'content' | 'loading' | 'empty' | 'error' = listQuery.isError
    ? 'error'
    : listQuery.isLoading && !sortedAgents.length
      ? 'loading'
      : !sortedAgents.length
        ? 'empty'
        : 'content'
  // The empty state carries create, template and import; keep them once.
  const showCreateActions = pageState !== 'empty' || filtered
  const firstUse = !showCreateActions
  const resetFilters = () => {
    setKeyword('')
    setKind('all')
    setSelectedTags([])
    setPage(1)
  }

  return (
    <>
      <CollectionTemplate
        title={t('agents.center')}
        count={listQuery.total}
        countLabel={t('agents.resultCount', { count: listQuery.total })}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate('/agents/log')}>
              <ClipboardList className="size-icon-sm" aria-hidden="true" />
              {t('agents.opsLogs')}
            </Button>
            {showCreateActions ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/agent-templates')}
                >
                  <LayoutTemplate className="size-icon-sm" aria-hidden="true" />
                  {t('agents.templatesButton')}
                </Button>
                <Button variant="ghost" onClick={() => setImportOpen(true)}>
                  <FileInput className="size-icon-sm" aria-hidden="true" />
                  {t('agents.importJson')}
                </Button>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="size-icon-sm" aria-hidden="true" />
                  {t('agents.createAsset')}
                </Button>
              </>
            ) : null}
          </>
        }
        filterBar={
          firstUse ? undefined : (
            <AgentFilterBar
              keyword={keyword}
              onKeywordChange={(value) => {
                setPage(1)
                setKeyword(value)
              }}
              kind={kind}
              onKindChange={(value) => {
                setPage(1)
                setKind(value)
              }}
              tags={selectedTags}
              tagCounts={tagCounts}
              onTagsChange={(value) => {
                setPage(1)
                setSelectedTags(value)
              }}
              onClearFilters={() => {
                setPage(1)
                setKind('all')
                setSelectedTags([])
              }}
              sortDescending={sortDesc}
              onSortDescendingChange={setSortDesc}
              timeFormat={timeFormat}
              onTimeFormatChange={setTimeFormat}
              view={viewMode}
              onViewChange={setViewMode}
            />
          )
        }
        state={pageState}
        refreshing={listQuery.isFetching && !listQuery.isLoading}
        loadingState={
          <CollectionSkeleton
            view={viewMode === 'list' ? 'list' : 'grid'}
            label={t('agents.loadingTitle')}
          />
        }
        errorState={
          <PageErrorState
            title={t('agents.loadFailedTitle')}
            description={t('agents.loadFailedDescription')}
            retryLabel={t('common.retry')}
            onRetry={() => {
              void listQuery.refetch()
            }}
          />
        }
        emptyState={
          <AgentEmptyState
            type={filtered ? 'search' : 'list'}
            onCreate={() => setCreateOpen(true)}
            onTemplate={() => navigate('/agent-templates')}
            onImport={() => setImportOpen(true)}
            onReset={resetFilters}
          />
        }
        footerNote={t('agents.sortPageScope')}
        footer={
          <Pager
            page={page}
            pageSize={pageSize}
            total={listQuery.total}
            onPageChange={setPage}
            pageSizeOptions={PAGE_SIZES}
            onPageSizeChange={(size) => {
              setPage(1)
              setPageSize(size)
            }}
          />
        }
      >
        <AgentCollection
          agents={sortedAgents}
          view={viewMode}
          timeFormat={timeFormat}
          currentUserId={currentUserId}
          onOpen={handleOpen}
          onDelete={setFlowToDelete}
          onExport={downloadFlowJson}
          onRename={setFlowToRename}
          onEditTags={setFlowToEditTags}
          onViewLogs={handleViewLogs}
          onCreate={() => setCreateOpen(true)}
        />
      </CollectionTemplate>

      {flowToEditTags && (
        <AgentTagEditor
          key={flowToEditTags.id}
          agent={flowToEditTags}
          onClose={() => setFlowToEditTags(null)}
        />
      )}

      <CreateAgentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onConfirm={handleCreate}
      />

      <ImportAgentDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
      />

      <RenameAgentDialog
        flow={flowToRename}
        open={Boolean(flowToRename)}
        isLoading={renameAgent.isLoading}
        onOpenChange={(open) => !open && setFlowToRename(null)}
        onConfirm={handleRename}
      />

      <ConfirmDialog
        open={Boolean(flowToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteAgent.isLoading) setFlowToDelete(null)
        }}
        variant="destructive"
        pending={deleteAgent.isLoading}
        title={t('agents.deleteTitle')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('agents.confirmDelete')}
        onConfirm={handleDelete}
        description={
          flowToDelete
            ? t('agents.deleteDescription', {
                name: resolveLocalizedText(
                  flowToDelete.title,
                  t('agents.unnamedAgent'),
                ),
              })
            : t('agents.deleteFallback')
        }
      />
    </>
  )
}
