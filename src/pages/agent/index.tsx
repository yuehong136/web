import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { 
  Plus, 
  Workflow, 
  FileJson, 
  Sparkles, 
  Search, 
  Grid3X3,
  List as ListIcon,
  Clock,
  Zap,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Settings,
  Trash2,
  Layers,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react'
import { agentAPI } from '@/api/agent'
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants'
import { humanId } from 'human-id'
import { Operator, initialBeginValues } from './constant'
import { Position } from '@xyflow/react'
import { CreateAgentDialog } from './components/CreateAgentDialog'
import { TemplatesPage } from './components/TemplatesPage'
import { AgentCard } from './components/AgentCard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FilterPopover, type FilterConfig, type FilterValue } from '@/components/ui/filter-popover'
import { CustomSelect } from '@/components/ui/custom-select'
import { PageSizeSelector } from '@/components/ui/page-size-selector'
import { ViewToggle } from '@/components/ui/view-toggle'
import { toast } from '@/lib/toast'
import { cn, formatTimestampDetailed, formatTimestampCompact, formatRelativeTime } from '@/lib/utils'
import type { IFlow } from './types'

// 统计卡片组件 - 使用语义化设计令牌，带彩色阴影和渐变效果
interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color: 'info' | 'success' | 'warning' | 'purple'
}

// 颜色映射到设计令牌 - 使用 components-stats-card-* 令牌
const colorTokens = {
  info: {
    gradient: 'var(--color-components-stats-card-blue-bg)',
    iconBg: 'var(--color-components-stats-card-blue-icon-bg)',
    iconText: 'var(--color-components-stats-card-blue-icon-text)',
    shadow: 'var(--color-components-stats-card-blue-shadow)',
    borderHover: 'var(--color-components-stats-card-blue-border-hover)',
  },
  success: {
    gradient: 'var(--color-components-stats-card-green-bg)',
    iconBg: 'var(--color-components-stats-card-green-icon-bg)',
    iconText: 'var(--color-components-stats-card-green-icon-text)',
    shadow: 'var(--color-components-stats-card-green-shadow)',
    borderHover: 'var(--color-components-stats-card-green-border-hover)',
  },
  warning: {
    gradient: 'var(--color-components-stats-card-orange-bg)',
    iconBg: 'var(--color-components-stats-card-orange-icon-bg)',
    iconText: 'var(--color-components-stats-card-orange-icon-text)',
    shadow: 'var(--color-components-stats-card-orange-shadow)',
    borderHover: 'var(--color-components-stats-card-orange-border-hover)',
  },
  purple: {
    gradient: 'var(--color-components-stats-card-purple-bg)',
    iconBg: 'var(--color-components-stats-card-purple-icon-bg)',
    iconText: 'var(--color-components-stats-card-purple-icon-text)',
    shadow: 'var(--color-components-stats-card-purple-shadow)',
    borderHover: 'var(--color-components-stats-card-purple-border-hover)',
  },
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color }) => {
  const tokens = colorTokens[color]
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 transition-all duration-300',
        'hover:-translate-y-1',
        'border'
      )}
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: isHovered ? tokens.borderHover : 'var(--color-components-card-border)',
        boxShadow: isHovered ? tokens.shadow : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 背景渐变装饰 - 使用设计令牌中的渐变 */}
      <div
        className={cn(
          'absolute -right-4 -top-4 w-28 h-28 rounded-full blur-2xl transition-all duration-300',
          isHovered ? 'opacity-80 scale-110' : 'opacity-50'
        )}
        style={{ background: tokens.gradient }}
      />
      
      <div className="relative flex items-center gap-4">
        {/* 图标 - 使用渐变背景令牌 */}
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300',
            isHovered && 'scale-110'
          )}
          style={{ background: tokens.iconBg }}
        >
          <Icon className="h-6 w-6" style={{ color: tokens.iconText }} />
        </div>

        {/* 文本 */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {title}
          </p>
          <p
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </div>
  )
}

// 列表视图行组件
interface AgentListRowProps {
  agent: IFlow
  onDelete: (id: string) => void
  timeFormat: 'detailed' | 'compact' | 'relative'
}

const AgentListRow: React.FC<AgentListRowProps> = ({ agent, onDelete, timeFormat }) => {
  const navigate = useNavigate()
  
  // 处理多语言标题
  const title = typeof agent.title === 'object'
    ? (agent.title.zh || agent.title.en || '未命名')
    : (agent.title || '未命名')

  // 处理多语言描述
  const description = typeof agent.description === 'object'
    ? (agent.description.zh || agent.description.en)
    : agent.description

  // 判断类型
  const isPlugin = agent.canvas_type === 'pipeline' || agent.canvas_category === 'Ingestion'

  // 获取节点数量
  const nodeCount = agent.dsl?.graph?.nodes?.length || 0

  // 格式化时间
  const formatTime = (timestamp: number) => {
    switch (timeFormat) {
      case 'detailed':
        return formatTimestampDetailed(timestamp)
      case 'compact':
        return formatTimestampCompact(timestamp)
      case 'relative':
        return formatRelativeTime(timestamp)
      default:
        return formatTimestampDetailed(timestamp)
    }
  }

  const handleClick = () => {
    navigate(`/agent/${agent.id}`)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(agent.id)
  }

  return (
    <div
      className={cn(
        'group relative grid grid-cols-[2fr_100px_100px_150px_60px] items-center gap-4',
        'px-5 h-[72px] rounded-xl cursor-pointer',
        'border-2 border-transparent',
        'transition-all duration-200 ease-out',
        'hover:bg-surface-secondary/80 hover:border-border-default hover:shadow-md'
      )}
      onClick={handleClick}
    >
      {/* 名称列 */}
      <div className="flex items-center gap-4 min-w-0">
        <Avatar className="h-10 w-10 shrink-0 transition-transform duration-200 group-hover:scale-105">
          <AvatarImage src={agent.avatar || undefined} alt={title} />
          <AvatarFallback 
            className={cn(
              isPlugin
                ? 'bg-[var(--color-state-success-subtle)]'
                : 'bg-[var(--color-state-info-subtle)]'
            )}
          >
            <Workflow 
              className="h-5 w-5" 
              style={{ 
                color: isPlugin 
                  ? 'var(--color-state-success)' 
                  : 'var(--color-state-info)' 
              }} 
            />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0 h-11 flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <h3 
              className="font-medium text-text-primary truncate group-hover:text-text-accent transition-colors duration-200"
              title={title}
            >
              {title}
            </h3>
            <ChevronRightIcon className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
          </div>
          {description && (
            <p 
              className="text-sm text-text-tertiary truncate mt-0.5"
              title={description}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* 类型列 */}
      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        <Workflow className="h-3.5 w-3.5" />
        <span>{isPlugin ? 'Pipeline' : '智能体'}</span>
      </div>

      {/* 节点数列 */}
      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        <Layers className="h-3.5 w-3.5" />
        <span>{nodeCount} 节点</span>
      </div>

      {/* 更新时间列 */}
      <div className="text-sm text-text-tertiary">
        {formatTime(agent.update_time)}
      </div>

      {/* 操作列 */}
      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        <Dropdown
          trigger={
            <Button 
              variant="ghost" 
              size="icon-sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          }
        >
          <DropdownItem
            icon={<Settings className="h-4 w-4" />}
            onClick={() => navigate(`/agent/${agent.id}`)}
          >
            编辑
          </DropdownItem>
          <DropdownItem
            icon={<Trash2 className="h-4 w-4" />}
            onClick={handleDelete}
            danger
          >
            删除
          </DropdownItem>
        </Dropdown>
      </div>
    </div>
  )
}

export default function AgentListPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [timeFormat, setTimeFormat] = useState<'detailed' | 'compact' | 'relative'>('detailed')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [filterValue, setFilterValue] = useState<FilterValue>({ type: [] })

  // 获取Agent列表
  const { data: agentsData, isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEYS.AGENTS],
    queryFn: async () => {
      const result = await agentAPI.listAgents()
      return result
    },
  })

  const agents = agentsData?.canvas || []

  // 筛选器配置
  const filterConfigs: FilterConfig[] = [
    {
      key: 'type',
      label: '类型',
      options: [
        { value: 'agent', label: '智能体流程' },
        { value: 'pipeline', label: 'Pipeline' },
      ],
    },
  ]

  // 过滤和搜索
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // 类型过滤
      const selectedTypes = filterValue.type || []
      if (selectedTypes.length > 0) {
        const isPlugin = agent.canvas_type === 'pipeline' || agent.canvas_category === 'Ingestion'
        const agentType = isPlugin ? 'pipeline' : 'agent'
        if (!selectedTypes.includes(agentType)) return false
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
  }, [agents, filterValue, searchKeyword])

  // 统计数据
  const stats = useMemo(() => {
    const agentCount = agents.filter(a => a.canvas_type !== 'pipeline' && a.canvas_category !== 'Ingestion').length
    const pipelineCount = agents.filter(a => a.canvas_type === 'pipeline' || a.canvas_category === 'Ingestion').length
    
    // 计算最近7天活跃的智能体（有更新的）
    const sevenDaysAgo = Date.now() / 1000 - 7 * 24 * 60 * 60
    const activeCount = agents.filter(a => a.update_time > sevenDaysAgo).length
    
    return {
      total: agents.length,
      agentCount,
      pipelineCount,
      activeCount,
    }
  }, [agents])

  // 分页计算
  const totalPages = Math.ceil(filteredAgents.length / pageSize)
  const paginatedAgents = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredAgents.slice(start, start + pageSize)
  }, [filteredAgents, currentPage, pageSize])

  // 页码变化时重置到第一页
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchKeyword, filterValue, pageSize])

  // 从对话框创建Agent
  const handleCreateFromDialog = async (title: string, canvasType: 'agent' | 'pipeline') => {
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
    console.log('重命名:', id, currentName)
    toast.info('重命名功能开发中')
  }

  // 复制Agent
  const handleDuplicateAgent = (id: string) => {
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
    <div className="h-full flex flex-col p-6">
      {/* 页面头部 - 标题 + 创建按钮 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">智能体管理</h1>
          <p className="text-sm text-text-secondary mt-1">
            创建和管理您的 AI 工作流智能体
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建智能体
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
              <Workflow className="w-4 h-4 mr-2" />
              <div>
                <div className="font-medium">从空白创建</div>
                <div className="text-xs text-text-tertiary">快速搭建工作流</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowTemplates(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              <div>
                <div className="font-medium">从模版创建</div>
                <div className="text-xs text-text-tertiary">选择预设模版</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImportJSON}>
              <FileJson className="w-4 h-4 mr-2" />
              <div>
                <div className="font-medium">导入JSON</div>
                <div className="text-xs text-text-tertiary">从文件导入</div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 统计卡片 */}
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="智能体总数"
            value={stats.total}
            icon={Workflow}
            color="info"
          />
          <StatsCard
            title="智能体流程"
            value={stats.agentCount}
            icon={Zap}
            color="success"
          />
          <StatsCard
            title="Pipeline"
            value={stats.pipelineCount}
            icon={Workflow}
            color="info"
          />
          <StatsCard
            title="最近活跃"
            value={stats.activeCount}
            icon={Clock}
            color="warning"
          />
        </div>
      </div>

      {/* 搜索和筛选工具栏 */}
      <div className="flex items-center space-x-4 mb-4">
        {/* 左侧：搜索框 */}
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder="搜索智能体..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        
        {/* 右侧：筛选 + 时间格式 + 视图切换 */}
        <div className="flex items-center space-x-2">
          {/* 筛选按钮 */}
          <FilterPopover
            filters={filterConfigs}
            value={filterValue}
            onChange={setFilterValue}
          />
          
          {/* 时间格式选择器 */}
          <CustomSelect
            options={[
              { value: 'detailed', label: '详细时间' },
              { value: 'compact', label: '简洁时间' },
              { value: 'relative', label: '相对时间' }
            ]}
            value={timeFormat}
            onChange={(value) => setTimeFormat(value as 'detailed' | 'compact' | 'relative')}
            size="sm"
            className="min-w-[100px]"
          />
          
          {/* 视图切换 */}
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            size="md"
            options={[
              { value: 'grid', icon: <Grid3X3 />, label: '网格视图' },
              { value: 'list', icon: <ListIcon />, label: '列表视图' },
            ]}
          />
        </div>
      </div>

      {/* 内容区域 */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loading variant="spinner" size="lg" />
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Workflow className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {searchKeyword || filterValue.type?.length ? '未找到匹配的智能体' : '还没有智能体'}
            </h3>
            <p className="mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
              {searchKeyword || filterValue.type?.length
                ? '尝试调整搜索条件或筛选器'
                : '创建您的第一个智能体工作流开始使用'}
            </p>
            {!searchKeyword && !filterValue.type?.length && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                创建智能体
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 可滚动内容区域 - pt-1 pb-2 为悬停效果留出空间 */}
          <div className="flex-1 overflow-y-auto pt-1 pb-2 -mx-1 px-1">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onDelete={handleDeleteAgent}
                    onRename={handleRenameAgent}
                    onDuplicate={handleDuplicateAgent}
                    timeFormat={timeFormat}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-surface-primary rounded-lg border border-border-default overflow-hidden">
                {/* 表头 */}
                <div className="grid grid-cols-[2fr_100px_100px_150px_60px] items-center gap-4 px-5 h-12 border-b border-border-default bg-surface-secondary/50">
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    名称
                  </div>
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    类型
                  </div>
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    节点数
                  </div>
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    更新时间
                  </div>
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
                    操作
                  </div>
                </div>
                {/* 列表内容 */}
                <div className="divide-y divide-border-subtle">
                  {paginatedAgents.map((agent) => (
                    <AgentListRow
                      key={agent.id}
                      agent={agent}
                      onDelete={handleDeleteAgent}
                      timeFormat={timeFormat}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 分页控件 - 固定在底部 */}
          {totalPages > 0 && (
            <div className="mt-4 rounded-lg border shadow-sm" style={{
              borderColor: 'var(--color-components-card-border)',
              backgroundColor: 'var(--color-components-card-bg)'
            }}>
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="text-sm" style={{ color: 'var(--color-components-pagination-text)' }}>
                  共 {filteredAgents.length} 项
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* 每页显示选择器 */}
                  <PageSizeSelector
                    pageSize={pageSize}
                    onChange={(size) => setPageSize(size)}
                    options={[6, 12, 24, 48]}
                  />
                  
                  {/* 页码导航 */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.max(1, Math.min(7, totalPages)) }, (_, i) => {
                        let pageNum = i + 1
                        
                        if (totalPages > 7) {
                          if (currentPage <= 4) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 3) {
                            pageNum = totalPages - 6 + i
                          } else {
                            pageNum = currentPage - 3 + i
                          }
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="min-w-[40px]"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 创建对话框 */}
      <CreateAgentDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateFromDialog}
      />
    </div>
  )
}
