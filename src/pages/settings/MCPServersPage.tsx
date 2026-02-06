/**
 * MCP 服务器管理页面 - 参考知识库页面布局
 * 网格/列表视图切换，现代化视觉设计
 */

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  RefreshCw,
  Globe,
  Filter,
  Grid3X3,
  List as ListIcon,
  MoreHorizontal,
  TestTube,
  Edit,
  Trash2,
  Copy,
  Loader2,
  Zap,
  Check,
  Rocket,
  ChevronRight,
  Clock,
} from 'lucide-react'
import {
  ResourceListContainer,
  ResourceListHeader,
  ResourceListBody,
} from '@/components/ui/resource-list'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { ViewToggle } from '@/components/ui/view-toggle'
import type { MCPServer } from '@/types/mcp'
import { MCPServerForm } from '@/components/mcp/MCPServerForm'
import { MCPStatsCards } from '@/components/mcp/MCPStatsCards'
import { MCPServerCard } from '@/components/mcp/MCPServerCard'
import {
  useFetchMCPServers,
  useDeleteMCPServer,
  useTestMCPConnection,
  useMCPStats,
  getServerTools,
  hasServerTools,
} from '@/hooks/use-mcp-request'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

interface ServerListPageProps {
  onServerSelect?: (serverId: string) => void
}

// 服务器类型选项
const SERVER_TYPE_OPTIONS = [
  { value: 'all', label: '全部类型' },
  { value: 'streamable-http', label: 'Streamable HTTP' },
  { value: 'sse', label: 'SSE' },
]

// 服务器类型配置
const SERVER_TYPE_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  'streamable-http': {
    label: 'HTTP',
    bgColor: 'var(--color-state-info-subtle)',
    textColor: 'var(--color-state-info)',
  },
  sse: {
    label: 'SSE',
    bgColor: 'var(--color-state-success-subtle)',
    textColor: 'var(--color-state-success)',
  },
}

export const MCPServersPage: React.FC<ServerListPageProps> = ({ onServerSelect }) => {
  const navigate = useNavigate()
  
  // 视图和筛选状态
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  // 弹窗状态
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null)

  // 测试连接和复制状态
  const [testingServerId, setTestingServerId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 数据获取（直接使用列表接口，不额外调用 list_tools）
  const {
    data: serversData,
    isLoading,
    refetch,
    isFetching,
  } = useFetchMCPServers({
    keywords: searchKeyword || undefined,
    page: 1,
    page_size: 100,
  })

  // 统计数据（基于列表数据计算）
  const stats = useMCPStats()

  const servers = serversData?.mcp_servers || []

  // Mutations
  const deleteMutation = useDeleteMCPServer()
  const testConnectionMutation = useTestMCPConnection()

  // 筛选服务器
  const filteredServers = useMemo(() => {
    let result = servers

    if (typeFilter !== 'all') {
      result = result.filter((s) => s.server_type === typeFilter)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.url.toLowerCase().includes(term) ||
          s.description?.toLowerCase().includes(term)
      )
    }

    return result
  }, [servers, typeFilter, searchTerm])

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setSearchKeyword(value)
  }

  // 处理刷新
  const handleRefresh = () => {
    refetch()
  }

  // 处理删除
  const handleDelete = async (server: MCPServer) => {
    if (confirm(`确定要删除服务器 "${server.name}" 吗？此操作不可撤销。`)) {
      try {
        await deleteMutation.mutateAsync([server.id])
      } catch (error) {
        // 错误已在 hook 中处理
      }
    }
  }

  // 处理测试连接
  const handleTestConnection = async (server: MCPServer) => {
    setTestingServerId(server.id)
    try {
      const tools = await testConnectionMutation.mutateAsync({
        url: server.url,
        server_type: server.server_type,
        timeout: 10,
        headers: server.headers,
        variables: server.variables,
      })
      toast.success(`连接成功！发现 ${tools.length} 个可用工具`)
      // 测试成功后刷新列表以更新工具缓存
      refetch()
    } catch (error) {
      // 错误已在 hook 中处理
    } finally {
      setTestingServerId(null)
    }
  }

  // 处理编辑
  const handleEdit = (server: MCPServer) => {
    setSelectedServer(server)
    setShowEditDialog(true)
  }

  // 处理查看详情
  const handleViewDetail = (server: MCPServer) => {
    onServerSelect?.(server.id)
  }

  // 复制 URL
  const handleCopyUrl = async (server: MCPServer) => {
    try {
      await navigator.clipboard.writeText(server.url)
      setCopiedId(server.id)
      toast.success('已复制服务器地址')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error('复制失败')
    }
  }

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  // 渲染列表视图（使用 ResourceList 组件统一风格）
  const renderTableView = () => (
    <ResourceListContainer>
      <ResourceListHeader
        columns={[
          { key: 'name', label: '名称' },
          { key: 'type', label: '类型' },
          { key: 'url', label: '地址' },
          { key: 'tools', label: '工具数' },
          { key: 'create_time', label: '创建时间' },
          { key: 'actions', label: '操作' },
        ]}
        showSelect={false}
        gridCols="grid-cols-[2fr_80px_1fr_80px_120px_60px]"
      />
      <ResourceListBody>
        {filteredServers.map((server) => {
          const online = hasServerTools(server)
          const tools = getServerTools(server)
          const typeConfig = SERVER_TYPE_CONFIG[server.server_type] || {
            label: server.server_type.toUpperCase(),
            bgColor: 'var(--color-background-subtle)',
            textColor: 'var(--color-text-secondary)',
          }

          return (
            <div
              key={server.id}
              className={cn(
                'group relative grid items-center gap-4',
                'px-4 h-[68px] rounded-xl cursor-pointer',
                'border border-transparent',
                'transition-all duration-200 ease-out',
                'hover:bg-surface-secondary/60 hover:border-state-focus hover:shadow-sm',
              )}
              style={{ gridTemplateColumns: '2fr 80px 1fr 80px 120px 60px' }}
              onClick={() => onServerSelect?.(server.id)}
            >
              {/* 名称列（含状态指示器） */}
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative',
                    online ? 'bg-state-success-subtle' : 'bg-surface-secondary',
                  )}
                >
                  <Globe className={cn('h-5 w-5', online ? 'text-state-success' : 'text-text-disabled')} />
                </div>
                <div className="flex-1 min-w-0 h-11 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-medium text-text-primary truncate group-hover:text-text-accent transition-colors duration-200">
                      {server.name}
                    </h3>
                    <ChevronRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                  </div>
                  {server.description && (
                    <p className="text-sm text-text-tertiary truncate mt-0.5" title={server.description}>
                      {server.description}
                    </p>
                  )}
                </div>
              </div>

              {/* 类型列 */}
              <div className="flex items-center">
                <Badge
                  className="text-xs font-medium border-0"
                  style={{ backgroundColor: typeConfig.bgColor, color: typeConfig.textColor }}
                >
                  {typeConfig.label}
                </Badge>
              </div>

              {/* 地址列 */}
              <code
                className="text-xs font-mono text-text-secondary truncate block"
                title={server.url}
              >
                {server.url}
              </code>

              {/* 工具数列 */}
              <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                <Zap className="h-3.5 w-3.5 text-state-focus shrink-0" />
                <span>{tools.length}</span>
              </div>

              {/* 创建时间列 */}
              <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {formatDate(server.create_time)}
              </div>

              {/* 操作列 */}
              <div
                className="flex justify-end"
                onClick={(e) => e.stopPropagation()}
              >
                <Dropdown
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                >
                  <DropdownItem
                    icon={
                      testingServerId === server.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <TestTube className="h-4 w-4" />
                    }
                    onClick={() => handleTestConnection(server)}
                  >
                    {testingServerId === server.id ? '测试中...' : '测试连接'}
                  </DropdownItem>
                  <DropdownItem
                    icon={
                      copiedId === server.id
                        ? <Check className="h-4 w-4 text-state-success" />
                        : <Copy className="h-4 w-4" />
                    }
                    onClick={() => handleCopyUrl(server)}
                  >
                    复制地址
                  </DropdownItem>
                  <DropdownItem
                    icon={<Edit className="h-4 w-4" />}
                    onClick={() => handleEdit(server)}
                  >
                    编辑配置
                  </DropdownItem>
                  <DropdownItem
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => handleDelete(server)}
                    danger
                  >
                    删除服务器
                  </DropdownItem>
                </Dropdown>
              </div>
            </div>
          )
        })}
      </ResourceListBody>
    </ResourceListContainer>
  )

  // 渲染网格视图
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filteredServers.map((server) => (
        <MCPServerCard
          key={server.id}
          server={server}
          tools={getServerTools(server)}
          isLoadingTools={false}
          isOnline={hasServerTools(server)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTestConnection={handleTestConnection}
          onViewDetail={onServerSelect ? handleViewDetail : undefined}
          isTesting={testingServerId === server.id}
        />
      ))}
    </div>
  )

  return (
    <div className="space-y-4 p-1">
      {/* 页面头部 - 参考知识库页面布局 */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            MCP 管理
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            管理您的 MCP 服务器，配置检索参数
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建服务器
        </Button>
      </div>

      {/* 统计卡片 */}
      <MCPStatsCards
        totalServers={stats.totalServers}
        activeServers={stats.activeServers}
        totalTools={stats.totalTools}
        serverTypes={stats.serverTypes}
        isLoading={stats.isLoading}
      />

      {/* MCP 实验场入口海报 */}
      <div
        onClick={() => navigate('/mcp-chat')}
        className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border p-5"
        style={{
          background: 'linear-gradient(135deg, var(--color-state-focus-subtle) 0%, var(--color-components-card-bg) 100%)',
          borderColor: 'var(--color-state-focus-subtle)',
        }}
      >
        {/* 左侧紫色竖条 */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: 'var(--color-state-focus)' }}
        />
        
        <div className="flex items-center justify-between">
          {/* 左侧内容 */}
          <div className="flex items-center gap-4">
            {/* New 标签 */}
            <span 
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{ 
                backgroundColor: 'var(--color-state-focus)',
                color: 'white'
              }}
            >
              New
            </span>
            
            {/* 标题和描述 */}
            <div>
              <h3 
                className="text-lg font-semibold"
                style={{ color: 'var(--color-state-focus)' }}
              >
                MCP 实验场
              </h3>
              <p 
                className="text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                探索模型与 MCP Server 的自由组合和碰撞
              </p>
            </div>
          </div>
          
          {/* 右侧火箭图标 */}
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--color-components-card-bg)' }}
          >
            <Rocket 
              className="w-7 h-7" 
              style={{ color: 'var(--color-state-focus)' }}
            />
          </div>
        </div>
      </div>

      {/* 搜索和筛选栏 - 参考知识库页面布局 */}
      <div className="flex items-center space-x-4">
        {/* 搜索框 */}
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder="搜索服务器..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* 筛选和视图切换 */}
        <div className="flex items-center space-x-2">
          {/* 类型筛选 */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger
              className="w-auto min-w-[120px] h-9"
              style={{
                backgroundColor: typeFilter !== 'all' ? 'var(--color-state-info-subtle)' : undefined,
                borderColor: typeFilter !== 'all' ? 'var(--color-state-info)' : undefined,
                color: typeFilter !== 'all' ? 'var(--color-state-info)' : undefined,
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="筛选类型" />
            </SelectTrigger>
            <SelectContent className="min-w-[180px]">
              {SERVER_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 刷新按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="h-9"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>

          {/* 视图切换 */}
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            size="md"
            options={[
              { value: 'grid', icon: <Grid3X3 />, label: '网格视图' },
              { value: 'table', icon: <ListIcon />, label: '表格视图' },
            ]}
          />
        </div>
      </div>

      {/* 内容区域 */}
      {isLoading ? (
        // 加载骨架屏
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border p-5 animate-pulse"
              style={{
                backgroundColor: 'var(--color-components-card-bg)',
                borderColor: 'var(--color-components-card-border)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-background-subtle)' }}
                />
                <div
                  className="h-4 w-12 rounded"
                  style={{ backgroundColor: 'var(--color-background-subtle)' }}
                />
              </div>
              <div
                className="h-6 w-32 rounded mb-2"
                style={{ backgroundColor: 'var(--color-background-subtle)' }}
              />
              <div
                className="h-5 w-16 rounded mb-3"
                style={{ backgroundColor: 'var(--color-background-subtle)' }}
              />
              <div
                className="h-10 w-full rounded-lg mb-4"
                style={{ backgroundColor: 'var(--color-background-subtle)' }}
              />
              <div
                className="h-16 w-full rounded-lg"
                style={{ backgroundColor: 'var(--color-background-subtle)' }}
              />
            </div>
          ))}
        </div>
      ) : filteredServers.length === 0 ? (
        // 空状态
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl border"
          style={{
            backgroundColor: 'var(--color-components-card-bg)',
            borderColor: 'var(--color-components-card-border)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-background-subtle)' }}
          >
            <Globe className="h-8 w-8" style={{ color: 'var(--color-text-disabled)' }} />
          </div>
          <h3
            className="text-lg font-medium mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {searchTerm || typeFilter !== 'all' ? '未找到匹配的服务器' : '还没有MCP服务器'}
          </h3>
          <p
            className="text-sm mb-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {searchTerm || typeFilter !== 'all'
              ? '尝试调整搜索条件或筛选器'
              : '创建您的第一个MCP服务器开始使用'}
          </p>
          {!searchTerm && typeFilter === 'all' && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建服务器
            </Button>
          )}
        </div>
      ) : (
        // 根据视图模式渲染
        viewMode === 'grid' ? renderGridView() : renderTableView()
      )}

      {/* 创建服务器对话框 */}
      {showCreateDialog && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent size="xl" showCloseButton={false} className="p-0 overflow-hidden">
            <MCPServerForm
              onSuccess={() => {
                setShowCreateDialog(false)
                refetch()
              }}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* 编辑服务器对话框 */}
      {showEditDialog && selectedServer && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent size="xl" showCloseButton={false} className="p-0 overflow-hidden">
            <MCPServerForm
              server={selectedServer}
              onSuccess={() => {
                setShowEditDialog(false)
                setSelectedServer(null)
                refetch()
              }}
              onCancel={() => {
                setShowEditDialog(false)
                setSelectedServer(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
