import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ModalRoot,
  ModalContent,
  ModalTitle,
} from '@/components/ui/modal-primitives'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
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
  Filter,
  Grid3X3,
  List as ListIcon,
  Rocket,
  ArrowUpDown,
} from 'lucide-react'
import { ViewToggle } from '@/components/ui/view-toggle'
import { ListPageTemplate } from '@/components/page-templates'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns'
import { MCPServerSummary } from '@/components/mcp/mcp-server-summary'
import { MCPServerTable } from '@/components/mcp/mcp-server-table'
import type { MCPServer } from '@/types/mcp'
import { MCPServerForm } from '@/components/mcp/MCPServerForm'
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
import { cn, copyToClipboard } from '@/lib/utils'

interface ServerListPageProps {
  onServerSelect?: (serverId: string) => void
}

const SERVER_TYPE_OPTIONS = [
  { value: 'all', labelKey: 'mcp.servers.allTypes', label: '全部类型' },
  { value: 'streamable-http', label: 'Streamable HTTP' },
  { value: 'sse', label: 'SSE' },
]

export const MCPServersPage: React.FC<ServerListPageProps> = ({
  onServerSelect,
}) => {
  const { t } = useTranslation()

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

  const [formReturnFocus, setFormReturnFocus] = useState<HTMLElement | null>(
    null,
  )

  // 测试连接和复制状态
  const [testingServerId, setTestingServerId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{
    server: MCPServer
    returnFocus: HTMLElement | null
  } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 数据获取（直接使用列表接口，不额外调用 list_tools）
  const {
    data: serversData,
    isLoading,
    isError,
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

  const requestDelete = (
    server: MCPServer,
    returnFocus: HTMLButtonElement | null,
  ) => {
    setPendingDelete({ server, returnFocus })
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync([pendingDelete.server.id])
      setPendingDelete(null)
    } catch {
      // The domain mutation owns error feedback; keep the dialog open for retry.
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
  const handleEdit = (
    server: MCPServer,
    returnFocus?: HTMLButtonElement | null,
  ) => {
    setFormReturnFocus(returnFocus ?? null)
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
      await copyToClipboard(server.url)
      setCopiedId(server.id)
      toast.success(t('mcp.servers.copySuccess', '已复制服务器地址'))
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error(t('mcp.servers.copyFailed', '复制失败'))
    }
  }

  const closeServerForm = () => {
    setShowCreateDialog(false)
    setShowEditDialog(false)
    setSelectedServer(null)
  }

  const hasFilters = Boolean(searchTerm || typeFilter !== 'all')
  const createButton = (
    <Button
      onClick={(event) => {
        setFormReturnFocus(event.currentTarget)
        setShowCreateDialog(true)
      }}
    >
      <Plus className="size-icon-sm" />
      {t('mcp.servers.create')}
    </Button>
  )

  return (
    <>
      <ListPageTemplate
        className="@container mx-auto max-w-6xl"
        stats={<MCPServerSummary {...stats} />}
        toolbarLeft={
          <div className="w-full max-w-md">
            <Input
              inputSize="sm"
              className="h-9 rounded-radius-md"
              type="search"
              aria-label={t('mcp.servers.searchPlaceholder')}
              placeholder={t('mcp.servers.searchPlaceholder')}
              value={searchTerm}
              onChange={(event) => handleSearch(event.target.value)}
              leftIcon={<Search className="size-icon-sm" />}
            />
          </div>
        }
        toolbarRight={
          <>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger
                aria-label={t('mcp.servers.typePlaceholder')}
                className="h-9 w-auto min-w-28"
              >
                <Filter className="size-icon-sm" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVER_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.labelKey ? t(option.labelKey) : option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('mcp.servers.refresh')}
              title={t('mcp.servers.refresh')}
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <RefreshCw
                className={cn(
                  'size-icon-sm',
                  isFetching && 'animate-spin motion-reduce:animate-none',
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('mcp.servers.sortUpdated')}
              aria-pressed={sortDesc}
              onClick={() => setSortDesc((previous) => !previous)}
            >
              <ArrowUpDown className="size-icon-sm" />
              {t(sortDesc ? 'mcp.servers.descending' : 'mcp.servers.ascending')}
            </Button>
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              size="md"
              options={[
                {
                  value: 'grid',
                  icon: <Grid3X3 />,
                  label: t('mcp.servers.gridView'),
                },
                {
                  value: 'table',
                  icon: <ListIcon />,
                  label: t('mcp.servers.tableView'),
                },
              ]}
            />
            <Button variant="ghost" asChild>
              <Link to="/mcp-chat">
                <Rocket className="size-icon-sm" />
                {t('mcp.servers.playgroundTitle')}
              </Link>
            </Button>
            {createButton}
          </>
        }
        state={
          isLoading
            ? 'loading'
            : isError
              ? 'error'
              : sortedServers.length === 0
                ? 'empty'
                : 'content'
        }
        loadingState={
          <PageLoadingState title={t('common.loading')} description={null} />
        }
        errorState={
          <PageErrorState
            title={t('mcp.servers.loadFailed')}
            description={null}
            retryLabel={t('common.retry')}
            onRetry={handleRefresh}
          />
        }
        emptyState={
          <PageEmptyState
            title={t(hasFilters ? 'mcp.servers.noMatch' : 'mcp.servers.empty')}
            description={t(
              hasFilters
                ? 'mcp.servers.noMatchDescription'
                : 'mcp.servers.emptyDescription',
            )}
            action={hasFilters ? undefined : createButton}
          />
        }
      >
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-space-base @xl:grid-cols-2 @5xl:grid-cols-3">
            {sortedServers.map((server) => (
              <MCPServerCard
                key={server.id}
                server={server}
                tools={getServerTools(server)}
                isOnline={hasServerTools(server)}
                onEdit={handleEdit}
                onDelete={requestDelete}
                onCopy={handleCopyUrl}
                onTestConnection={handleTestConnection}
                onViewDetail={onServerSelect ? handleViewDetail : undefined}
                isTesting={testingServerId === server.id}
                copied={copiedId === server.id}
              />
            ))}
          </div>
        ) : (
          <MCPServerTable
            servers={sortedServers}
            toolsCount={(server) => getServerTools(server).length}
            onEdit={handleEdit}
            onCopy={handleCopyUrl}
            onDelete={requestDelete}
            onTestConnection={handleTestConnection}
            onViewDetail={onServerSelect ? handleViewDetail : undefined}
            testingServerId={testingServerId}
            copiedId={copiedId}
          />
        )}
      </ListPageTemplate>
      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setPendingDelete(null)
        }}
        title={t('mcp.servers.card.deleteTitle')}
        description={t('mcp.servers.deleteConfirm', {
          name: pendingDelete?.server.name,
        })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('mcp.servers.card.confirmDelete')}
        pending={deleteMutation.isPending}
        returnFocus={pendingDelete?.returnFocus}
        onConfirm={() => void handleDelete()}
      />

      <ModalRoot
        open={showCreateDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) closeServerForm()
        }}
      >
        <ModalContent
          returnFocus={formReturnFocus}
          aria-describedby={undefined}
        >
          <ModalTitle className="sr-only">
            {t(
              showEditDialog
                ? 'mcp.servers.actions.edit'
                : 'mcp.servers.create',
            )}
          </ModalTitle>
          <MCPServerForm
            server={
              showEditDialog && selectedServer ? selectedServer : undefined
            }
            onSuccess={() => {
              closeServerForm()
              refetch()
            }}
            onCancel={closeServerForm}
          />
        </ModalContent>
      </ModalRoot>
    </>
  )
}
