import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ListPageTemplate } from '@/components/page-templates'
import {
  AppScene,
  ListPagination,
  PageErrorState,
  PageLoadingState,
  StatGrid,
} from '@/components/patterns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterPopover, type FilterValue } from '@/components/ui/filter-popover'
import { CustomSelect } from '@/components/ui/custom-select'
import { ViewToggle } from '@/components/ui/view-toggle'
import { MemoryStatsCard } from '@/components/memory'
import {
  AlertDialog,
  AlertDialogAction,
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
  countFlowNodes,
  inferCanvasTypeFromGraph,
  isPipelineFlow,
  resolveCanvasCategory,
} from '@/lib/agent'
import {
  useDeleteAgent,
  useFetchAgentList,
  useSetAgent,
} from '@/hooks/use-agent-request'
import {
  AgentCanvasType,
  type AgentDsl,
  type AgentFlow,
  type AgentGraph,
} from '@/types/agent'
import {
  ArrowUpDown,
  Bot,
  ClipboardList,
  Database,
  FileInput,
  Grid,
  LayoutTemplate,
  List as ListIcon,
  Plus,
  Search,
  Sparkles,
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [keyword, setKeyword] = useState('')
  const [kind, setKind] = useState<'all' | AgentCanvasType>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [timeFormat, setTimeFormat] = useState<AgentTimeFormat>('detailed')
  const [sortDesc, setSortDesc] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [flowToDelete, setFlowToDelete] = useState<AgentFlow | null>(null)
  const [flowToRename, setFlowToRename] = useState<AgentFlow | null>(null)

  const listQuery = useFetchAgentList({
    page,
    page_size: pageSize,
    keywords: keyword,
    canvas_type: kind === 'all' ? undefined : kind,
  })
  const setAgent = useSetAgent()
  const renameAgent = useRenameAgent()
  const deleteAgent = useDeleteAgent()

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateOpen(true)
      const nextSearchParams = new URLSearchParams(searchParams)
      nextSearchParams.delete('create')
      setSearchParams(nextSearchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const stats = useMemo(() => {
    const agents = listQuery.agents || []
    return {
      total: listQuery.total,
      agentCount: agents.filter((flow) => !isPipelineFlow(flow)).length,
      pipelineCount: agents.filter((flow) => isPipelineFlow(flow)).length,
      readyForBuild: agents.filter((flow) => countFlowNodes(flow) > 1).length,
    }
  }, [listQuery.agents, listQuery.total])

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

  const handleDelete = async () => {
    if (!flowToDelete) {
      return
    }

    await deleteAgent.deleteAgent(flowToDelete.id)
    setFlowToDelete(null)
  }

  const filterValue: FilterValue = {
    kind: kind === 'all' ? [] : [kind],
  }

  const handleFilterChange = (value: FilterValue) => {
    const next = value.kind?.[0] as AgentCanvasType | undefined
    setPage(1)
    setKind(next || 'all')
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
    keyword || kind !== 'all' ? 'search' : 'list'

  const pageState: 'content' | 'loading' | 'empty' | 'error' = (() => {
    if (listQuery.isLoading && page === 1) return 'loading'
    if (listQuery.isError) return 'error'
    if (showEmptyState) return 'empty'
    return 'content'
  })()

  return (
    <>
      <ListPageTemplate
        title={t('agents.center', 'Agent Center')}
        description={t(
          'agents.centerDescription',
          '先把信息架构、路由、类型与运行入口搭好，再逐步增量替换每个节点表单和运行细节。',
        )}
        headerActions={
          <>
            <Button
              variant="outline"
              onClick={() => navigate('/agent-templates')}
            >
              <LayoutTemplate className="mr-2 h-4 w-4" />
              {t('agents.templatesButton', '模板')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/agents/log')}>
              <ClipboardList className="mr-2 h-4 w-4" />
              {t('agents.opsLogs', '运维日志')}
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileInput className="mr-2 h-4 w-4" />
              {t('agents.importJson', '导入 JSON')}
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('agents.createAsset', '新建资产')}
            </Button>
          </>
        }
        stats={
          <StatGrid>
            <MemoryStatsCard
              title={t('agents.totalAssets', '总资产')}
              value={stats.total}
              icon={Sparkles}
              color="info"
            />
            <MemoryStatsCard
              title={t('agents.agents', 'Agents')}
              value={stats.agentCount}
              icon={Bot}
              color="success"
            />
            <MemoryStatsCard
              title={t('agents.pipelines', 'Pipelines')}
              value={stats.pipelineCount}
              icon={Database}
              color="warning"
            />
            <MemoryStatsCard
              title={t('agents.expandedNodes', '已扩展节点')}
              value={stats.readyForBuild}
              icon={LayoutTemplate}
              color="purple"
            />
          </StatGrid>
        }
        toolbarLeft={
          <Input
            type="search"
            placeholder={t('agents.searchPlaceholder', '搜索标题或资产意图')}
            value={keyword}
            onChange={(event) => {
              setPage(1)
              setKeyword(event.target.value)
            }}
            leftIcon={<Search className="h-4 w-4" />}
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
                    { value: AgentCanvasType.AGENT, label: 'Agent' },
                    { value: AgentCanvasType.PIPELINE, label: 'Pipeline' },
                  ],
                },
              ]}
              value={filterValue}
              onChange={handleFilterChange}
            />
            <CustomSelect
              options={[
                {
                  value: 'detailed',
                  label: t('agents.detailedTime', '详细时间'),
                },
                {
                  value: 'compact',
                  label: t('agents.compactTime', '简洁时间'),
                },
                {
                  value: 'relative',
                  label: t('agents.relativeTime', '相对时间'),
                },
              ]}
              value={timeFormat}
              onChange={(value) => setTimeFormat(value as AgentTimeFormat)}
              size="sm"
              className="min-w-[100px]"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDesc((prev) => !prev)}
              className="flex h-9 items-center gap-1 px-2 text-xs"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>
                {sortDesc
                  ? t('agents.descending', '倒序')
                  : t('agents.ascending', '正序')}
              </span>
            </Button>
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              size="md"
              options={[
                {
                  value: 'grid',
                  icon: <Grid />,
                  label: t('agents.gridView', '网格视图'),
                },
                {
                  value: 'list',
                  icon: <ListIcon />,
                  label: t('agents.listView', '列表视图'),
                },
              ]}
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
            description={t(
              'agents.loadingDescription',
              '新的管理骨架正在整理列表、模板与导入入口。',
            )}
          />
        }
        errorState={
          <PageErrorState
            scene={AppScene.CONSOLE}
            title={t('agents.loadFailedTitle', 'Agent 列表加载失败')}
            description={t(
              'agents.loadFailedDescription',
              '请检查后端 canvas 接口或稍后重试。',
            )}
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
          />
        }
      >
        {viewMode === 'grid' ? (
          <div className="gap-space-lg grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {listQuery.isLoading
              ? [...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-radius-lg bg-surface-secondary h-[180px] animate-pulse"
                  />
                ))
              : sortedAgents.map((flow) => (
                  <AgentCard
                    key={flow.id}
                    flow={flow}
                    onOpen={handleOpen}
                    onDelete={setFlowToDelete}
                    onRename={setFlowToRename}
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
            onRename={setFlowToRename}
            onViewLogs={handleViewLogs}
          />
        )}
      </ListPageTemplate>

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
        onOpenChange={(open) => !open && setFlowToDelete(null)}
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
                    { name: resolveLabel(flowToDelete) },
                  )
                : t('agents.deleteFallback', '删除后无法恢复。')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', '取消')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t('agents.confirmDelete', '确认删除')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function resolveLabel(flow: AgentFlow) {
  return typeof flow.title === 'string'
    ? flow.title
    : flow.title?.zh || flow.title?.en || '未命名资产'
}
