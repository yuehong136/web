/**
 * Document Request Hooks
 * 
 * 使用 TanStack Query 管理文档相关的服务器状态
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { knowledgeAPI } from '@/api/knowledge'
import type { Document } from '@/types/api'

// Query Keys 统一管理
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (knowledgeBaseId: string, params: Record<string, any>) => 
    [...documentKeys.lists(), knowledgeBaseId, params] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  chunks: (documentId: string, params: Record<string, any>) => 
    [...documentKeys.all, 'chunks', documentId, params] as const,
}

// 获取当前知识库 ID
export const useKnowledgeBaseIdFromRoute = (): string => {
  const { id, knowledgeBaseId } = useParams()
  return (knowledgeBaseId || id) as string || ''
}

// 获取文档列表
export interface UseFetchDocumentListParams {
  knowledgeBaseId?: string
  page?: number
  page_size?: number
  keywords?: string
  status?: string[]
  suffix?: string[]
}

export const useFetchDocumentList = (params: UseFetchDocumentListParams = {}) => {
  const routeKbId = useKnowledgeBaseIdFromRoute()
  const { 
    knowledgeBaseId = routeKbId, 
    page = 1, 
    page_size = 20, 
    keywords,
    status,
    suffix 
  } = params

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: documentKeys.list(knowledgeBaseId, { page, page_size, keywords, status, suffix }),
    queryFn: async () => {
      const response = await knowledgeAPI.document.list(knowledgeBaseId, {
        page,
        page_size,
        keywords,
        status,
        suffix,
      })
      return response
    },
    enabled: !!knowledgeBaseId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    documents: data?.docs ?? [],
    total: data?.total ?? 0,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 获取文档详情
export const useFetchDocumentDetail = (documentId?: string) => {
  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: documentKeys.detail(documentId || ''),
    queryFn: async () => {
      const response = await knowledgeAPI.document.get(documentId!)
      return response
    },
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return {
    document: data ?? null,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 上传文档
export const useUploadDocument = () => {
  const queryClient = useQueryClient()
  const knowledgeBaseId = useKnowledgeBaseIdFromRoute()

  const { mutateAsync, isPending, isError, error, data } = useMutation({
    mutationFn: async (params: {
      knowledgeBaseId?: string
      files: File[]
      options?: {
        parser_id?: string
        parser_config?: Record<string, any>
      }
    }) => {
      const kbId = params.knowledgeBaseId || knowledgeBaseId
      const response = await knowledgeAPI.document.upload(kbId, params.files, params.options)
      return { knowledgeBaseId: kbId, documents: response }
    },
    onSuccess: ({ knowledgeBaseId: kbId }) => {
      queryClient.invalidateQueries({ 
        queryKey: documentKeys.lists(),
        predicate: (query) => {
          const key = query.queryKey as string[]
          return key[0] === 'documents' && key[1] === 'list' && key[2] === kbId
        }
      })
    },
  })

  return {
    uploadDocument: mutateAsync,
    uploadedDocuments: data?.documents ?? [],
    isLoading: isPending,
    isError,
    error,
  }
}

// 删除文档
export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (documentIds: string | string[]) => {
      const ids = Array.isArray(documentIds) ? documentIds : [documentIds]
      await knowledgeAPI.document.delete(ids)
      return ids
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })

  return {
    deleteDocument: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 重新解析文档
export const useParseDocument = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (documentIds: string | string[]) => {
      const ids = Array.isArray(documentIds) ? documentIds : [documentIds]
      await knowledgeAPI.document.parse(ids)
      return ids
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })

  return {
    parseDocument: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 更新文档状态
export const useUpdateDocumentStatus = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: {
      documentIds: string[]
      status: string
    }) => {
      await knowledgeAPI.document.updateStatus(params.documentIds, params.status)
      return params
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })

  return {
    updateDocumentStatus: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 获取文档 Chunks
export interface UseFetchChunksParams {
  documentId: string
  page?: number
  page_size?: number
  keywords?: string
}

export const useFetchChunks = (params: UseFetchChunksParams) => {
  const { documentId, page = 1, page_size = 20, keywords } = params

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: documentKeys.chunks(documentId, { page, page_size, keywords }),
    queryFn: async () => {
      const response = await knowledgeAPI.chunk.list(documentId, {
        page,
        page_size,
        keywords,
      })
      return response
    },
    enabled: !!documentId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    chunks: data?.chunks ?? [],
    total: data?.total ?? 0,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}
