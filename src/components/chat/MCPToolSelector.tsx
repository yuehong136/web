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
      return <Globe className="w-4 h-4" />
    case 'streamable-http':
    case 'http':
      return <Server className="w-4 h-4" />
    default:
      return <Wrench className="w-4 h-4" />
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

const ServerCard: React.FC<ServerCardProps> = ({ server, isSelected, onToggle }) => {
  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 transition-all duration-200',
        isSelected
          ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5'
          : 'border-[var(--color-border-default)] bg-[var(--color-background-surface)] hover:border-[var(--color-border-accent)]'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
              isSelected
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
            )}
          >
            {getServerIcon(server.server_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-[var(--color-text-primary)] truncate">
                {server.name}
              </span>
              <Badge
                variant="outline"
                className="text-xs shrink-0 bg-[var(--color-surface-secondary)] border-[var(--color-border-subtle)]"
              >
                {server.server_type}
              </Badge>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
              {server.description || '暂无描述'}
            </p>
            {server.url && (
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1 truncate">
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
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedMCPIds)
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
        }
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
        server.description?.toLowerCase().includes(term)
    )
  }, [servers, searchTerm])

  const handleServerToggle = (serverId: string, enabled: boolean) => {
    if (enabled) {
      setLocalSelectedIds((prev) => [...prev, serverId])
    } else {
      setLocalSelectedIds((prev) => prev.filter((id) => id !== serverId))
    }
  }

  const handleConfigChange = (key: keyof MCPChatConfig, value: number | boolean) => {
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
      <DialogTrigger>
        <Button variant="outline" size="sm" className="gap-2">
          <Wrench className="w-4 h-4" />
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
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 shrink-0">
              <Plug className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <DialogTitle>MCP 工具配置</DialogTitle>
              <DialogDescription>
                选择要启用的 MCP 服务器，配置对话中可使用的工具
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-6 max-h-[calc(90vh-220px)]">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <Input
              placeholder="搜索 MCP 服务器..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 服务器选择 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  可用服务器
                </span>
                {servers.length > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium text-[var(--color-text-tertiary)] bg-[var(--color-surface-secondary)] rounded">
                    {servers.length}
                  </span>
                )}
              </div>
              {localSelectedIds.length > 0 && (
                <span className="text-xs text-[var(--color-primary)]">
                  已选择 {localSelectedIds.length} 个
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-secondary)]">
                <div className="relative w-10 h-10 mb-3">
                  <div className="absolute inset-0 rounded-full border-2 border-[var(--color-border-default)]" />
                  <div className="absolute inset-0 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
                </div>
                <span className="text-sm">加载中...</span>
              </div>
            ) : filteredServers.length > 0 ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[var(--color-border-default)] scrollbar-track-transparent">
                {filteredServers.map((server) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    isSelected={localSelectedIds.includes(server.id)}
                    onToggle={(enabled) => handleServerToggle(server.id, enabled)}
                  />
                ))}
              </div>
            ) : servers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-surface-secondary)] to-[var(--color-surface-tertiary)] flex items-center justify-center mb-4 shadow-sm">
                  <Plug className="w-7 h-7 text-[var(--color-text-tertiary)]" />
                </div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  暂无可用的 MCP 服务器
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] max-w-[200px]">
                  请先在设置中添加 MCP 服务器
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="w-8 h-8 text-[var(--color-text-tertiary)] mb-3" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  没有找到匹配的服务器
                </p>
              </div>
            )}
          </div>

          {/* 高级配置 */}
          <div className="border-t border-[var(--color-border-subtle)] pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                高级配置
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-secondary)]">
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
                    handleConfigChange('mcp_timeout', parseInt(e.target.value) || 5000)
                  }
                  min={100}
                  max={30000}
                  className="w-28 text-right"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-secondary)]">
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