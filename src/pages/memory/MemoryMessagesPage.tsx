/**
 * 记忆库消息列表页面
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { MemoryMessageTable, MemoryEmptyState } from '@/components/memory'
import { cn } from '@/lib/utils'
import { useMemoryStore } from '@/stores/memory'
import {
  useMessageList,
  useUpdateMessageState,
  useForgetMessage,
  useDebouncedSearch,
} from '@/hooks/use-memory'
import { MEMORY_TEXTS } from '@/constants/memory-texts'
import { MemoryType } from '@/types/memory'

export const MemoryMessagesPage: React.FC = () => {
  const { id: memoryId } = useParams<{ id: string }>()

  // Store state
  const {
    messageFilter,
    setMessageFilter,
    messagePage,
    setMessagePage,
    messagePageSize,
  } = useMemoryStore()

  // 搜索防抖
  const [searchInput, setSearchInput] = React.useState(messageFilter.keywords)
  const debouncedSearch = useDebouncedSearch(searchInput)

  // 更新筛选条件
  React.useEffect(() => {
    if (debouncedSearch !== messageFilter.keywords) {
      setMessageFilter({ keywords: debouncedSearch })
    }
  }, [debouncedSearch, messageFilter.keywords, setMessageFilter])

  // API hooks
  const { data, isLoading } = useMessageList(memoryId, {
    page: messagePage,
    page_size: messagePageSize,
    keywords: messageFilter.keywords,
    message_type:
      messageFilter.messageType.length > 0
        ? messageFilter.messageType
        : undefined,
    status: messageFilter.status ?? undefined,
  })

  const updateStateMutation = useUpdateMessageState()
  const forgetMutation = useForgetMessage()

  // 消息列表
  const messages = data?.message_list || []
  const total = data?.total_count || 0

  // 处理状态变更
  const handleStatusChange = (messageId: string, status: boolean) => {
    if (!memoryId) return
    updateStateMutation.mutate({ memoryId, messageId, status })
  }

  // 处理遗忘
  const handleForget = (messageId: string) => {
    if (!memoryId) return
    forgetMutation.mutate({ memoryId, messageId })
  }

  // 消息类型筛选选项
  const messageTypeOptions = [
    { value: MemoryType.Raw, label: MEMORY_TEXTS.memories.raw },
    { value: MemoryType.Semantic, label: MEMORY_TEXTS.memories.semantic },
    { value: MemoryType.Episodic, label: MEMORY_TEXTS.memories.episodic },
    { value: MemoryType.Procedural, label: MEMORY_TEXTS.memories.procedural },
  ]

  // 切换消息类型筛选
  const toggleMessageType = (type: MemoryType) => {
    const newTypes = messageFilter.messageType.includes(type)
      ? messageFilter.messageType.filter((t) => t !== type)
      : [...messageFilter.messageType, type]
    setMessageFilter({ messageType: newTypes })
  }

  // 判断是否有活跃筛选
  const hasActiveFilters =
    messageFilter.messageType.length > 0 || messageFilter.status !== null

  // 判断是否显示空状态
  const showEmptyState = !isLoading && messages.length === 0

  return (
    <div className="h-full flex flex-col">
      {/* 页面头部 */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border-default bg-background-surface">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">
            {MEMORY_TEXTS.messages.pageTitle}
          </h2>
          <span className="text-sm text-text-secondary">
            共 {total} 条
          </span>
        </div>

        {/* 提示信息 */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-sm">{MEMORY_TEXTS.messages.messageDescription}</p>
        </div>
      </div>

      {/* 筛选工具栏 */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-border-default bg-background-surface">
        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="flex-1 max-w-md">
            <Input
              placeholder="搜索消息..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* 筛选按钮 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'gap-2',
                  hasActiveFilters && 'border-text-accent text-text-accent'
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {MEMORY_TEXTS.memories.filter}
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-text-accent text-white rounded-full">
                    {messageFilter.messageType.length +
                      (messageFilter.status !== null ? 1 : 0)}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-4">
                {/* 类型筛选 */}
                <div>
                  <Label className="text-sm font-medium text-text-primary mb-2 block">
                    {MEMORY_TEXTS.messages.type}
                  </Label>
                  <div className="space-y-2">
                    {messageTypeOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          id={`msg-type-${option.value}`}
                          checked={messageFilter.messageType.includes(
                            option.value
                          )}
                          onCheckedChange={() => toggleMessageType(option.value)}
                        />
                        <Label
                          htmlFor={`msg-type-${option.value}`}
                          className="text-sm text-text-secondary cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 状态筛选 */}
                <div>
                  <Label className="text-sm font-medium text-text-primary mb-2 block">
                    {MEMORY_TEXTS.messages.enable}
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="status-all"
                        checked={messageFilter.status === null}
                        onCheckedChange={() =>
                          setMessageFilter({ status: null })
                        }
                      />
                      <Label
                        htmlFor="status-all"
                        className="text-sm text-text-secondary cursor-pointer"
                      >
                        全部
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="status-enabled"
                        checked={messageFilter.status === true}
                        onCheckedChange={() =>
                          setMessageFilter({ status: true })
                        }
                      />
                      <Label
                        htmlFor="status-enabled"
                        className="text-sm text-text-secondary cursor-pointer"
                      >
                        {MEMORY_TEXTS.messages.enabled}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="status-disabled"
                        checked={messageFilter.status === false}
                        onCheckedChange={() =>
                          setMessageFilter({ status: false })
                        }
                      />
                      <Label
                        htmlFor="status-disabled"
                        className="text-sm text-text-secondary cursor-pointer"
                      >
                        {MEMORY_TEXTS.messages.disabled}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {showEmptyState ? (
          <MemoryEmptyState type="messages" />
        ) : (
          <>
            <MemoryMessageTable
              data={messages}
              isLoading={isLoading}
              onStatusChange={handleStatusChange}
              onForget={handleForget}
            />

            {/* 分页 */}
            {total > messagePageSize && (
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={messagePage <= 1}
                    onClick={() => setMessagePage(messagePage - 1)}
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-text-secondary">
                    第 {messagePage} 页 / 共{' '}
                    {Math.ceil(total / messagePageSize)} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={messagePage >= Math.ceil(total / messagePageSize)}
                    onClick={() => setMessagePage(messagePage + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

MemoryMessagesPage.displayName = 'MemoryMessagesPage'
