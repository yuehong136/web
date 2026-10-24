import { useAuthStore } from '@/stores/auth'
import { AgentTagEditor } from './components/agent-tag-editor'
import { useConsumedSearchFlag } from '@/hooks/use-consumed-search-flag'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ListPageTemplate } from '@/components/page-templates'
import {
  AppScene,
  ListPagination,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterPopover, type FilterValue } from '@/components/ui/filter-popover'
import { AssetListControls } from '@/components/patterns/asset-list-controls'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  AgentCanvasType,
  type AgentDsl,
  type AgentFlow,
  type AgentGraph,
} from '@/types/agent'
import {
  ClipboardList,
  FileInput,
  LayoutTemplate,
  Plus,
  Search,
} from 'lucide-react'
import { AgentCard } from './components/agent-card'
import { AgentEmptyState } from './components/agent-empty-state'
import {
  AgentListView,
  type AgentTimeFormat,
} from './components/agent-list-view'
import { CreateAgentDialog } from './components/create-agent-dialog'
import { ImportAgentDialog } from './components/import-agent-dialog'
import { RenameAgentDialog } from './components/rename-agent-dialog'
import { useRenameAgent } from './hooks/use-rename-agent'

const DEFAULT_PAGE_SIZE = 12

export default function AgentsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [flowToEditTags, setFlowToEditTags] = useState<AgentFlow | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [keyword, setKeyword] = useState('')
  const [kind, setKind] = useState<'all' | AgentCanvasType>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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

    toast.success(t('agents.created', '骨架已创建'))
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

    toast.success(t('agents.imported', 'JSON 已导入到新的 Agent 骨架'))
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

  const filterValue: FilterValue = {
    kind: kind === 'all' ? [] : [kind],
    tags: selectedTags,
  }

  const handleFilterChange = (value: FilterValue) => {
    const next = value.kind?.[0] as AgentCanvasType | undefined
    setPage(1)
    setKind(next || 'all')
    setSelectedTags(value.tags || [])
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

  const showEmptyState = !listQuery.isLoading && sortedAgents.length === 0
  const emptyStateType: 'list' | 'search' =
    keyword || kind !== 'all' || selectedTags.length ? 'search' : 'list'

  const pageState: 'content' | 'loading' | 'empty' | 'error' = (() => {
    if (listQuery.isLoading && page === 1) return 'loading'
    if (listQuery.isError) return 'error'
    if (showEmptyState) return 'empty'
    return 'content'
  })()

  return (
    <>
      <ListPageTemplate
        title={t('agents.center')}
        className="p-space-base md:p-space-lg"
        description={t('agents.centerDescription')}
        headerActions={
          <>
            <Button
              variant="outline"
              onClick={() => navigate('/agent-templates')}
            >
              <LayoutTemplate className="size-icon-sm" aria-hidden="true" />
              {t('agents.templatesButton', '模板')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/agents/log')}>
              <ClipboardList className="size-icon-sm" aria-hidden="true" />
              {t('agents.opsLogs', '运维日志')}
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileInput className="size-icon-sm" aria-hidden="true" />
              {t('agents.importJson', '导入 JSON')}
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-icon-sm" aria-hidden="true" />
              {t('agents.createAsset', '新建资产')}
            </Button>
          </>
        }
        toolbarLeft={
          <Input
            type="search"
            aria-label={t('agents.searchPlaceholder')}
            placeholder={t('agents.searchPlaceholder', '搜索标题或资产意图')}
            value={keyword}
            onChange={(event) => {
              setPage(1)
              setKeyword(event.target.value)
            }}
            leftIcon={<Search className="size-icon-sm" aria-hidden="true" />}
          />
        }
        toolbarRight={
          <>
            <FilterPopover
              filters={[
                {
                  key: 'kind',
                  label: t('agents.type', '类型'),
                  options: [
                    { value: AgentCanvasType.AGENT, label: t('agents.agents') },
                    {
                      value: AgentCanvasType.PIPELINE,
                      label: t('agents.pipelines'),
                    },
                  ],
                },
                {
                  key: 'tags',
                  label: t('agents.tags'),
                  options: [
                    ...new Set([
                      ...tagCounts.map(({ tag }) => tag),
                      ...selectedTags,
                    ]),
                  ].map((tag) => ({
                    value: tag,
                    label: `${tag} (${tagCounts.find((entry) => entry.tag === tag)?.count || 0})`,
                  })),
                },
              ]}
              className="h-auto min-h-[var(--control-height-sm)]"
              value={filterValue}
              onChange={handleFilterChange}
            />
            <AssetListControls
              view={viewMode}
              onViewChange={setViewMode}
              timeFormat={timeFormat}
              onTimeFormatChange={setTimeFormat}
              sortDescending={sortDesc}
              onToggleSort={() => setSortDesc((value) => !value)}
              labels={{
                view: t('common.viewToggle'),
                grid: t('agents.gridView'),
                list: t('agents.listView'),
                timeFormat: t('agents.timeFormat'),
                detailed: t('agents.detailedTime'),
                compact: t('agents.compactTime'),
                relative: t('agents.relativeTime'),
                newest: t('agents.descending'),
                oldest: t('agents.ascending'),
              }}
            />
          </>
        }
        pagination={
          <ListPagination
            total={listQuery.total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPage(1)
              setPageSize(size)
            }}
          />
        }
        state={pageState}
        loadingState={
          <PageLoadingState
            scene={AppScene.CONSOLE}
            title={t('agents.loadingTitle', '正在加载 Agent 资产')}
            description={t('agents.loadingDescription')}
          />
        }
        errorState={
          <PageErrorState
            scene={AppScene.CONSOLE}
            title={t('agents.loadFailedTitle', 'Agent 列表加载失败')}
            description={t('agents.loadFailedDescription')}
            retryLabel={t('common.retry')}
            onRetry={() => {
              void listQuery.refetch()
            }}
          />
        }
        emptyState={
          <AgentEmptyState
            type={emptyStateType}
            onCreate={() => setCreateOpen(true)}
            onTemplate={() => navigate('/agent-templates')}
            onImport={() => setImportOpen(true)}
            onReset={() => {
              setKeyword('')
              setKind('all')
              setSelectedTags([])
              setPage(1)
            }}
          />
        }
      >
        <div className="mb-space-base flex flex-wrap justify-between gap-space-sm text-sm text-text-secondary">
          <p>{t('agents.resultCount', { count: listQuery.total })}</p>
          <p className="text-xs">{t('agents.sortPageScope')}</p>
        </div>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2 xl:grid-cols-3">
            {listQuery.isLoading
              ? [...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-[180px] animate-pulse rounded-radius-lg bg-surface-secondary"
                  />
                ))
              : sortedAgents.map((flow) => (
                  <AgentCard
                    key={flow.id}
                    flow={flow}
                    onOpen={handleOpen}
                    onDelete={setFlowToDelete}
                    onExport={downloadFlowJson}
                    onRename={setFlowToRename}
                    onEditTags={
                      currentUserId &&
                      (flow.user_id || flow.tenant_id) === currentUserId
                        ? setFlowToEditTags
                        : undefined
                    }
                    onViewLogs={handleViewLogs}
                    timeFormat={timeFormat}
                  />
                ))}
          </div>
        ) : (
          <AgentListView
            data={sortedAgents}
            isLoading={listQuery.isLoading}
            timeFormat={timeFormat}
            onOpen={handleOpen}
            onDelete={setFlowToDelete}
            onExport={downloadFlowJson}
            onRename={setFlowToRename}
            onEditTags={setFlowToEditTags}
            currentUserId={currentUserId}
            onViewLogs={handleViewLogs}
          />
        )}
      </ListPageTemplate>

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

      <AlertDialog
        open={Boolean(flowToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteAgent.isLoading) setFlowToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('agents.deleteTitle', '删除 Agent 资产')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {flowToDelete
                ? t(
                    'agents.deleteDescription',
                    '将删除「{{name}}」。当前阶段不保留回收站。',
                    {
                      name: resolveLocalizedText(
                        flowToDelete.title,
                        t('agents.unnamedAgent'),
                      ),
                    },
                  )
                : t('agents.deleteFallback', '删除后无法恢复。')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAgent.isLoading}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              loading={deleteAgent.isLoading}
              onClick={handleDelete}
            >
              {t('agents.confirmDelete', '确认删除')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
