import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Wrench, Search, Globe, Server, Settings2, Plug } from 'lucide-react'
import { mcpAPI } from '@/api/mcp'
import { toast } from '@/lib/toast'
import type { MCPServer } from '@/types/mcp'

// 临时定义类型以避免导入问题
interface MCPChatConfig {
  mcp_ids: string[]
  mcp_timeout: number
  verbose_tool_use: boolean
}

export interface MCPToolSelectorProps {
  selectedMCPIds: string[]
  mcpConfig: MCPChatConfig
  onMCPSelectionChange: (selectedIds: string[], config: MCPChatConfig) => void
}

// 根据服务器类型获取图标
const getServerIcon = (serverType: string) => {
  switch (serverType) {
    case 'sse':
      return <Globe className="h-4 w-4" />
    case 'streamable-http':
    case 'http':
      return <Server className="h-4 w-4" />
    default:
      return <Wrench className="h-4 w-4" />
  }
}

/**
 * MCP 服务器卡片组件
 */
interface ServerCardProps {
  server: MCPServer
  isSelected: boolean
  onToggle: (enabled: boolean) => void
}

const ServerCard: React.FC<ServerCardProps> = ({
  server,
  isSelected,
  onToggle,
}) => {
  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 transition-all duration-200',
        isSelected
          ? 'border-[var(--color-components-input-border-focus)] bg-[var(--color-state-focus-subtle)]'
          : 'border-[var(--color-border-default)] bg-[var(--color-background-surface)] hover:border-[var(--color-border-accent)]',
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              isSelected
                ? 'bg-[var(--color-state-focus-subtle)] text-[var(--color-state-focus)]'
                : 'bg-[var(--color-background-subtle)] text-[var(--color-text-secondary)]',
            )}
          >
            {getServerIcon(server.server_type)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="truncate font-medium text-[var(--color-text-primary)]">
                {server.name}
              </span>
              <Badge
                variant="outline"
                className="shrink-0 border-[var(--color-border-subtle)] bg-[var(--color-background-subtle)] text-xs"
              >
                {server.server_type}
              </Badge>
            </div>
            <p className="line-clamp-2 text-sm text-[var(--color-text-secondary)]">
              {server.description || '暂无描述'}
            </p>
            {server.url && (
              <p className="mt-1 truncate text-xs text-[var(--color-text-tertiary)]">
                {server.url}
              </p>
            )}
          </div>
        </div>
        <Switch
          checked={isSelected}
          onCheckedChange={onToggle}
          className="shrink-0"
        />
      </div>
    </div>
  )
}

export function MCPToolSelector({
  selectedMCPIds,
  mcpConfig,
  onMCPSelectionChange,
}: MCPToolSelectorProps) {
  const [open, setOpen] = useState(false)
  const [localConfig, setLocalConfig] = useState<MCPChatConfig>(mcpConfig)
  const [localSelectedIds, setLocalSelectedIds] =
    useState<string[]>(selectedMCPIds)
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // 加载 MCP 服务器列表
  useEffect(() => {
    if (open) {
      loadServers()
    }
  }, [open])

  // 同步外部状态
  useEffect(() => {
    if (open) {
      setLocalSelectedIds(selectedMCPIds)
      setLocalConfig(mcpConfig)
    }
  }, [open, selectedMCPIds, mcpConfig])

  const loadServers = async () => {
    try {
      setLoading(true)
      const response = await mcpAPI.listServers(
        {},
        {
          page: 1,
          page_size: 100,
        },
      )

      setServers(response.mcp_servers || [])
    } catch (error) {
      toast.error('加载 MCP 服务器列表失败')
      console.error('Load MCP servers error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 过滤后的服务器列表
  const filteredServers = useMemo(() => {
    if (!searchTerm) return servers
    const term = searchTerm.toLowerCase()
    return servers.filter(
      (server) =>
        server.name.toLowerCase().includes(term) ||
        server.description?.toLowerCase().includes(term),
    )
  }, [servers, searchTerm])

  const handleServerToggle = (serverId: string, enabled: boolean) => {
    if (enabled) {
      setLocalSelectedIds((prev) => [...prev, serverId])
    } else {
      setLocalSelectedIds((prev) => prev.filter((id) => id !== serverId))
    }
  }

  const handleConfigChange = (
    key: keyof MCPChatConfig,
    value: number | boolean,
  ) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onMCPSelectionChange(localSelectedIds, {
      ...localConfig,
      mcp_ids: localSelectedIds,
    })
    setOpen(false)
  }

  const handleCancel = () => {
    setLocalSelectedIds(selectedMCPIds)
    setLocalConfig(mcpConfig)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wrench className="h-4 w-4" />
          MCP工具
          {selectedMCPIds.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedMCPIds.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent size="lg">
        {/* 头部 */}
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-state-focus-subtle)]">
              <Plug className="h-5 w-5 text-[var(--color-state-focus)]" />
            </div>
            <div className="min-w-0 flex-1 pr-6">
              <DialogTitle>MCP 工具配置</DialogTitle>
              <DialogDescription>
                选择要启用的 MCP 服务器，配置对话中可使用的工具
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 内容区域 */}
        <div className="max-h-[calc(90vh-220px)] flex-1 space-y-6 overflow-y-auto px-6 pb-4">
          {/* 搜索框 */}
          <Input
            placeholder="搜索 MCP 服务器..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            inputSize="sm"
          />

          {/* 服务器选择 */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  可用服务器
                </span>
                {servers.length > 0 && (
                  <span className="inline-flex items-center justify-center rounded bg-[var(--color-background-subtle)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-text-tertiary)]">
                    {servers.length}
                  </span>
                )}
              </div>
              {localSelectedIds.length > 0 && (
                <span className="text-xs text-[var(--color-state-focus)]">
                  已选择 {localSelectedIds.length} 个
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-secondary)]">
                <div className="relative mb-3 h-10 w-10">
                  <div className="absolute inset-0 rounded-full border-2 border-[var(--color-border-default)]" />
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--color-state-focus)] border-t-transparent" />
                </div>
                <span className="text-sm">加载中...</span>
              </div>
            ) : filteredServers.length > 0 ? (
              <div className="scrollbar-thumb-[var(--color-border-default)] max-h-[280px] space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent">
                {filteredServers.map((server) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    isSelected={localSelectedIds.includes(server.id)}
                    onToggle={(enabled) =>
                      handleServerToggle(server.id, enabled)
                    }
                  />
                ))}
              </div>
            ) : servers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-background-subtle)] to-[var(--color-background-default)] shadow-sm">
                  <Plug className="h-7 w-7 text-[var(--color-text-tertiary)]" />
                </div>
                <p className="mb-1 text-sm font-medium text-[var(--color-text-secondary)]">
                  暂无可用的 MCP 服务器
                </p>
                <p className="max-w-[200px] text-xs text-[var(--color-text-tertiary)]">
                  请先在设置中添加 MCP 服务器
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="mb-3 h-8 w-8 text-[var(--color-text-tertiary)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  没有找到匹配的服务器
                </p>
              </div>
            )}
          </div>

          {/* 高级配置 */}
          <div className="border-t border-[var(--color-border-subtle)] pt-6">
            <div className="mb-4 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                高级配置
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-[var(--color-background-subtle)] p-3">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="timeout"
                    className="text-sm font-medium text-[var(--color-text-primary)]"
                  >
                    超时时间 (ms)
                  </Label>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    MCP 工具调用的最大等待时间
                  </p>
                </div>
                <Input
                  id="timeout"
                  type="number"
                  value={localConfig.mcp_timeout}
                  onChange={(e) =>
                    handleConfigChange(
                      'mcp_timeout',
                      parseInt(e.target.value) || 5000,
                    )
                  }
                  min={100}
                  max={30000}
                  className="w-28 text-right"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-[var(--color-background-subtle)] p-3">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="verbose"
                    className="text-sm font-medium text-[var(--color-text-primary)]"
                  >
                    详细日志
                  </Label>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    在对话中显示工具调用的详细信息
                  </p>
                </div>
                <Switch
                  id="verbose"
                  checked={localConfig.verbose_tool_use}
                  onCheckedChange={(checked) =>
                    handleConfigChange('verbose_tool_use', checked)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleSave}>保存配置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
