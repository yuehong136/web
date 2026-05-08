/**
 * MCP 服务器卡片组件 - Dify 风格
 * 网格布局卡片，悬浮展示详情，现代化视觉设计
 */

import React, { useState, useCallback } from 'react'
import {
  Edit,
  Trash2,
  Copy,
  Check,
  Zap,
  TestTube,
  Loader2,
  MoreHorizontal,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Tooltip } from '@/components/ui/tooltip'
import { cn, copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import type { MCPServer, MCPTool } from '@/types/mcp'

// 服务器类型配置
const SERVER_TYPE_CONFIG: Record<
  string,
  { label: string; bgColor: string; textColor: string; gradient: string }
> = {
  'streamable-http': {
    label: 'HTTP',
    bgColor: 'var(--color-state-info-subtle)',
    textColor: 'var(--color-state-info)',
    gradient: 'from-blue-500/10 to-cyan-500/10',
  },
  sse: {
    label: 'SSE',
    bgColor: 'var(--color-state-success-subtle)',
    textColor: 'var(--color-state-success)',
    gradient: 'from-green-500/10 to-emerald-500/10',
  },
}

interface MCPServerCardProps {
  server: MCPServer
  tools?: MCPTool[]
  isLoadingTools?: boolean
  isOnline?: boolean
  onEdit?: (server: MCPServer) => void
  onDelete?: (server: MCPServer) => void
  onTestConnection?: (server: MCPServer) => void
  onViewDetail?: (server: MCPServer) => void
  isTesting?: boolean
}

export const MCPServerCard: React.FC<MCPServerCardProps> = ({
  server,
  tools = [],
  isLoadingTools = false,
  isOnline = false,
  onEdit,
  onDelete,
  onTestConnection,
  onViewDetail,
  isTesting = false,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const typeConfig = SERVER_TYPE_CONFIG[server.server_type] || {
    label: server.server_type.toUpperCase(),
    bgColor: 'var(--color-background-subtle)',
    textColor: 'var(--color-text-secondary)',
    gradient: 'from-text-tertiary/10 to-text-tertiary/10',
  }

  const handleCopyUrl = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await copyToClipboard(server.url)
      setCopied(true)
      toast.success('地址已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
      toast.error('复制失败，请手动复制')
    }
  }, [server.url])

  const handleDeleteConfirm = useCallback(() => {
    onDelete?.(server)
    setShowDeleteDialog(false)
  }, [server, onDelete])

  return (
    <>
      <div
        className={cn(
          'group relative rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden',
          'hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5',
          isHovered && 'ring-2 ring-blue-500/20'
        )}
        style={{
          backgroundColor: 'var(--color-components-card-bg)',
          borderColor: isHovered ? 'var(--color-state-focus)' : 'var(--color-components-card-border)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onViewDetail?.(server)}
      >
        {/* 顶部渐变装饰 */}
        <div
          className={cn(
            'absolute inset-x-0 top-0 h-24 bg-gradient-to-b opacity-60 transition-opacity',
            typeConfig.gradient,
            isHovered && 'opacity-100'
          )}
        />

        {/* 卡片内容 */}
        <div className="relative p-5">
          {/* 头部：状态 + 操作 */}
          <div className="flex items-start justify-between mb-4">
            {/* 状态指示器 */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all',
                  isOnline && 'animate-pulse'
                )}
                style={{
                  backgroundColor: isOnline
                    ? 'var(--color-state-success)'
                    : 'var(--color-text-disabled)',
                  boxShadow: isOnline ? '0 0 8px var(--color-state-success)' : 'none',
                }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: isOnline ? 'var(--color-state-success)' : 'var(--color-text-disabled)' }}
              >
                {isOnline ? '在线' : '离线'}
              </span>
            </div>

            {/* 操作菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
                    'hover:bg-black/5 dark:hover:bg-background-surface/10'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="right" className="min-w-[140px]">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onTestConnection?.(server)
                  }}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  测试连接
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyUrl}>
                  {copied ? (
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  复制地址
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(server)
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  编辑配置
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteDialog(true)
                  }}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除服务器
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 服务器名称 */}
          <div className="mb-3">
            <h3
              className="text-lg font-semibold truncate mb-1 group-hover:text-blue-600 transition-colors"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {server.name}
            </h3>
            <Badge
              className="text-xs font-medium border-0"
              style={{
                backgroundColor: typeConfig.bgColor,
                color: typeConfig.textColor,
              }}
            >
              {typeConfig.label}
            </Badge>
          </div>

          {/* 服务器地址 */}
          <Tooltip content={copied ? '已复制!' : '点击复制地址'}>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 cursor-pointer hover:bg-black/5 dark:hover:bg-background-surface/5 transition-colors"
              style={{ backgroundColor: 'var(--color-background-subtle)' }}
              onClick={handleCopyUrl}
            >
              <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
              <code
                className="text-xs font-mono truncate flex-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {server.url}
              </code>
            </div>
          </Tooltip>

          {/* 描述（如果有） */}
          {server.description && (
            <p
              className="text-sm line-clamp-2 mb-4"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {server.description}
            </p>
          )}

          {/* 工具信息 */}
          <div
            className="flex items-center justify-between pt-4 border-t"
            style={{ borderColor: 'var(--color-border-default)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ backgroundColor: 'var(--color-state-focus-subtle)' }}
              >
                <Zap className="w-4 h-4" style={{ color: 'var(--color-state-focus)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  可用工具
                </p>
                {isLoadingTools ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--color-text-tertiary)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>加载中</span>
                  </div>
                ) : (
                  <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {tools.length}
                  </p>
                )}
              </div>
            </div>

            {/* 快速测试按钮 */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-8 opacity-0 group-hover:opacity-100 transition-all',
                'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200',
                'dark:hover:bg-blue-950/50'
              )}
              onClick={(e) => {
                e.stopPropagation()
                onTestConnection?.(server)
              }}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <TestTube className="w-3.5 h-3.5 mr-1" />
                  测试
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 悬浮工具预览（最多显示3个） */}
        {isHovered && tools.length > 0 && (
          <div
            className="absolute left-0 right-0 bottom-0 p-3 bg-gradient-to-t from-components-card-bg via-components-card-bg to-transparent"
            style={{ transform: 'translateY(100%)', zIndex: 10 }}
          >
            {/* 这部分可以在未来添加工具预览 */}
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除服务器</AlertDialogTitle>
            <AlertDialogDescription>
              <div>
                <div
                  className="flex items-center gap-3 p-3 rounded-lg my-3"
                  style={{ backgroundColor: 'var(--color-background-subtle)' }}
                >
                  <div
                    className={cn('w-2.5 h-2.5 rounded-full')}
                    style={{
                      backgroundColor: isOnline
                        ? 'var(--color-state-success)'
                        : 'var(--color-text-disabled)',
                    }}
                  />
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {server.name}
                  </span>
                  <Badge
                    className="text-xs"
                    style={{
                      backgroundColor: typeConfig.bgColor,
                      color: typeConfig.textColor,
                    }}
                  >
                    {typeConfig.label}
                  </Badge>
                </div>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  删除后将移除该服务器的所有配置和工具缓存，此操作无法撤销。
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
