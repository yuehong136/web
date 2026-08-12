/**
 * 记忆库相关 Hooks
 * 使用 TanStack Query 进行服务端状态管理
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { memoryAPI } from '@/api/memory'
import { useMemoryStore } from '@/stores/memory'
import type {
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
  messages: (memoryId: string) =>
    [...memoryKeys.all, memoryId, 'messages'] as const,
  messageList: (memoryId: string, params: MessageListParams) =>
    [...memoryKeys.messages(memoryId), params] as const,
  // 独立根，刻意不挂 messages(memoryId) 前缀：消息状态/删除 mutation 失效
  // messages 前缀时不应连带重取消息原文（形状沿用原内联 key，不变）
  messageContent: (memoryId: string, messageId: string) =>
    ['message-content', memoryId, messageId] as const,
}

// ============ 记忆库列表 ============

/**
 * 获取记忆库列表
 */
export function useMemoryList(params?: MemoryListParams) {
  return useQuery({
    queryKey: memoryKeys.list(params || {}),
    queryFn: () => memoryAPI.memory.list(params),
    staleTime: 30 * 1000, // 30 秒内不重新请求
    placeholderData: (previousData) => previousData, // 保持之前的数据，避免闪烁
  })
}

// ============ 记忆库详情 ============

/**
 * 获取记忆库详情
 */
export function useMemoryDetail(id: string | undefined) {
  return useQuery({
    queryKey: memoryKeys.detail(id || ''),
    queryFn: () => {
      if (!id) throw new Error('Memory ID is required')
      return memoryAPI.memory.get(id)
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
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { closeCreateModal } = useMemoryStore()

  return useMutation({
    mutationFn: (data: CreateMemoryParams) => memoryAPI.memory.create(data),
    onSuccess: (_result, variables) => {
      // 使列表缓存失效，由 React Query 重新拉取最新列表
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() })

      // 关闭弹窗
      closeCreateModal()

      // 提示成功
      toast.success(t('common.saved'), {
        description: t('memory.toast.createSuccess', { name: variables.name }),
      })
    },
    onError: () => {
      toast.error(t('common.errors.serverError'), {
        description: t('memory.toast.createFailed'),
      })
    },
  })
}

/**
 * 更新记忆库
 */
export function useUpdateMemory() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { closeEditModal } = useMemoryStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemoryParams }) =>
      memoryAPI.memory.update(id, data),
    onSuccess: (_result, { id }) => {
      // 使缓存失效，由 React Query 重新拉取详情/配置/列表
      queryClient.invalidateQueries({ queryKey: memoryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: memoryKeys.config(id) })
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() })

      // 关闭弹窗
      closeEditModal()

      // 提示成功
      toast.success(t('memory.config.saveSuccess'))
    },
    onError: () => {
      toast.error(t('memory.config.saveFailed'), {
        description: t('memory.toast.updateFailed'),
      })
    },
  })
}

/**
 * 删除记忆库
 */
export function useDeleteMemory() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => memoryAPI.memory.delete(id),
    onSuccess: () => {
      // 使列表缓存失效，由 React Query 重新拉取最新列表
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() })

      // 提示成功
      toast.success(t('common.deleted'), {
        description: t('memory.toast.deleteSuccess'),
      })
    },
    onError: () => {
      toast.error(t('common.errors.serverError'), {
        description: t('memory.toast.deleteFailed'),
      })
    },
  })
}

// ============ 消息列表 ============

/**
 * 获取消息列表
 */
export function useMessageList(
  memoryId: string | undefined,
  params?: MessageListParams,
) {
  return useQuery({
    queryKey: memoryKeys.messageList(memoryId || '', params || {}),
    queryFn: async () => {
      if (!memoryId) throw new Error('Memory ID is required')
      const data = await memoryAPI.memory.getDetail(memoryId, params)
      return {
        ...data.messages,
        storage_type: data.storage_type,
      }
    },
    enabled: !!memoryId,
    placeholderData: (previousData) => previousData,
  })
}

/**
 * 获取消息内容
 */
export function useMessageContent(
  memoryId: string,
  messageId: string,
  enabled = false,
) {
  return useQuery({
    queryKey: memoryKeys.messageContent(memoryId, messageId),
    queryFn: () => memoryAPI.message.getContent(memoryId, messageId),
    enabled,
  })
}

// ============ 消息操作 ============

/**
 * 更新消息状态（启用/禁用）
 */
export function useUpdateMessageState() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      memoryId,
      messageId,
      status,
    }: {
      memoryId: string
      messageId: number
      status: boolean
    }) => memoryAPI.message.updateState(memoryId, messageId, status),
    onSuccess: (_, { memoryId }) => {
      // 使消息列表缓存失效，由 React Query 重新拉取
      queryClient.invalidateQueries({ queryKey: memoryKeys.messages(memoryId) })

      toast.success(t('common.saved'))
    },
    onError: () => {
      toast.error(t('common.errors.serverError'), {
        description: t('memory.toast.updateMessageStatusFailed'),
      })
    },
  })
}

/**
 * 遗忘消息
 */
export function useForgetMessage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      memoryId,
      messageId,
    }: {
      memoryId: string
      messageId: number
    }) => memoryAPI.message.forget(memoryId, messageId),
    onSuccess: (_, { memoryId }) => {
      // 使消息列表缓存失效，由 React Query 重新拉取
      queryClient.invalidateQueries({ queryKey: memoryKeys.messages(memoryId) })

      toast.success(t('memory.toast.forgetMessageSuccess'))
    },
    onError: () => {
      toast.error(t('common.errors.serverError'), {
        description: t('memory.toast.forgetMessageFailed'),
      })
    },
  })
}

// ============ 辅助 Hooks ============

/**
 * 使用防抖的搜索值
 */
export function useDebouncedSearch(value: string, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
