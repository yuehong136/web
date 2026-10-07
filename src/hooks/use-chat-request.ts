/**
 * Chat Request Hooks
 *
 * 使用 TanStack Query 管理聊天相关的服务器状态
 */

import { useQuery } from '@tanstack/react-query'
import { conversationAPI } from '@/api/conversation'

// Query Keys 统一管理
export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversationList: (params: Record<string, any>) =>
    [...chatKeys.conversations(), 'list', params] as const,
  conversationsByDialog: (dialogId: string) =>
    [...chatKeys.conversations(), 'byDialog', dialogId] as const,
  conversationDetail: (id: string) =>
    [...chatKeys.conversations(), 'detail', id] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, 'messages', conversationId] as const,
  // ExplorePage 话题列表，沿用原内联形状（与 conversationsByDialog 同 API，
  // 但查询配置不同且缓存形态独立，刻意不共 key）
  dialogConversations: (dialogId: string) =>
    ['dialogConversations', dialogId] as const,
}

// 根据 dialog_id 获取对话列表（用于首页应用历史）
export const useFetchConversationsByDialog = (dialogId?: string | null) => {
  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: chatKeys.conversationsByDialog(dialogId || ''),
    queryFn: async () => {
      if (!dialogId) return []
      const response = await conversationAPI.getConversationsByDialog(dialogId)
      // API 直接返回数组
      return response || []
    },
    enabled: !!dialogId,
    staleTime: 2 * 60 * 1000, // 2 分钟内认为数据新鲜
    gcTime: 5 * 60 * 1000, // 缓存保留 5 分钟
    refetchOnWindowFocus: false,
  })
  return {
    conversations: Array.isArray(data) ? data : [],
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}
