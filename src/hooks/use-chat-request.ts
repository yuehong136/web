/**
 * Chat Request Hooks
 * 
 * 使用 TanStack Query 管理聊天相关的服务器状态
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { conversationAPI } from '@/api/conversation'
import type { ConversationInfo, MessageInfo } from '@/types/api'

// Query Keys 统一管理
export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversationList: (params: Record<string, any>) => [...chatKeys.conversations(), 'list', params] as const,
  conversationDetail: (id: string) => [...chatKeys.conversations(), 'detail', id] as const,
  messages: (conversationId: string) => [...chatKeys.all, 'messages', conversationId] as const,
}

// 获取当前对话 ID
export const useConversationId = (): string => {
  const { conversationId } = useParams()
  return (conversationId as string) || ''
}

// 获取对话列表
export interface UseFetchConversationListParams {
  dialogId?: string
  page?: number
  page_size?: number
  keywords?: string
}

export const useFetchConversationList = (params: UseFetchConversationListParams = {}) => {
  const { dialogId, page = 1, page_size = 20, keywords } = params

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: chatKeys.conversationList({ dialogId, page, page_size, keywords }),
    queryFn: async () => {
      const response = await conversationAPI.list({
        dialog_id: dialogId,
        page,
        page_size,
        keywords,
      })
      return response
    },
    enabled: !!dialogId,
    staleTime: 2 * 60 * 1000, // 2 分钟内认为数据新鲜
    gcTime: 5 * 60 * 1000,    // 缓存保留 5 分钟
    refetchOnWindowFocus: false,
  })

  return {
    conversations: data?.conversations ?? [],
    total: data?.total ?? 0,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 获取对话详情（包含消息）
export const useFetchConversation = (conversationId?: string) => {
  const currentId = useConversationId()
  const targetId = conversationId || currentId

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: chatKeys.conversationDetail(targetId),
    queryFn: async () => {
      const response = await conversationAPI.get(targetId)
      return response
    },
    enabled: !!targetId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    conversation: data ?? null,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 获取对话消息列表
export const useFetchMessages = (conversationId?: string) => {
  const currentId = useConversationId()
  const targetId = conversationId || currentId

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: chatKeys.messages(targetId),
    queryFn: async () => {
      const response = await conversationAPI.getMessages(targetId)
      return response
    },
    enabled: !!targetId,
    staleTime: 30 * 1000, // 消息列表 30 秒内认为新鲜
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    messages: data?.messages ?? [],
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 创建对话
export const useCreateConversation = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: {
      dialogId?: string
      title?: string
      model?: string
      knowledgeBaseIds?: string[]
    }) => {
      const response = await conversationAPI.create(params)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
    },
  })

  return {
    createConversation: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 更新对话
export const useUpdateConversation = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: {
      conversationId: string
      title?: string
      [key: string]: any
    }) => {
      const { conversationId, ...data } = params
      await conversationAPI.update(conversationId, data)
      return params
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
      queryClient.invalidateQueries({ 
        queryKey: chatKeys.conversationDetail(data.conversationId) 
      })
    },
  })

  return {
    updateConversation: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 删除对话
export const useDeleteConversation = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (conversationIds: string | string[]) => {
      const ids = Array.isArray(conversationIds) ? conversationIds : [conversationIds]
      await conversationAPI.delete(ids)
      return ids
    },
    onSuccess: (deletedIds) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: chatKeys.conversationDetail(id) })
        queryClient.removeQueries({ queryKey: chatKeys.messages(id) })
      })
    },
  })

  return {
    deleteConversation: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 删除消息
export const useDeleteMessage = () => {
  const queryClient = useQueryClient()
  const conversationId = useConversationId()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (messageId: string) => {
      await conversationAPI.deleteMessage(conversationId, messageId)
      return { conversationId, messageId }
    },
    onSuccess: ({ conversationId }) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(conversationId) })
    },
  })

  return {
    deleteMessage: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}
