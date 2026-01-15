/**
 * 记忆库相关 Hooks
 * 使用 TanStack Query 进行服务端状态管理
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { memoryAPI } from '@/api/memory'
import { useMemoryStore } from '@/stores/memory'
import { MEMORY_TEXTS } from '@/constants/memory-texts'
import type {
  Memory,
  MemoryMessage,
  CreateMemoryParams,
  UpdateMemoryParams,
  MemoryListParams,
  MessageListParams,
} from '@/types/memory'

// ============ Query Keys ============

export const memoryKeys = {
  all: ['memories'] as const,
  lists: () => [...memoryKeys.all, 'list'] as const,
  list: (params: MemoryListParams) => [...memoryKeys.lists(), params] as const,
  details: () => [...memoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...memoryKeys.details(), id] as const,
  config: (id: string) => [...memoryKeys.all, 'config', id] as const,
  messages: (memoryId: string) => [...memoryKeys.all, memoryId, 'messages'] as const,
  messageList: (memoryId: string, params: MessageListParams) =>
    [...memoryKeys.messages(memoryId), params] as const,
}

// ============ 记忆库列表 ============

/**
 * 获取记忆库列表
 */
export function useMemoryList(params?: MemoryListParams) {
  const { setMemories, setLoading } = useMemoryStore()

  return useQuery({
    queryKey: memoryKeys.list(params || {}),
    queryFn: async () => {
      setLoading(true)
      try {
        const data = await memoryAPI.memory.list(params)
        setMemories(data.memory_list, data.total_count)
        return data
      } finally {
        setLoading(false)
      }
    },
    staleTime: 30 * 1000, // 30 秒内不重新请求
    placeholderData: (previousData) => previousData, // 保持之前的数据，避免闪烁
  })
}

// ============ 记忆库详情 ============

/**
 * 获取记忆库详情
 */
export function useMemoryDetail(id: string | undefined) {
  const { setCurrentMemory } = useMemoryStore()

  return useQuery({
    queryKey: memoryKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Memory ID is required')
      const data = await memoryAPI.memory.get(id)
      setCurrentMemory(data)
      return data
    },
    enabled: !!id,
  })
}

/**
 * 获取记忆库配置（用于设置页面）
 */
export function useMemoryConfig(id: string | undefined) {
  return useQuery({
    queryKey: memoryKeys.config(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Memory ID is required')
      return memoryAPI.memory.getConfig(id)
    },
    enabled: !!id,
  })
}

// ============ 记忆库 CRUD ============

/**
 * 创建记忆库
 */
export function useCreateMemory() {
  const queryClient = useQueryClient()
  const { closeCreateModal, addMemory } = useMemoryStore()

  return useMutation({
    mutationFn: (data: CreateMemoryParams) => memoryAPI.memory.create(data),
    onSuccess: (result, variables) => {
      // 后端返回完整的 Memory 对象，直接添加到列表
      addMemory(result)
      
      // 使列表缓存失效
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() })
      
      // 关闭弹窗
      closeCreateModal()
      
      // 提示成功
      toast.success(MEMORY_TEXTS.common.success, {
        description: `${MEMORY_TEXTS.memories.memory} "${variables.name}" ${MEMORY_TEXTS.common.create}${MEMORY_TEXTS.common.success}`,
      })
    },
    onError: (error) => {
      toast.error(MEMORY_TEXTS.common.failed, {
        description: error instanceof Error ? error.message : MEMORY_TEXTS.memories.createFailed,
      })
    },
  })
}

/**
 * 更新记忆库
 */
export function useUpdateMemory() {
  const queryClient = useQueryClient()
  const { updateMemory, closeEditModal } = useMemoryStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemoryParams }) =>
      memoryAPI.memory.update(id, data),
    onSuccess: (result, { id, data }) => {
      // 更新本地状态
      updateMemory(id, data)
      
      // 使缓存失效
      queryClient.invalidateQueries({ queryKey: memoryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: memoryKeys.config(id) })
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() })
      
      // 关闭弹窗
      closeEditModal()
      
      // 提示成功
      toast.success(MEMORY_TEXTS.config.saveSuccess)
    },
    onError: (error) => {
      toast.error(MEMORY_TEXTS.config.saveFailed, {
        description: error instanceof Error ? error.message : MEMORY_TEXTS.memories.updateFailed,
      })
    },
  })
}

/**
 * 删除记忆库
 */
export function useDeleteMemory() {
  const queryClient = useQueryClient()
  const { removeMemory } = useMemoryStore()

  return useMutation({
    mutationFn: (id: string) => memoryAPI.memory.delete(id),
    onSuccess: (_, id) => {
      // 更新本地状态
      removeMemory(id)
      
      // 使列表缓存失效
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() })
      
      // 提示成功
      toast.success(MEMORY_TEXTS.common.success, {
        description: `${MEMORY_TEXTS.memories.memory}${MEMORY_TEXTS.common.delete}${MEMORY_TEXTS.common.success}`,
      })
    },
    onError: (error) => {
      toast.error(MEMORY_TEXTS.common.failed, {
        description: error instanceof Error ? error.message : MEMORY_TEXTS.memories.deleteFailed,
      })
    },
  })
}

// ============ 消息列表 ============

/**
 * 获取消息列表
 */
export function useMessageList(memoryId: string | undefined, params?: MessageListParams) {
  const { setMessages, setMessagesLoading } = useMemoryStore()

  return useQuery({
    queryKey: memoryKeys.messageList(memoryId || '', params || {}),
    queryFn: async () => {
      if (!memoryId) throw new Error('Memory ID is required')
      setMessagesLoading(true)
      try {
        const data = await memoryAPI.message.list(memoryId, params)
        setMessages(data.message_list, data.total_count)
        return data
      } finally {
        setMessagesLoading(false)
      }
    },
    enabled: !!memoryId,
    placeholderData: (previousData) => previousData,
  })
}

/**
 * 获取消息内容
 */
export function useMessageContent(memoryId: string, messageId: string, enabled = false) {
  return useQuery({
    queryKey: ['message-content', memoryId, messageId],
    queryFn: () => memoryAPI.message.getContent(memoryId, messageId),
    enabled,
  })
}

// ============ 消息操作 ============

/**
 * 更新消息状态（启用/禁用）
 */
export function useUpdateMessageState() {
  const queryClient = useQueryClient()
  const { updateMessageStatus } = useMemoryStore()

  return useMutation({
    mutationFn: ({
      memoryId,
      messageId,
      status,
    }: {
      memoryId: string
      messageId: string
      status: boolean
    }) => memoryAPI.message.updateState(memoryId, messageId, status),
    onMutate: async ({ messageId, status }) => {
      // 乐观更新
      updateMessageStatus(messageId, status)
    },
    onSuccess: (_, { memoryId }) => {
      // 使消息列表缓存失效
      queryClient.invalidateQueries({ queryKey: memoryKeys.messages(memoryId) })
      
      toast.success(MEMORY_TEXTS.common.success)
    },
    onError: (error, { messageId, status }) => {
      // 回滚乐观更新
      updateMessageStatus(messageId, !status)
      
      toast.error(MEMORY_TEXTS.common.failed, {
        description: error instanceof Error ? error.message : MEMORY_TEXTS.memories.updateMessageStatusFailed,
      })
    },
  })
}

/**
 * 遗忘消息
 */
export function useForgetMessage() {
  const queryClient = useQueryClient()
  const { removeMessage } = useMemoryStore()

  return useMutation({
    mutationFn: ({
      memoryId,
      messageId,
    }: {
      memoryId: string
      messageId: string
    }) => memoryAPI.message.forget(memoryId, messageId),
    onSuccess: (_, { memoryId, messageId }) => {
      // 更新本地状态
      removeMessage(messageId)
      
      // 使消息列表缓存失效
      queryClient.invalidateQueries({ queryKey: memoryKeys.messages(memoryId) })
      
      toast.success(MEMORY_TEXTS.messages.forget + MEMORY_TEXTS.common.success)
    },
    onError: (error) => {
      toast.error(MEMORY_TEXTS.common.failed, {
        description: error instanceof Error ? error.message : MEMORY_TEXTS.memories.forgetMessageFailed,
      })
    },
  })
}

// ============ 辅助 Hooks ============

/**
 * 使用防抖的搜索值
 */
export function useDebouncedSearch(value: string, delay = 300) {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// 需要导入 React
import React from 'react'
