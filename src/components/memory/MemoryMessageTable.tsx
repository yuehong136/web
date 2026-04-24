/**
 * 记忆消息表格组件
 * 使用 @tanstack/react-table 实现
 */

import React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
} from '@tanstack/react-table'
import type { ColumnDef, Row } from '@tanstack/react-table'
import {
  Eye,
  Trash2,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { MEMORY_TEXTS } from '@/constants/memory-texts'
import type { MemoryMessage, MemoryType } from '@/types/memory'

interface MemoryMessageTableProps {
  data: MemoryMessage[]
  isLoading?: boolean
  onStatusChange?: (messageId: string, status: boolean) => void
  onForget?: (messageId: string) => void
  onViewContent?: (message: MemoryMessage) => void
}

// 记忆类型颜色映射 - 使用 Badge variant
const memoryTypeVariants: Record<MemoryType, 'blue' | 'purple' | 'green' | 'orange'> = {
  raw: 'blue',
  semantic: 'purple',
  episodic: 'green',
  procedural: 'orange',
}

// 记忆类型标签
const memoryTypeLabels: Record<MemoryType, string> = {
  raw: MEMORY_TEXTS.memories.raw,
  semantic: MEMORY_TEXTS.memories.semantic,
  episodic: MEMORY_TEXTS.memories.episodic,
  procedural: MEMORY_TEXTS.memories.procedural,
}

export const MemoryMessageTable: React.FC<MemoryMessageTableProps> = ({
  data,
  isLoading = false,
  onStatusChange,
  onForget,
  onViewContent,
}) => {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})
  const [forgetDialogOpen, setForgetDialogOpen] = React.useState(false)
  const [messageToForget, setMessageToForget] = React.useState<string | null>(null)
  const [contentSheetOpen, setContentSheetOpen] = React.useState(false)
  const [selectedMessage, setSelectedMessage] = React.useState<MemoryMessage | null>(null)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  // 复制到剪贴板
  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 打开遗忘确认弹窗
  const handleOpenForgetDialog = (messageId: string) => {
    setMessageToForget(messageId)
    setForgetDialogOpen(true)
  }

  // 确认遗忘
  const handleConfirmForget = () => {
    if (messageToForget && onForget) {
      onForget(messageToForget)
    }
    setForgetDialogOpen(false)
    setMessageToForget(null)
  }

  // 查看内容
  const handleViewContent = (message: MemoryMessage) => {
    setSelectedMessage(message)
    setContentSheetOpen(true)
    onViewContent?.(message)
  }

  // 表格列定义
  const columns: ColumnDef<MemoryMessage>[] = [
    // 展开按钮
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => {
        const hasExtract = row.original.extract && row.original.extract.length > 0
        if (!hasExtract) return null
        return (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => row.toggleExpanded()}
            className="transition-transform"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="w-icon-sm h-icon-sm" />
            ) : (
              <ChevronRight className="w-icon-sm h-icon-sm" />
            )}
          </Button>
        )
      },
      size: 40,
    },
    // 会话 ID
    {
      accessorKey: 'session_id',
      header: MEMORY_TEXTS.messages.sessionId,
      cell: ({ getValue }) => {
        const id = getValue<string>()
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs truncate max-w-[120px]">
              {id}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleCopy(id, `session-${id}`)}
            >
              {copiedId === `session-${id}` ? (
                <Check className="w-icon-xs h-icon-xs text-text-success" />
              ) : (
                <Copy className="w-icon-xs h-icon-xs" />
              )}
            </Button>
          </div>
        )
      },
    },
    // 智能体
    {
      accessorKey: 'agent_name',
      header: MEMORY_TEXTS.messages.agent,
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>() || '-'}</span>
      ),
    },
    // 类型
    {
      accessorKey: 'message_type',
      header: MEMORY_TEXTS.messages.type,
      cell: ({ getValue }) => {
        const type = getValue<MemoryType>()
        return (
          <Badge
            variant={memoryTypeVariants[type]}
            className="text-xs"
          >
            {memoryTypeLabels[type]}
          </Badge>
        )
      },
    },
    // 有效日期
    {
      accessorKey: 'valid_at',
      header: MEMORY_TEXTS.messages.validDate,
      cell: ({ getValue }) => (
        <span className="text-sm text-text-secondary">
          {new Date(getValue<string>()).toLocaleDateString()}
        </span>
      ),
    },
    // 启用状态
    {
      accessorKey: 'status',
      header: MEMORY_TEXTS.messages.enable,
      cell: ({ row }) => (
        <Switch
          checked={row.original.status}
          onCheckedChange={(checked) =>
            onStatusChange?.(row.original.id, checked)
          }
        />
      ),
    },
    // 操作
    {
      id: 'actions',
      header: MEMORY_TEXTS.messages.action,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleViewContent(row.original)}
            title={MEMORY_TEXTS.messages.viewContent}
          >
            <Eye className="w-icon-sm h-icon-sm" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleOpenForgetDialog(row.original.id)}
            className="text-text-error hover:text-text-error/80 hover:bg-state-error-subtle"
            title={MEMORY_TEXTS.messages.forget}
          >
            <Trash2 className="w-icon-sm h-icon-sm" />
          </Button>
        </div>
      ),
    },
  ]

  // 表格实例
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) =>
      !!row.original.extract && row.original.extract.length > 0,
    onExpandedChange: setExpanded as any,
    state: {
      expanded,
    },
  })

  // 渲染子行（展开内容）
  const renderSubRow = (row: Row<MemoryMessage>) => {
    const extractMessages = row.original.extract || []
    if (extractMessages.length === 0) return null

    return (
      <TableRow className="bg-background-subtle/50">
        <TableCell colSpan={columns.length} className="p-0">
          <div className="p-4 pl-12 space-y-2">
            <p className="text-xs text-text-tertiary mb-2">
              {MEMORY_TEXTS.messages.content}
            </p>
            {extractMessages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'p-3 rounded-lg text-sm',
                  'bg-background-surface border border-border-default'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-text-primary flex-1 line-clamp-3">
                    {msg.content}
                  </p>
                  <Badge
                    variant={memoryTypeVariants[msg.message_type]}
                    className="text-xs shrink-0"
                  >
                    {memoryTypeLabels[msg.message_type]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border-default">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((_, i) => (
                <TableHead key={i} className="h-12">
                  <div className="h-4 w-20 bg-background-subtle rounded animate-pulse" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j} className="h-14">
                    <div className="h-4 w-full bg-background-subtle rounded animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-border-default overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-text-muted"
                >
                  {MEMORY_TEXTS.messages.noMessages}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    className={cn(
                      'transition-colors',
                      row.getIsExpanded() && 'bg-background-subtle/30'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && renderSubRow(row)}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 遗忘确认弹窗 */}
      <AlertDialog open={forgetDialogOpen} onOpenChange={setForgetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{MEMORY_TEXTS.messages.forgetMessage}</AlertDialogTitle>
            <AlertDialogDescription>
              {MEMORY_TEXTS.messages.delMessageWarn}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{MEMORY_TEXTS.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmForget}
              className="bg-state-error hover:bg-state-error/90"
            >
              {MEMORY_TEXTS.messages.forget}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 内容查看抽屉 */}
      <Sheet open={contentSheetOpen} onOpenChange={setContentSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{MEMORY_TEXTS.messages.viewContent}</SheetTitle>
          </SheetHeader>
          {selectedMessage && (
            <div className="mt-6 space-y-4">
              {/* 内容 */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  {MEMORY_TEXTS.messages.content}
                </label>
                <div className="p-4 rounded-lg bg-background-subtle border border-border-default">
                  <p className="text-sm text-text-primary whitespace-pre-wrap">
                    {selectedMessage.content}
                  </p>
                </div>
              </div>

              {/* 嵌入向量（如果有） */}
              {selectedMessage.content_embed && (
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">
                    {MEMORY_TEXTS.messages.contentEmbed}
                  </label>
                  <div className="p-4 rounded-lg bg-background-subtle border border-border-default">
                    <p className="text-xs text-text-tertiary font-mono break-all line-clamp-10">
                      {selectedMessage.content_embed}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

MemoryMessageTable.displayName = 'MemoryMessageTable'
