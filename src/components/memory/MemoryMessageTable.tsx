/**
 * 记忆消息表格组件
 * 使用 @tanstack/react-table 实现
 */

import { Fragment, useState } from 'react'
import XMarkdown from '@ant-design/x-markdown'
import { useTranslation } from 'react-i18next'
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
} from '@tanstack/react-table'
import type { ColumnDef, ExpandedState, Row } from '@tanstack/react-table'
import {
  Eye,
  Trash2,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Bot,
  User,
  FileText,
  Braces,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCopyFeedback } from '@/hooks/use-copy-feedback'
import { cn } from '@/lib/utils'
import type { MemoryMessage, MemoryType } from '@/types/memory'

interface MemoryMessageTableProps {
  data: MemoryMessage[]
  isLoading?: boolean
  onStatusChange?: (messageId: number, status: boolean) => void
  onForget?: (messageId: number) => void
  onViewContent?: (
    message: MemoryMessage,
  ) => MemoryMessage | Promise<MemoryMessage | void> | void
}

// 记忆类型颜色映射 - 使用 Badge variant
const memoryTypeVariants: Record<
  MemoryType,
  'blue' | 'purple' | 'green' | 'orange'
> = {
  raw: 'blue',
  semantic: 'purple',
  episodic: 'green',
  procedural: 'orange',
}

const USER_INPUT_PREFIX = 'User Input:'
const AGENT_RESPONSE_PREFIX = 'Agent Response:'

function splitThinking(response: string) {
  const trimmed = response.trim()
  if (!trimmed.startsWith('<think>')) {
    return { answer: response.trim(), reasoning: '' }
  }

  const closeIndex = trimmed.indexOf('</think>')
  if (closeIndex >= 0) {
    return {
      reasoning: trimmed.slice('<think>'.length, closeIndex).trim(),
      answer: trimmed.slice(closeIndex + '</think>'.length).trim(),
    }
  }

  const headingIndex = trimmed.search(/\n\s*#\s+/)
  if (headingIndex >= 0) {
    return {
      reasoning: trimmed.slice('<think>'.length, headingIndex).trim(),
      answer: trimmed.slice(headingIndex).trim(),
    }
  }

  return {
    reasoning: '',
    answer: trimmed.replace(/^<think>/, '').trim(),
  }
}

function parseMemoryContent(content?: string) {
  const raw = content || ''
  const agentIndex = raw.indexOf(AGENT_RESPONSE_PREFIX)
  const userInput =
    agentIndex >= 0
      ? raw.slice(0, agentIndex).replace(USER_INPUT_PREFIX, '').trim()
      : ''
  const response =
    agentIndex >= 0
      ? raw.slice(agentIndex + AGENT_RESPONSE_PREFIX.length).trim()
      : raw.trim()
  const { answer, reasoning } = splitThinking(response)

  return {
    raw,
    userInput,
    agentResponse: answer,
    reasoning,
  }
}

function formatVectorPreview(vector: MemoryMessage['content_embed']) {
  if (!vector) return ''
  if (Array.isArray(vector)) {
    const preview = vector.slice(0, 24).map((item) => Number(item).toFixed(6))
    return `[${preview.join(', ')}${vector.length > 24 ? ', ...' : ''}]`
  }
  return String(vector)
}

function getVectorDimensions(vector: MemoryMessage['content_embed']) {
  if (!vector) return 0
  if (Array.isArray(vector)) return vector.length
  return String(vector).split(',').filter(Boolean).length
}

function getExtractMessages(message: MemoryMessage) {
  return (message.extract || []).filter((item) => item.content?.trim())
}

export function MemoryMessageTable({
  data,
  isLoading = false,
  onStatusChange,
  onForget,
  onViewContent,
}: MemoryMessageTableProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [forgetDialogOpen, setForgetDialogOpen] = useState(false)
  const [messageToForget, setMessageToForget] = useState<number | null>(null)
  const [contentSheetOpen, setContentSheetOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<MemoryMessage | null>(
    null,
  )
  const [isContentLoading, setIsContentLoading] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)
  const { copiedStates, copyWithFeedback: handleCopy } = useCopyFeedback()
  const getMemoryTypeLabel = (type: MemoryType) =>
    t(`memory.filters.${type}`, type)
  const parsedContent = parseMemoryContent(selectedMessage?.content)
  const vectorPreview = formatVectorPreview(selectedMessage?.content_embed)
  const vectorDimensions = getVectorDimensions(selectedMessage?.content_embed)

  // 打开遗忘确认弹窗
  const handleOpenForgetDialog = (messageId: number) => {
    setMessageToForget(messageId)
    setForgetDialogOpen(true)
  }

  // 确认遗忘
  const handleConfirmForget = () => {
    if (messageToForget !== null && onForget) {
      onForget(messageToForget)
    }
    setForgetDialogOpen(false)
    setMessageToForget(null)
  }

  // 查看内容
  const handleViewContent = async (message: MemoryMessage) => {
    setSelectedMessage(message)
    setContentSheetOpen(true)
    setContentError(null)
    if (!onViewContent) return

    setIsContentLoading(true)
    try {
      const nextMessage = await onViewContent(message)
      if (nextMessage) {
        setSelectedMessage(nextMessage)
      }
    } catch (error) {
      setContentError(
        error instanceof Error
          ? error.message
          : t('memory.messages.loadContentFailed'),
      )
    } finally {
      setIsContentLoading(false)
    }
  }

  // 表格列定义
  const columns: ColumnDef<MemoryMessage>[] = [
    // 展开按钮
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => {
        const hasExtract = getExtractMessages(row.original).length > 0
        if (!hasExtract) return null
        return (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => row.toggleExpanded()}
            className="transition-transform"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        )
      },
      size: 40,
    },
    // 会话 ID
    {
      accessorKey: 'session_id',
      header: t('memory.messages.sessionId'),
      cell: ({ getValue }) => {
        const id = getValue<string>()
        return (
          <div className="flex items-center gap-2">
            <span className="max-w-[120px] truncate font-mono text-xs">
              {id}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleCopy(id, `session-${id}`)}
            >
              {copiedStates[`session-${id}`] ? (
                <Check className="size-4 text-status-success" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        )
      },
    },
    // 智能体
    {
      accessorKey: 'agent_name',
      header: t('memory.messages.agent'),
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>() || '-'}</span>
      ),
    },
    // 类型
    {
      accessorKey: 'message_type',
      header: t('memory.messages.type'),
      cell: ({ getValue }) => {
        const type = getValue<MemoryType>()
        return (
          <Badge variant={memoryTypeVariants[type]} className="text-xs">
            {getMemoryTypeLabel(type)}
          </Badge>
        )
      },
    },
    // 有效日期
    {
      accessorKey: 'valid_at',
      header: t('memory.messages.validDate'),
      cell: ({ getValue }) => (
        <span className="text-sm text-text-secondary">
          {new Date(getValue<string>()).toLocaleDateString()}
        </span>
      ),
    },
    // 启用状态
    {
      accessorKey: 'status',
      header: t('memory.messages.enable'),
      cell: ({ row }) => (
        <Switch
          checked={row.original.status}
          onCheckedChange={(checked) =>
            onStatusChange?.(row.original.message_id, checked)
          }
        />
      ),
    },
    // 操作
    {
      id: 'actions',
      header: t('common.action'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleViewContent(row.original)}
            title={t('memory.messages.viewContent')}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleOpenForgetDialog(row.original.message_id)}
            className="hover:text-text-error/80 text-text-error hover:bg-status-error-subtle"
            title={t('memory.messages.forget')}
          >
            <Trash2 className="size-4" />
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
    getRowCanExpand: (row) => getExtractMessages(row.original).length > 0,
    onExpandedChange: setExpanded,
    state: {
      expanded,
    },
  })

  // 渲染子行（展开内容）
  const renderSubRow = (row: Row<MemoryMessage>) => {
    const extractMessages = getExtractMessages(row.original)
    if (extractMessages.length === 0) return null

    return (
      <TableRow className="bg-background-subtle/50">
        <TableCell colSpan={columns.length} className="p-0">
          <div className="space-y-2 p-4 pl-12">
            <p className="mb-2 text-xs text-text-tertiary">
              {t('memory.messages.extractedMemories')}
            </p>
            {extractMessages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-lg p-3 text-sm',
                  'border border-border-default bg-background-surface',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-3 flex-1 text-text-primary">
                    {msg.content}
                  </p>
                  <Badge
                    variant={memoryTypeVariants[msg.message_type]}
                    className="shrink-0 text-xs"
                  >
                    {getMemoryTypeLabel(msg.message_type)}
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
                  <div className="h-4 w-20 animate-pulse rounded bg-background-subtle" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j} className="h-14">
                    <div className="h-4 w-full animate-pulse rounded bg-background-subtle" />
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
      <div className="overflow-hidden rounded-lg border border-border-default">
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
                          header.getContext(),
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
                  {t('memory.messages.noMessages')}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    className={cn(
                      'transition-colors',
                      row.getIsExpanded() && 'bg-background-subtle/30',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && renderSubRow(row)}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 遗忘确认弹窗 */}
      <AlertDialog open={forgetDialogOpen} onOpenChange={setForgetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('memory.messages.forgetTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('memory.messages.forgetDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmForget}
              className="hover:bg-status-error/90 bg-status-error"
            >
              {t('memory.messages.forget')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 内容查看抽屉 */}
      <Sheet open={contentSheetOpen} onOpenChange={setContentSheetOpen}>
        <SheetContent className="flex h-full w-full flex-col p-0 sm:max-w-2xl">
          <SheetHeader className="px-space-lg py-space-md pr-space-3xl shrink-0 border-b border-border-default">
            <SheetTitle>{t('memory.messages.viewContent')}</SheetTitle>
          </SheetHeader>
          {selectedMessage && (
            <Tabs
              defaultValue="conversation"
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="px-space-lg py-space-sm shrink-0 border-b border-border-subtle">
                <TabsList className="h-9">
                  <TabsTrigger
                    value="conversation"
                    className="gap-space-xs px-space-sm py-space-xs"
                  >
                    <Bot className="size-4" />
                    {t('memory.messages.conversation')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="raw"
                    className="gap-space-xs px-space-sm py-space-xs"
                  >
                    <FileText className="size-4" />
                    {t('memory.messages.rawContent')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="vector"
                    className="gap-space-xs px-space-sm py-space-xs"
                  >
                    <Braces className="size-4" />
                    {t('memory.messages.contentEmbed')}
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 flex-1">
                <TabsContent value="conversation" className="m-0 h-full">
                  <ScrollArea
                    className="h-full"
                    viewportClassName="px-space-lg py-space-md"
                  >
                    {isContentLoading ? (
                      <p className="text-sm text-text-secondary">
                        {t('common.loading')}
                      </p>
                    ) : contentError ? (
                      <p className="text-sm text-status-error">
                        {contentError}
                      </p>
                    ) : (
                      <div className="space-y-space-lg">
                        <section className="rounded-radius-lg border border-border-default bg-background-surface">
                          <div className="px-space-md py-space-sm flex items-center justify-between border-b border-border-subtle">
                            <div className="gap-space-sm flex items-center text-sm font-medium text-text-primary">
                              <span className="rounded-radius-full flex size-8 items-center justify-center bg-background-subtle text-text-secondary">
                                <User className="size-4" />
                              </span>
                              {t('memory.messages.userInput')}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-text-secondary"
                              onClick={() =>
                                handleCopy(
                                  parsedContent.userInput,
                                  `user-${selectedMessage.message_id}`,
                                )
                              }
                              title={t('common.copy')}
                            >
                              {copiedStates[
                                `user-${selectedMessage.message_id}`
                              ] ? (
                                <Check className="size-4 text-status-success" />
                              ) : (
                                <Copy className="size-4" />
                              )}
                            </Button>
                          </div>
                          <p className="px-space-md py-space-sm whitespace-pre-wrap text-sm leading-6 text-text-primary">
                            {parsedContent.userInput || '-'}
                          </p>
                        </section>

                        <section className="rounded-radius-lg border border-border-default bg-background-surface">
                          <div className="px-space-md py-space-sm flex items-center justify-between border-b border-border-subtle">
                            <div className="gap-space-sm flex items-center text-sm font-medium text-text-primary">
                              <span className="rounded-radius-full flex size-8 items-center justify-center bg-background-subtle text-text-secondary">
                                <Bot className="size-4" />
                              </span>
                              {t('memory.messages.agentResponse')}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-text-secondary"
                              onClick={() =>
                                handleCopy(
                                  parsedContent.agentResponse,
                                  `agent-${selectedMessage.message_id}`,
                                )
                              }
                              title={t('common.copy')}
                            >
                              {copiedStates[
                                `agent-${selectedMessage.message_id}`
                              ] ? (
                                <Check className="size-4 text-status-success" />
                              ) : (
                                <Copy className="size-4" />
                              )}
                            </Button>
                          </div>
                          <div className="px-space-md py-space-sm text-sm leading-6 text-text-primary">
                            {parsedContent.agentResponse ? (
                              <div className="prose prose-sm max-w-none">
                                <XMarkdown
                                  content={parsedContent.agentResponse}
                                  openLinksInNewTab
                                  escapeRawHtml
                                />
                              </div>
                            ) : (
                              <p>-</p>
                            )}
                          </div>
                        </section>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="raw" className="m-0 h-full">
                  <ScrollArea
                    className="h-full"
                    viewportClassName="px-space-lg py-space-md"
                  >
                    <div className="rounded-radius-lg border border-border-default bg-background-subtle">
                      <div className="px-space-md py-space-sm flex items-center justify-between border-b border-border-subtle">
                        <span className="text-sm font-medium text-text-secondary">
                          {t('memory.messages.rawContent')}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-text-secondary"
                          onClick={() =>
                            handleCopy(
                              parsedContent.raw,
                              `raw-${selectedMessage.message_id}`,
                            )
                          }
                          title={t('common.copy')}
                        >
                          {copiedStates[`raw-${selectedMessage.message_id}`] ? (
                            <Check className="size-4 text-status-success" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                      </div>
                      <pre className="px-space-md py-space-sm whitespace-pre-wrap break-words font-mono text-xs leading-5 text-text-primary">
                        {parsedContent.raw || '-'}
                      </pre>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="vector" className="m-0 h-full">
                  <ScrollArea
                    className="h-full"
                    viewportClassName="px-space-lg py-space-md"
                  >
                    <div className="space-y-space-md">
                      <div className="rounded-radius-lg px-space-md py-space-sm border border-border-default bg-background-surface">
                        <p className="text-xs text-text-secondary">
                          {t('memory.messages.vectorDimensions', {
                            count: vectorDimensions,
                          })}
                        </p>
                      </div>
                      <div className="rounded-radius-lg border border-border-default bg-background-subtle">
                        <pre className="px-space-md py-space-sm whitespace-pre-wrap break-words font-mono text-xs leading-5 text-text-primary">
                          {vectorPreview || '-'}
                        </pre>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
