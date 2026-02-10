/**
 * Search Request Hooks
 *
 * 使用 TanStack Query 管理搜索应用相关的服务器状态
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { searchAPI } from '@/api/search'
import type {
  CreateSearchRequest,
  UpdateSearchRequest,
} from '@/types'

// Query Keys 统一管理
export const searchKeys = {
  all: ['search'] as const,
  lists: () => [...searchKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...searchKeys.lists(), params] as const,
  details: () => [...searchKeys.all, 'detail'] as const,
  detail: (id: string) => [...searchKeys.details(), id] as const,
  configs: () => [...searchKeys.all, 'config'] as const,
  config: (id: string) => [...searchKeys.configs(), id] as const,
  sessions: () => [...searchKeys.all, 'session'] as const,
  session: (id: string) => [...searchKeys.sessions(), id] as const,
}

// 获取当前搜索应用 ID
export const useSearchId = (): string => {
  const { id } = useParams()
  return (id as string) || ''
}

// 获取搜索应用列表
export interface UseFetchSearchListParams {
  owner_ids?: string[]
  page?: number
  page_size?: number
  orderby?: string
  desc?: boolean
  keywords?: string
}

export const useFetchSearchList = (params: UseFetchSearchListParams = {}) => {
  const {
    owner_ids,
    page = 1,
    page_size = 12,
    orderby = 'update_time',
    desc = true,
    keywords,
  } = params

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: searchKeys.list({ owner_ids, page, page_size, orderby, desc, keywords }),
    queryFn: async () => {
      const response = await searchAPI.list({
        owner_ids,
        page,
        page_size,
        orderby,
        desc,
        keywords,
      })
      return response
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    searchApps: data?.search_apps ?? [],
    total: data?.total ?? 0,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

export const useFetchSearchAppList = useFetchSearchList

// 获取搜索应用详情
export const useFetchSearchDetail = (id?: string) => {
  const searchId = useSearchId()
  const targetId = id || searchId

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: searchKeys.detail(targetId),
    queryFn: async () => {
      const response = await searchAPI.detail(targetId)
      return response
    },
    enabled: !!targetId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return {
    searchApp: data ?? null,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

export const useFetchSearchAppDetail = useFetchSearchDetail

// 创建搜索应用
export const useCreateSearch = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: CreateSearchRequest) => {
      const response = await searchAPI.create(params)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.lists() })
    },
  })

  return {
    createSearch: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 更新搜索应用
export const useUpdateSearch = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: UpdateSearchRequest) => {
      const response = await searchAPI.update(params)
      return response
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: searchKeys.lists() })
      if (vars.search_id) {
        queryClient.invalidateQueries({ queryKey: searchKeys.detail(vars.search_id) })
      }
    },
  })

  return {
    updateSearch: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 删除搜索应用
export const useDeleteSearch = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (searchId: string) => {
      await searchAPI.remove(searchId)
      return searchId
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: searchKeys.lists() })
      queryClient.removeQueries({ queryKey: searchKeys.detail(deletedId) })
    },
  })

  return {
    deleteSearch: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 知识库选项列表 (复用 useFetchSearchList 用于下拉选择)
export const useSearchOptions = () => {
  const { searchApps, isLoading } = useFetchSearchList({ page_size: 1000 })

  const options = searchApps.map((app) => ({
    label: app.name,
    value: app.id,
  }))

  return { options, isLoading }
}
