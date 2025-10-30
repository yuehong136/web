import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Workflow, FileJson, Sparkles, Search, Filter } from 'lucide-react'
import { agentAPI } from '@/api/agent'
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants'
import { humanId } from 'human-id'
import { Operator, initialBeginValues } from './constant'
import { Position } from '@xyflow/react'
import { CreateAgentDialog } from './components/CreateAgentDialog'
import { TemplatesPage } from './components/TemplatesPage'
import { AgentCard } from './components/AgentCard'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/toast'

export default function AgentListPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'agent' | 'pipeline'>('all')

  // 获取Agent列表
  const { data: agentsData, isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEYS.AGENTS],
    queryFn: async () => {
      console.log('🔍 开始获取Agent列表...')
      const result = await agentAPI.listAgents()
      console.log('📦 Agent列表返回:', result)
      return result
    },
  })

  const agents = agentsData?.canvas || []

  // 过滤和搜索
  const filteredAgents = agents.filter((agent) => {
    // 类型过滤
    if (filterType !== 'all') {
      const isPlugin = agent.canvas_type === 'pipeline' || agent.canvas_category === 'Ingestion'
      if (filterType === 'pipeline' && !isPlugin) return false
      if (filterType === 'agent' && isPlugin) return false
    }

    // 搜索过滤
    if (searchKeyword) {
      const title = typeof agent.title === 'object'
        ? (agent.title.zh || agent.title.en || '')
        : (agent.title || '')
      return title.toLowerCase().includes(searchKeyword.toLowerCase())
    }

    return true
  })

  // 从对话框创建Agent
  const handleCreateFromDialog = async (title: string, canvasType: 'agent' | 'pipeline') => {
    console.log('🎨 创建Agent:', { title, canvasType })
    try {
      const beginNode = {
        id: `${Operator.Begin}:${humanId()}`,
        type: 'beginNode',
        position: { x: 100, y: 100 },
        data: {
          label: Operator.Begin,
          name: 'Begin',
          form: initialBeginValues,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      }

      console.log('📤 发送创建请求...')
      const result = await agentAPI.setAgent({
        title,
        description: '',
        canvas_type: canvasType,
        dsl: {
          components: {},
          history: [],
          graph: {
            nodes: [beginNode],
            edges: [],
          },
          messages: [],
          reference: [],
          globals: {},
          retrieval: [],
        },
      })

      console.log('✅ 创建成功:', result)
      if (result) {
        toast.success(`${canvasType === 'agent' ? '智能体' : 'Pipeline'}创建成功`)
        refetch()
      }
    } catch (error) {
      console.error('Create agent error:', error)
      toast.error('创建失败')
    }
  }

  // 导入JSON
  const handleImportJSON = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        if (!data.title || !data.dsl) {
          toast.error('JSON格式不正确')
          return
        }

        const result = await agentAPI.setAgent(data)
        if (result) {
          toast.success('导入成功')
          refetch()
        }
      } catch (error) {
        console.error('Import error:', error)
        toast.error('导入失败')
      }
    }
    input.click()
  }

  // 删除Agent
  const handleDeleteAgent = async (id: string) => {
    if (window.confirm('确定要删除这个智能体吗？此操作不可恢复。')) {
      try {
        await agentAPI.deleteAgent(id)
        toast.success('删除成功')
        refetch()
      } catch (error) {
        console.error('Delete agent error:', error)
        toast.error('删除失败')
      }
    }
  }

  // 重命名Agent
  const handleRenameAgent = (id: string, currentName: string) => {
    // TODO: 实现重命名对话框
    console.log('重命名:', id, currentName)
    toast.info('重命名功能开发中')
  }

  // 复制Agent
  const handleDuplicateAgent = (id: string) => {
    // TODO: 实现复制功能
    console.log('复制:', id)
    toast.info('复制功能开发中')
  }

  // 如果显示模版页面，则渲染模版页面
  if (showTemplates) {
    return (
      <TemplatesPage
        onBack={() => setShowTemplates(false)}
        onTemplateSelected={() => {
          setShowTemplates(false)
          refetch()
        }}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 */}
      <div className="px-8 py-6 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Workflow className="w-6 h-6 text-white" />
              </div>
              智能体
            </h1>
            <p className="text-muted-foreground mt-2">
              创建和管理你的AI工作流智能体
            </p>
          </div>

          {/* 创建按钮组 */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" className="gap-2 shadow-lg">
                  <Plus className="w-5 h-5" />
                  创建智能体
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
                  <Workflow className="w-4 h-4 mr-2" />
                  <div>
                    <div className="font-medium">从空白创建</div>
                    <div className="text-xs text-muted-foreground">快速搭建工作流</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowTemplates(true)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  <div>
                    <div className="font-medium">从模版创建</div>
                    <div className="text-xs text-muted-foreground">选择预设模版</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportJSON}>
                  <FileJson className="w-4 h-4 mr-2" />
                  <div>
                    <div className="font-medium">导入JSON</div>
                    <div className="text-xs text-muted-foreground">从文件导入</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 搜索和过滤 */}
        <div className="flex items-center gap-4">
          {/* 搜索框 */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索智能体..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 类型过滤 */}
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="agent">智能体流程</SelectItem>
              <SelectItem value="pipeline">Pipeline</SelectItem>
            </SelectContent>
          </Select>

          {/* 统计 */}
          <div className="text-sm text-muted-foreground">
            共 <span className="font-semibold text-foreground">{filteredAgents.length}</span> 个
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-sm text-muted-foreground">加载中...</div>
            </div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
              <Workflow className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchKeyword || filterType !== 'all' ? '没有找到智能体' : '还没有智能体'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchKeyword || filterType !== 'all'
                ? '尝试调整搜索条件或过滤器'
                : '创建你的第一个智能体工作流'}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              创建智能体
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onDelete={handleDeleteAgent}
                onRename={handleRenameAgent}
                onDuplicate={handleDuplicateAgent}
              />
            ))}
          </div>
        )}
      </div>

      {/* 创建对话框 */}
      <CreateAgentDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateFromDialog}
      />
    </div>
  )
}
