/**
 * Knowledge Base Request Hooks
 * 
 * 使用 TanStack Query 管理知识库相关的服务器状态
 * 
 * 优点：
 * - 自动缓存管理，无需 localStorage
 * - 自动请求去重和并发控制
 * - 内置 loading/error 状态
 * - 支持缓存失效和自动刷新
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { knowledgeAPI } from '@/api/knowledge'
import type { 
  KnowledgeBase, 
  CreateKBRequest, 
  UpdateKBRequest 
} from '@/types/api'

// Query Keys 统一管理
export const knowledgeKeys = {
  all: ['knowledge'] as const,
  lists: () => [...knowledgeKeys.all, 'list'] as const,
  list: (params: Record<string, any>) => [...knowledgeKeys.lists(), params] as const,
  details: () => [...knowledgeKeys.all, 'detail'] as const,
  detail: (id: string) => [...knowledgeKeys.details(), id] as const,
}

// 获取当前知识库 ID
export const useKnowledgeBaseId = (): string => {
  const { id } = useParams()
  return (id as string) || ''
}

// 获取知识库列表
export interface UseFetchKnowledgeListParams {
  page?: number
  page_size?: number
  orderby?: string
  desc?: boolean
  keywords?: string
  owner_ids?: string[]
}

export const useFetchKnowledgeList = (params: UseFetchKnowledgeListParams = {}) => {
  const { page = 1, page_size = 12, orderby = 'update_time', desc = true, keywords, owner_ids } = params

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: knowledgeKeys.list({ page, page_size, orderby, desc, keywords, owner_ids }),
    queryFn: async () => {
      const response = await knowledgeAPI.knowledgeBase.list({
        page,
        page_size,
        orderby,
        desc,
        keywords,
        owner_ids,
      })
      return response
    },
    // 5 分钟内认为数据新鲜，不重复请求
    staleTime: 5 * 60 * 1000,
    // 组件卸载后缓存保留 10 分钟
    gcTime: 10 * 60 * 1000,
    // 窗口聚焦时不自动刷新（可选）
    refetchOnWindowFocus: false,
  })

  return {
    knowledgeBases: data?.kbs ?? [],
    total: data?.total ?? 0,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 获取知识库详情
export const useFetchKnowledgeDetail = (id?: string) => {
  const knowledgeBaseId = useKnowledgeBaseId()
  const targetId = id || knowledgeBaseId

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: knowledgeKeys.detail(targetId),
    queryFn: async () => {
      const response = await knowledgeAPI.knowledgeBase.get(targetId)
      return response
    },
    enabled: !!targetId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return {
    knowledgeBase: data ?? null,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 创建知识库
export const useCreateKnowledge = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: CreateKBRequest) => {
      const response = await knowledgeAPI.knowledgeBase.create(params)
      return response
    },
    onSuccess: () => {
      // 创建成功后，使列表缓存失效
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
    },
  })

  return {
    createKnowledge: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 更新知识库
export const useUpdateKnowledge = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: UpdateKBRequest) => {
      await knowledgeAPI.knowledgeBase.update(params)
      return params
    },
    onSuccess: (data) => {
      // 更新成功后，使列表和详情缓存失效
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
      if (data.kb_id) {
        queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(data.kb_id) })
      }
    },
  })

  return {
    updateKnowledge: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 删除知识库
export const useDeleteKnowledge = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (id: string) => {
      await knowledgeAPI.knowledgeBase.delete(id)
      return id
    },
    onSuccess: (deletedId) => {
      // 删除成功后，使列表缓存失效
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
      // 移除详情缓存
      queryClient.removeQueries({ queryKey: knowledgeKeys.detail(deletedId) })
    },
  })

  return {
    deleteKnowledge: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 知识库选项列表（用于下拉选择）
export const useKnowledgeOptions = () => {
  const { knowledgeBases, isLoading } = useFetchKnowledgeList({ page_size: 1000 })

  const options = knowledgeBases.map((kb) => ({
    label: kb.name,
    value: kb.id,
  }))

  return { options, isLoading }
}
