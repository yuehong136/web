/**
 * MCP 服务器管理页面 - 参考知识库页面布局
 * 网格/列表视图切换，现代化视觉设计
 */

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  ArrowUpDown,
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

const SERVER_TYPE_OPTIONS = [
  { value: 'all', labelKey: 'mcp.servers.allTypes', label: '全部类型' },
  { value: 'streamable-http', label: 'Streamable HTTP' },
  { value: 'sse', label: 'SSE' },
]

// 服务器类型配置
const SERVER_TYPE_CONFIG: Record<
  string,
  { label: string; bgColor: string; textColor: string }
> = {
  'streamable-http': {
    label: 'HTTP',
    bgColor: 'var(--color-status-info-subtle)',
    textColor: 'var(--color-status-info)',
  },
  sse: {
    label: 'SSE',
    bgColor: 'var(--color-status-success-subtle)',
    textColor: 'var(--color-status-success)',
  },
}

export const MCPServersPage: React.FC<ServerListPageProps> = ({
  onServerSelect,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // 视图和筛选状态
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortDesc, setSortDesc] = useState(true)

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

  // eslint-disable-next-line react-hooks/exhaustive-deps -- mcp_servers 的 || [] fallback 在下方 useMemo 里重新计算，引用差异可忽略
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
          s.description?.toLowerCase().includes(term),
      )
    }

    return result
  }, [servers, typeFilter, searchTerm])

  const sortedServers = useMemo(() => {
    const parseSortTime = (server: MCPServer) => {
      const raw = server.update_time || server.create_time
      if (!raw) return 0
      const asNum = Number(raw)
      if (!Number.isNaN(asNum) && asNum > 0) {
        return asNum < 1_000_000_000_000 ? asNum * 1000 : asNum
      }
      const parsed = new Date(raw).getTime()
      return Number.isNaN(parsed) ? 0 : parsed
    }

    return [...filteredServers].sort((a, b) =>
      sortDesc
        ? parseSortTime(b) - parseSortTime(a)
        : parseSortTime(a) - parseSortTime(b),
    )
  }, [filteredServers, sortDesc])

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
    if (
      confirm(
        t(
          'mcp.servers.deleteConfirm',
          '确定要删除服务器 "{{name}}" 吗？此操作不可撤销。',
          { name: server.name },
        ),
      )
    ) {
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
      toast.success(
        t('mcp.servers.testSuccess', '连接成功！发现 {{count}} 个可用工具', {
          count: tools.length,
        }),
      )
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
      toast.success(t('mcp.servers.copySuccess', '已复制服务器地址'))
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error(t('mcp.servers.copyFailed', '复制失败'))
    }
  }

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  // 渲染列表视图（使用 ResourceList 组件统一风格）
  const renderTableView = () => (
    <ResourceListContainer>
      <ResourceListHeader
        columns={[
          { key: 'name', label: t('mcp.servers.columns.name', '名称') },
          { key: 'type', label: t('mcp.servers.columns.type', '类型') },
          { key: 'url', label: t('mcp.servers.columns.url', '地址') },
          { key: 'tools', label: t('mcp.servers.columns.tools', '工具数') },
          {
            key: 'create_time',
            label: t('mcp.servers.columns.createdAt', '创建时间'),
          },
          { key: 'actions', label: t('mcp.servers.columns.actions', '操作') },
        ]}
        showSelect={false}
        gridCols="grid-cols-[2fr_80px_1fr_80px_120px_60px]"
      />
      <ResourceListBody>
        {sortedServers.map((server) => {
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
                'h-[68px] cursor-pointer rounded-xl px-4',
                'border border-transparent',
                'transition-all duration-200 ease-out',
                'hover:bg-surface-secondary/60 hover:border-state-focus hover:shadow-sm',
              )}
              style={{ gridTemplateColumns: '2fr 80px 1fr 80px 120px 60px' }}
              onClick={() => onServerSelect?.(server.id)}
            >
              {/* 名称列（含状态指示器） */}
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className={cn(
                    'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    online
                      ? 'bg-status-success-subtle'
                      : 'bg-surface-secondary',
                  )}
                >
                  <Globe
                    className={cn(
                      'h-5 w-5',
                      online ? 'text-status-success' : 'text-text-disabled',
                    )}
                  />
                </div>
                <div className="flex h-11 min-w-0 flex-1 flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate font-medium text-text-primary transition-colors duration-200 group-hover:text-text-accent">
                      {server.name}
                    </h3>
                    <ChevronRight className="h-4 w-4 shrink-0 text-text-tertiary opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </div>
                  {server.description && (
                    <p
                      className="mt-0.5 truncate text-sm text-text-tertiary"
                      title={server.description}
                    >
                      {server.description}
                    </p>
                  )}
                </div>
              </div>

              {/* 类型列 */}
              <div className="flex items-center">
                <Badge
                  className="border-0 text-xs font-medium"
                  style={{
                    backgroundColor: typeConfig.bgColor,
                    color: typeConfig.textColor,
                  }}
                >
                  {typeConfig.label}
                </Badge>
              </div>

              {/* 地址列 */}
              <code
                className="block truncate font-mono text-xs text-text-secondary"
                title={server.url}
              >
                {server.url}
              </code>

              {/* 工具数列 */}
              <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                <Zap className="h-3.5 w-3.5 shrink-0 text-state-focus" />
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
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                >
                  <DropdownItem
                    icon={
                      testingServerId === server.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )
                    }
                    onClick={() => handleTestConnection(server)}
                  >
                    {testingServerId === server.id
                      ? t('mcp.servers.actions.testing', '测试中...')
                      : t('mcp.servers.actions.test', '测试连接')}
                  </DropdownItem>
                  <DropdownItem
                    icon={
                      copiedId === server.id ? (
                        <Check className="h-4 w-4 text-status-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )
                    }
                    onClick={() => handleCopyUrl(server)}
                  >
                    {t('mcp.servers.actions.copy', '复制地址')}
                  </DropdownItem>
                  <DropdownItem
                    icon={<Edit className="h-4 w-4" />}
                    onClick={() => handleEdit(server)}
                  >
                    {t('mcp.servers.actions.edit', '编辑配置')}
                  </DropdownItem>
                  <DropdownItem
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => handleDelete(server)}
                    danger
                  >
                    {t('mcp.servers.actions.delete', '删除服务器')}
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sortedServers.map((server) => (
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
            {t('mcp.servers.title', 'MCP 管理')}
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {t('mcp.servers.description', '管理您的 MCP 服务器，配置检索参数')}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('mcp.servers.create', '创建服务器')}
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
        className="relative cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        style={{
          background:
            'linear-gradient(135deg, var(--color-state-focus-subtle) 0%, var(--color-components-card-bg) 100%)',
          borderColor: 'var(--color-state-focus-subtle)',
        }}
      >
        {/* 左侧紫色竖条 */}
        <div
          className="absolute bottom-0 left-0 top-0 w-1"
          style={{ backgroundColor: 'var(--color-state-focus)' }}
        />

        <div className="flex items-center justify-between">
          {/* 左侧内容 */}
          <div className="flex items-center gap-4">
            {/* New 标签 */}
            <span
              className="rounded px-2 py-0.5 text-xs font-semibold"
              style={{
                backgroundColor: 'var(--color-state-focus)',
                color: 'white',
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
                {t('mcp.servers.playgroundTitle', 'MCP 实验场')}
              </h3>
              <p
                className="text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {t(
                  'mcp.servers.playgroundDescription',
                  '探索模型与 MCP Server 的自由组合和碰撞',
                )}
              </p>
            </div>
          </div>

          {/* 右侧火箭图标 */}
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'var(--color-components-card-bg)' }}
          >
            <Rocket
              className="h-7 w-7"
              style={{ color: 'var(--color-state-focus)' }}
            />
          </div>
        </div>
      </div>

      {/* 搜索和筛选栏 - 参考知识库页面布局 */}
      <div className="flex items-center space-x-4">
        {/* 搜索框 */}
        <div className="max-w-md flex-1">
          <Input
            type="search"
            placeholder={t('mcp.servers.searchPlaceholder', '搜索服务器...')}
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
              className="h-9 w-auto min-w-[120px]"
              style={{
                backgroundColor:
                  typeFilter !== 'all'
                    ? 'var(--color-status-info-subtle)'
                    : undefined,
                borderColor:
                  typeFilter !== 'all' ? 'var(--color-status-info)' : undefined,
                color:
                  typeFilter !== 'all' ? 'var(--color-status-info)' : undefined,
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue
                placeholder={t('mcp.servers.typePlaceholder', '筛选类型')}
              />
            </SelectTrigger>
            <SelectContent className="min-w-[180px]">
              {SERVER_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.labelKey
                    ? t(option.labelKey, option.label)
                    : option.label}
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
            <RefreshCw
              className={cn('h-4 w-4', isFetching && 'animate-spin')}
            />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDesc((prev) => !prev)}
            className="flex h-9 items-center gap-1 px-2 text-xs"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>
              {sortDesc
                ? t('mcp.servers.descending', '倒序')
                : t('mcp.servers.ascending', '正序')}
            </span>
          </Button>

          {/* 视图切换 */}
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            size="md"
            options={[
              {
                value: 'grid',
                icon: <Grid3X3 />,
                label: t('mcp.servers.gridView', '网格视图'),
              },
              {
                value: 'table',
                icon: <ListIcon />,
                label: t('mcp.servers.tableView', '表格视图'),
              },
            ]}
          />
        </div>
      </div>

      {/* 内容区域 */}
      {isLoading ? (
        // 加载骨架屏
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border p-5"
              style={{
                backgroundColor: 'var(--color-components-card-bg)',
                borderColor: 'var(--color-components-card-border)',
              }}
            >
              <div className="mb-4 flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-background-subtle)' }}
                />
                <div
                  className="h-4 w-12 rounded"
                  style={{ backgroundColor: 'var(--color-background-subtle)' }}
                />
              </div>
              <div
                className="mb-2 h-6 w-32 rounded"
                style={{ backgroundColor: 'var(--color-background-subtle)' }}
              />
              <div
                className="mb-3 h-5 w-16 rounded"
                style={{ backgroundColor: 'var(--color-background-subtle)' }}
              />
              <div
                className="mb-4 h-10 w-full rounded-lg"
                style={{ backgroundColor: 'var(--color-background-subtle)' }}
              />
              <div
                className="h-16 w-full rounded-lg"
                style={{ backgroundColor: 'var(--color-background-subtle)' }}
              />
            </div>
          ))}
        </div>
      ) : sortedServers.length === 0 ? (
        // 空状态
        <div
          className="flex flex-col items-center justify-center rounded-2xl border py-16"
          style={{
            backgroundColor: 'var(--color-components-card-bg)',
            borderColor: 'var(--color-components-card-border)',
          }}
        >
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--color-background-subtle)' }}
          >
            <Globe
              className="h-8 w-8"
              style={{ color: 'var(--color-text-disabled)' }}
            />
          </div>
          <h3
            className="mb-2 text-lg font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {searchTerm || typeFilter !== 'all'
              ? t('mcp.servers.noMatch', '未找到匹配的服务器')
              : t('mcp.servers.empty', '还没有MCP服务器')}
          </h3>
          <p
            className="mb-4 text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {searchTerm || typeFilter !== 'all'
              ? t('mcp.servers.noMatchDescription', '尝试调整搜索条件或筛选器')
              : t(
                  'mcp.servers.emptyDescription',
                  '创建您的第一个MCP服务器开始使用',
                )}
          </p>
          {!searchTerm && typeFilter === 'all' && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('mcp.servers.create', '创建服务器')}
            </Button>
          )}
        </div>
      ) : // 根据视图模式渲染
      viewMode === 'grid' ? (
        renderGridView()
      ) : (
        renderTableView()
      )}

      {/* 创建服务器对话框 */}
      {showCreateDialog && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent
            size="xl"
            showCloseButton={false}
            className="overflow-hidden p-0"
          >
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
          <DialogContent
            size="xl"
            showCloseButton={false}
            className="overflow-hidden p-0"
          >
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
