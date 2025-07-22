import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { conversationAPI } from '../api/conversation'
import { queryKeys, invalidateQueries } from '../lib/query-client'
import { toast } from '../lib/toast'
import type { 
  Conversation, 
  ChatCompletionRequest, 
  PaginationRequest 
} from '../types/api'

// 获取对话列表
export const useConversations = (params?: PaginationRequest & { 
  keywords?: string 
  status?: string 
}) => {
  return useQuery({
    queryKey: queryKeys.conversations.list(params || {}),
    queryFn: () => conversationAPI.getConversations(params),
  })
}

// 无限滚动获取对话列表
export const useInfiniteConversations = (params?: { 
  keywords?: string 
  status?: string 
  pageSize?: number
}) => {
  return useInfiniteQuery({
    queryKey: queryKeys.conversations.list(params || {}),
    queryFn: ({ pageParam = 1 }) => 
      conversationAPI.getConversations({
        page: pageParam,
        page_size: params?.pageSize || 20,
        ...params,
      }),
    getNextPageParam: (lastPage) => 
      lastPage.has_next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  })
}

// 获取对话详情
export const useConversation = (conversationId: string) => {
  return useQuery({
    queryKey: queryKeys.conversations.detail(conversationId),
    queryFn: () => conversationAPI.getConversation(conversationId),
    enabled: !!conversationId,
  })
}

// 获取对话消息
export const useMessages = (conversationId: string, params?: PaginationRequest) => {
  return useQuery({
    queryKey: queryKeys.conversations.messages(conversationId),
    queryFn: () => conversationAPI.getMessages(conversationId, params),
    enabled: !!conversationId,
  })
}

// 创建对话
export const useCreateConversation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: { title: string; system_prompt?: string }) => 
      conversationAPI.createConversation(data),
    onSuccess: (newConversation) => {
      // 使对话列表查询失效
      invalidateQueries.conversations()
      
      toast.success('对话创建成功')
      return newConversation
    },
    onError: (error: any) => {
      toast.error(error.message || '创建对话失败')
    },
  })
}

// 更新对话
export const useUpdateConversation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ conversationId, data }: { 
      conversationId: string
      data: { title?: string; system_prompt?: string }
    }) => conversationAPI.updateConversation(conversationId, data),
    onSuccess: (updatedConversation) => {
      // 更新缓存
      queryClient.setQueryData(
        queryKeys.conversations.detail(updatedConversation.id),
        updatedConversation
      )
      
      // 使对话列表查询失效
      invalidateQueries.conversations()
      
      toast.success('对话更新成功')
    },
    onError: (error: any) => {
      toast.error(error.message || '更新对话失败')
    },
  })
}

// 删除对话
export const useDeleteConversation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (conversationId: string) => 
      conversationAPI.deleteConversation(conversationId),
    onSuccess: (_, conversationId) => {
      // 从缓存中移除
      queryClient.removeQueries({
        queryKey: queryKeys.conversations.detail(conversationId)
      })
      
      // 使对话列表查询失效
      invalidateQueries.conversations()
      
      toast.success('对话删除成功')
    },
    onError: (error: any) => {
      toast.error(error.message || '删除对话失败')
    },
  })
}

// 归档对话
export const useArchiveConversation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (conversationId: string) => 
      conversationAPI.archiveConversation(conversationId),
    onSuccess: () => {
      invalidateQueries.conversations()
      toast.success('对话已归档')
    },
    onError: (error: any) => {
      toast.error(error.message || '归档对话失败')
    },
  })
}

// 聊天完成
export const useChatCompletion = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: ChatCompletionRequest) => 
      conversationAPI.chatCompletion(data),
    onSuccess: (response, variables) => {
      // 如果有conversation_id，刷新消息列表
      if (variables.conversation_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.messages(variables.conversation_id)
        })
      }
      
      // 刷新对话列表
      invalidateQueries.conversations()
    },
    onError: (error: any) => {
      toast.error(error.message || '发送消息失败')
    },
  })
}

// 问答
export const useAsk = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: {
      question: string
      conversation_id?: string
      kb_ids?: string[]
      model?: string
      stream?: boolean
    }) => conversationAPI.ask(data),
    onSuccess: (response, variables) => {
      // 如果有conversation_id，刷新消息列表
      if (response.conversation_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.messages(response.conversation_id)
        })
      }
      
      // 刷新对话列表
      invalidateQueries.conversations()
    },
    onError: (error: any) => {
      toast.error(error.message || '问答失败')
    },
  })
}

// 语音识别
export const useSpeechToText = () => {
  return useMutation({
    mutationFn: ({ audioFile, language }: { audioFile: File; language?: string }) => 
      conversationAPI.speechToText(audioFile, language),
    onError: (error: any) => {
      toast.error(error.message || '语音识别失败')
    },
  })
}

// 文本转语音
export const useTextToSpeech = () => {
  return useMutation({
    mutationFn: conversationAPI.textToSpeech,
    onError: (error: any) => {
      toast.error(error.message || '语音合成失败')
    },
  })
}

// 生成思维导图
export const useGenerateMindmap = () => {
  return useMutation({
    mutationFn: conversationAPI.generateMindmap,
    onError: (error: any) => {
      toast.error(error.message || '生成思维导图失败')
    },
  })
}

// 生成相关问题
export const useGenerateRelatedQuestions = () => {
  return useMutation({
    mutationFn: conversationAPI.generateRelatedQuestions,
    onError: (error: any) => {
      toast.error(error.message || '生成相关问题失败')
    },
  })
}

// 生成对话标题
export const useGenerateTitle = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (conversationId: string) => 
      conversationAPI.generateTitle(conversationId),
    onSuccess: (result, conversationId) => {
      // 更新对话缓存中的标题
      queryClient.setQueryData(
        queryKeys.conversations.detail(conversationId),
        (old: Conversation | undefined) => 
          old ? { ...old, title: result.title } : old
      )
      
      invalidateQueries.conversations()
      toast.success('标题生成成功')
    },
    onError: (error: any) => {
      toast.error(error.message || '生成标题失败')
    },
  })
}

// 搜索对话
export const useSearchConversations = () => {
  return useMutation({
    mutationFn: conversationAPI.searchConversations,
    onError: (error: any) => {
      toast.error(error.message || '搜索失败')
    },
  })
}

// 导出对话
export const useExportConversation = () => {
  return useMutation({
    mutationFn: ({ conversationId, format }: { 
      conversationId: string
      format: 'json' | 'txt' | 'pdf' | 'html' 
    }) => conversationAPI.exportConversation(conversationId, format),
    onSuccess: () => {
      toast.success('导出成功')
    },
    onError: (error: any) => {
      toast.error(error.message || '导出失败')
    },
  })
}

// 对话统计
export const useConversationStats = (timeRange?: string) => {
  return useQuery({
    queryKey: ['conversation', 'stats', timeRange],
    queryFn: () => conversationAPI.getConversationStats(timeRange),
    staleTime: 5 * 60 * 1000, // 5分钟
  })
}