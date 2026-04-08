import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ConsolePageTemplate } from '@/components/page-templates'
import {
  AppScene,
  PageEmptyState,
  PageErrorState,
  PageHeader,
  PageLoadingState,
  PageToolbar,
  SectionCard,
  StatCard,
} from '@/components/patterns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { buildInitialDsl, inferCanvasTypeFromGraph, isPipelineFlow } from '@/lib/agent'
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
  Bot,
  Database,
  FileInput,
  LayoutTemplate,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react'
import { AgentCard } from './components/agent-card'
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
      readyForBuild: agents.filter((flow) => (flow.dsl.graph?.nodes.length || 0) > 1).length,
    }
  }, [listQuery.agents, listQuery.total])

  const handleCreate = async (payload: {
    title: string
    kind: AgentCanvasType
  }) => {
    const flow = await setAgent.setAgent({
      title: payload.title,
      canvas_type: payload.kind,
      dsl: buildInitialDsl(payload.kind),
    })

    toast.success('骨架已创建')
    navigate(`/agent/${flow.id}`)
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
      canvas_type: inferCanvasTypeFromGraph(graph),
      dsl,
    })

    toast.success('JSON 已导入到新的 Agent 骨架')
    navigate(`/agent/${flow.id}`)
  }

  const handleDelete = async () => {
    if (!flowToDelete) {
      return
    }

    await deleteAgent.deleteAgent(flowToDelete.id)
    setFlowToDelete(null)
  }

  const content = (() => {
    if (listQuery.isLoading && page === 1) {
      return (
        <PageLoadingState
          scene={AppScene.CONSOLE}
          title="正在加载 Agent 资产"
          description="新的管理骨架正在整理列表、模板与导入入口。"
        />
      )
    }

    if (listQuery.isError) {
      return (
        <PageErrorState
          scene={AppScene.CONSOLE}
          title="Agent 列表加载失败"
          description="请检查后端 canvas 接口或稍后重试。"
          onRetry={() => {
            void listQuery.refetch()
          }}
        />
      )
    }

    if (!listQuery.agents.length) {
      return (
        <PageEmptyState
          scene={AppScene.CONSOLE}
          title="还没有 Agent 资产"
          description="第一阶段已经接好管理骨架，现在可以从空白创建、模板创建或导入 JSON 开始。"
          action={
            <div className="flex flex-wrap items-center justify-center gap-space-sm">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-space-xs h-4 w-4" />
                新建
              </Button>
              <Button variant="outline" onClick={() => navigate('/agent-templates')}>
                <LayoutTemplate className="mr-space-xs h-4 w-4" />
                模板
              </Button>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <FileInput className="mr-space-xs h-4 w-4" />
                导入 JSON
              </Button>
            </div>
          }
        />
      )
    }

    return (
      <div className="space-y-space-lg p-space-lg">
        <div className="grid gap-space-lg md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="总资产" value={stats.total} icon={<Sparkles className="h-5 w-5" />} tone="info" />
          <StatCard title="Agents" value={stats.agentCount} icon={<Bot className="h-5 w-5" />} tone="success" />
          <StatCard title="Pipelines" value={stats.pipelineCount} icon={<Database className="h-5 w-5" />} tone="warning" />
          <StatCard title="已扩展节点" value={stats.readyForBuild} description="节点数大于 1 的资产" icon={<LayoutTemplate className="h-5 w-5" />} />
        </div>

        <SectionCard
          title="全部资产"
          actions={
            <div className="flex items-center gap-space-sm">
              <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="h-10 w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 / 页</SelectItem>
                  <SelectItem value="24">24 / 页</SelectItem>
                  <SelectItem value="48">48 / 页</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          <div className="grid gap-space-lg md:grid-cols-2 xl:grid-cols-3">
            {listQuery.agents.map((flow) => (
              <AgentCard
                key={flow.id}
                flow={flow}
                onOpen={(id) => navigate(`/agent/${id}`)}
                onDelete={setFlowToDelete}
              />
            ))}
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <Pagination
            current={page}
            total={listQuery.total}
            pageSize={pageSize}
            onChange={setPage}
          />
        </div>
      </div>
    )
  })()

  return (
    <>
      <ConsolePageTemplate
        header={
          <PageHeader
            title="Agent Center"
            description="先把信息架构、路由、类型与运行入口搭好，再逐步增量替换每个节点表单和运行细节。"
            actions={
              <>
                <Button variant="outline" onClick={() => navigate('/agent-templates')}>
                  <LayoutTemplate className="mr-space-xs h-4 w-4" />
                  模板
                </Button>
                <Button variant="outline" onClick={() => setImportOpen(true)}>
                  <FileInput className="mr-space-xs h-4 w-4" />
                  导入 JSON
                </Button>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-space-xs h-4 w-4" />
                  新建资产
                </Button>
              </>
            }
          />
        }
        toolbar={
          <PageToolbar
            left={
              <div className="relative max-w-md flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input
                  value={keyword}
                  onChange={(event) => {
                    setPage(1)
                    setKeyword(event.target.value)
                  }}
                  className="pl-9"
                  placeholder="搜索标题或资产意图"
                />
              </div>
            }
            right={
              <Select
                value={kind}
                onValueChange={(value) => {
                  setPage(1)
                  setKind(value as 'all' | AgentCanvasType)
                }}
              >
                <SelectTrigger className="h-10 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value={AgentCanvasType.AGENT}>仅 Agent</SelectItem>
                  <SelectItem value={AgentCanvasType.PIPELINE}>仅 Pipeline</SelectItem>
                </SelectContent>
              </Select>
            }
          />
        }
      >
        {content}
      </ConsolePageTemplate>

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
