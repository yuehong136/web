import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import {
  FilterPopover,
  type FilterValue,
} from '@/components/ui/filter-popover'
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
import { AgentListView, type AgentTimeFormat } from './components/agent-list-view'
import { CreateAgentDialog } from './components/create-agent-dialog'
import { ImportAgentDialog } from './components/import-agent-dialog'

const DEFAULT_PAGE_SIZE = 12

export default function AgentsPage() {
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

  const listQuery = useFetchAgentList({
    page,
    page_size: pageSize,
    keywords: keyword,
    canvas_type: kind === 'all' ? undefined : kind,
  })
  const setAgent = useSetAgent()
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
    return [...list].sort((a, b) => (
      sortDesc
        ? (b.update_time || 0) - (a.update_time || 0)
        : (a.update_time || 0) - (b.update_time || 0)
    ))
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

    toast.success('骨架已创建')
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

    toast.success('JSON 已导入到新的 Agent 骨架')
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

  const showEmptyState = !listQuery.isLoading && sortedAgents.length === 0
  const emptyStateType: 'list' | 'search' = keyword || kind !== 'all' ? 'search' : 'list'

  const pageState: 'content' | 'loading' | 'empty' | 'error' = (() => {
    if (listQuery.isLoading && page === 1) return 'loading'
    if (listQuery.isError) return 'error'
    if (showEmptyState) return 'empty'
    return 'content'
  })()

  return (
    <>
      <ListPageTemplate
        title="Agent Center"
        description="先把信息架构、路由、类型与运行入口搭好,再逐步增量替换每个节点表单和运行细节。"
        headerActions={
          <>
            <Button variant="outline" onClick={() => navigate('/agent-templates')}>
              <LayoutTemplate className="h-4 w-4 mr-2" />
              模板
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileInput className="h-4 w-4 mr-2" />
              导入 JSON
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              新建资产
            </Button>
          </>
        }
        stats={
          <StatGrid>
            <MemoryStatsCard title="总资产" value={stats.total} icon={Sparkles} color="info" />
            <MemoryStatsCard title="Agents" value={stats.agentCount} icon={Bot} color="success" />
            <MemoryStatsCard title="Pipelines" value={stats.pipelineCount} icon={Database} color="warning" />
            <MemoryStatsCard title="已扩展节点" value={stats.readyForBuild} icon={LayoutTemplate} color="purple" />
          </StatGrid>
        }
        toolbarLeft={
          <Input
            type="search"
            placeholder="搜索标题或资产意图"
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
                  label: '类型',
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
                { value: 'detailed', label: '详细时间' },
                { value: 'compact', label: '简洁时间' },
                { value: 'relative', label: '相对时间' },
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
              className="h-9 px-2 flex items-center gap-1 text-xs"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>{sortDesc ? '倒序' : '正序'}</span>
            </Button>
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              size="md"
              options={[
                { value: 'grid', icon: <Grid />, label: '网格视图' },
                { value: 'list', icon: <ListIcon />, label: '列表视图' },
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
            title="正在加载 Agent 资产"
            description="新的管理骨架正在整理列表、模板与导入入口。"
          />
        }
        errorState={
          <PageErrorState
            scene={AppScene.CONSOLE}
            title="Agent 列表加载失败"
            description="请检查后端 canvas 接口或稍后重试。"
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

      <AlertDialog open={Boolean(flowToDelete)} onOpenChange={(open) => !open && setFlowToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除 Agent 资产</AlertDialogTitle>
            <AlertDialogDescription>
              {flowToDelete
                ? `将删除「${resolveLabel(flowToDelete)}」。当前阶段不保留回收站。`
                : '删除后无法恢复。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function resolveLabel(flow: AgentFlow) {
  return typeof flow.title === 'string' ? flow.title : flow.title?.zh || flow.title?.en || '未命名资产'
}
