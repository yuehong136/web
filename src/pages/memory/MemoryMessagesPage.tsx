/**
 * 记忆库消息列表页面
 */

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { memoryAPI } from '@/api/memory'
import { useMemoryStore } from '@/stores/memory'
import {
  useMessageList,
  useUpdateMessageState,
  useForgetMessage,
  useDebouncedSearch,
} from '@/hooks/use-memory'
import type { MemoryMessage } from '@/types/memory'

export function MemoryMessagesPage() {
  const { t } = useTranslation()
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
  const [searchInput, setSearchInput] = useState(messageFilter.keywords)
  const debouncedSearch = useDebouncedSearch(searchInput)

  // 更新筛选条件
  useEffect(() => {
    if (debouncedSearch !== messageFilter.keywords) {
      setMessageFilter({ keywords: debouncedSearch })
    }
  }, [debouncedSearch, messageFilter.keywords, setMessageFilter])

  // API hooks
  const { data, isLoading } = useMessageList(memoryId, {
    page: messagePage,
    page_size: messagePageSize,
    keywords: messageFilter.keywords,
    agent_id:
      messageFilter.agentId.length > 0 ? messageFilter.agentId : undefined,
  })

  const updateStateMutation = useUpdateMessageState()
  const forgetMutation = useForgetMessage()

  // 消息列表
  const messages = useMemo(() => data?.message_list ?? [], [data?.message_list])
  const total = data?.total_count || 0
  const totalPages = Math.ceil(total / messagePageSize)

  const agentOptions = useMemo(() => {
    const options = new Map<string, string>()
    for (const message of messages) {
      if (message.agent_id) {
        options.set(message.agent_id, message.agent_name || message.agent_id)
      }
    }
    return Array.from(options, ([value, label]) => ({ value, label }))
  }, [messages])

  // 处理状态变更
  const handleStatusChange = (messageId: number, status: boolean) => {
    if (!memoryId) return
    updateStateMutation.mutate({ memoryId, messageId, status })
  }

  // 处理遗忘
  const handleForget = (messageId: number) => {
    if (!memoryId) return
    forgetMutation.mutate({ memoryId, messageId })
  }

  const handleViewContent = async (message: MemoryMessage) => {
    if (!memoryId) return message
    const content = await memoryAPI.message.getContent(
      memoryId,
      message.message_id,
    )
    return {
      ...message,
      content: content.content || '',
      content_embed: content.content_embed || [],
    }
  }

  const toggleAgent = (agentId: string) => {
    const newAgentIds = messageFilter.agentId.includes(agentId)
      ? messageFilter.agentId.filter((id) => id !== agentId)
      : [...messageFilter.agentId, agentId]
    setMessageFilter({ agentId: newAgentIds })
  }

  // 判断是否有活跃筛选
  const hasActiveFilters = messageFilter.agentId.length > 0

  // 判断是否显示空状态
  const showEmptyState = !isLoading && messages.length === 0

  return (
    <div className="flex h-full flex-col">
      {/* 页面头部 */}
      <div className="flex-shrink-0 border-b border-border-default bg-background-surface px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            {t('memory.messages.title')}
          </h2>
          <span className="text-sm text-text-secondary">
            {t('memory.messages.total', { count: total })}
          </span>
        </div>

        {/* 提示信息 */}
        <div className="rounded-radius-lg p-space-sm flex items-start gap-2 border border-status-info-subtle bg-status-info-10 text-status-info">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">{t('memory.messages.description')}</p>
        </div>
      </div>

      {/* 筛选工具栏 */}
      <div className="flex-shrink-0 border-b border-border-default bg-background-surface px-6 py-3">
        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="max-w-md flex-1">
            <Input
              placeholder={t('memory.messages.searchPlaceholder')}
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
                className={
                  hasActiveFilters
                    ? 'gap-2 border-text-accent text-text-accent'
                    : 'gap-2'
                }
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t('common.filter')}
                {hasActiveFilters && (
                  <span className="ml-1 rounded-full bg-text-accent px-1.5 py-0.5 text-xs text-components-button-primary-text">
                    {messageFilter.agentId.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block text-sm font-medium text-text-primary">
                    {t('memory.messages.agent')}
                  </Label>
                  <div className="space-y-2">
                    {agentOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          id={`agent-${option.value}`}
                          checked={messageFilter.agentId.includes(option.value)}
                          onCheckedChange={() => toggleAgent(option.value)}
                        />
                        <Label
                          htmlFor={`agent-${option.value}`}
                          className="cursor-pointer text-sm text-text-secondary"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
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
              onViewContent={handleViewContent}
            />

            {/* 分页 */}
            {total > messagePageSize && (
              <div className="mt-6 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={messagePage <= 1}
                    onClick={() => setMessagePage(messagePage - 1)}
                  >
                    {t('memory.messages.previous')}
                  </Button>
                  <span className="text-sm text-text-secondary">
                    {t('memory.messages.pageStatus', {
                      page: messagePage,
                      totalPages,
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={messagePage >= totalPages}
                    onClick={() => setMessagePage(messagePage + 1)}
                  >
                    {t('memory.messages.next')}
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
