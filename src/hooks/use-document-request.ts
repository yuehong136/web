/**
 * Document Request Hooks
 *
 * 使用 TanStack Query 管理文档相关的服务器状态
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { knowledgeAPI } from '@/api/knowledge'
import type { DocumentFilter } from '@/types/api'

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
  filter: (knowledgeBaseId: string) =>
    [...documentKeys.all, 'filter', knowledgeBaseId] as const,
  // 以下两个保留独立根（原页面内联形状，无失效方配对）：不并入 'documents'
  // 根，避免 metadata 等域对 ['documents'] 前缀的失效新增命中这两个查询
  standaloneDetail: (documentId: string | undefined) =>
    ['documentDetail', documentId] as const,
  chunkList: (
    documentId: string | undefined,
    page: number,
    pageSize: number,
    keywords: string,
    availableInt: number | undefined,
  ) =>
    [
      'documentChunks',
      documentId,
      page,
      pageSize,
      keywords,
      availableInt,
    ] as const,
}

// 获取当前知识库 ID
export const useKnowledgeBaseIdFromRoute = (): string => {
  const { id, knowledgeBaseId } = useParams()
  return ((knowledgeBaseId || id) as string) || ''
}

// 文档运行状态常量
export const TaskStatus = {
  UNSTART: '0',
  RUNNING: '1',
  CANCEL: '2',
  DONE: '3',
  FAIL: '4',
} as const

// 获取文档列表
export interface UseFetchDocumentListParams {
  knowledgeBaseId?: string
  page?: number
  page_size?: number
  keywords?: string
  orderby?: string
  desc?: boolean
  filter_params?: DocumentFilter
  /** 是否启用智能轮询（有解析中的文档时自动轮询） */
  enableSmartPolling?: boolean
  /** 轮询间隔（毫秒），默认 5000 */
  pollingInterval?: number
}

export const useFetchDocumentList = (
  params: UseFetchDocumentListParams = {},
) => {
  const routeKbId = useKnowledgeBaseIdFromRoute()
  const {
    knowledgeBaseId = routeKbId,
    page = 1,
    page_size = 20,
    keywords,
    orderby = 'create_time',
    desc = true,
    filter_params = {},
    enableSmartPolling = true,
    pollingInterval = 5000,
  } = params

  const { data, isFetching, isPending, isError, error, refetch } = useQuery({
    queryKey: documentKeys.list(knowledgeBaseId, {
      page,
      page_size,
      keywords,
      orderby,
      desc,
      filter_params,
    }),
    queryFn: async () => {
      const response = await knowledgeAPI.document.list({
        kb_id: knowledgeBaseId,
        page,
        page_size,
        keywords,
        orderby,
        desc,
        filter_params,
      })
      return response
    },
    enabled: !!knowledgeBaseId,
    staleTime: 30 * 1000, // 30秒内数据被视为新鲜
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    // 智能轮询：根据查询结果动态决定是否轮询
    refetchInterval: enableSmartPolling
      ? (query) => {
          const docs = query.state.data?.docs || []
          const hasParsingDocs = docs.some(
            (doc) => doc.run === TaskStatus.RUNNING,
          )
          return hasParsingDocs ? pollingInterval : false
        }
      : false,
    // 使用 placeholderData 防止轮询时闪烁
    placeholderData: (previousData) => previousData,
  })

  return {
    documents: data?.docs ?? [],
    total: data?.total ?? 0,
    // isPending: 首次加载（没有数据时），用于显示骨架屏/空状态
    // isFetching: 任何请求进行中（包括轮询），用于显示加载指示器
    isLoading: isPending, // 首次加载状态，不会因轮询而闪烁
    isFetching, // 任何加载状态（可选用于显示小的加载指示器）
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
      const response = await knowledgeAPI.document.upload(
        kbId,
        params.files,
        params.options,
      )
      return { knowledgeBaseId: kbId, documents: response }
    },
    onSuccess: ({ knowledgeBaseId: kbId }) => {
      queryClient.invalidateQueries({
        queryKey: documentKeys.lists(),
        predicate: (query) => {
          const key = query.queryKey as string[]
          return key[0] === 'documents' && key[1] === 'list' && key[2] === kbId
        },
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
// TODO(2026-08-01): datasetId 可选是兼容期设计，随 knowledge-rest 的回退分支一起
// 收紧为必填。
export const useDeleteDocument = (datasetId?: string) => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (documentIds: string | string[]) => {
      const ids = Array.isArray(documentIds) ? documentIds : [documentIds]
      await knowledgeAPI.document.delete(ids, datasetId)
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
      status: '0' | '1'
    }) => {
      await knowledgeAPI.document.updateStatus(
        params.documentIds,
        params.status,
      )
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
      const response = await knowledgeAPI.document.getChunks(documentId, {
        page,
        page_size,
      })
      return response
    },
    enabled: !!documentId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    chunks: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 获取文档筛选选项
export const useFetchDocumentFilter = (knowledgeBaseId?: string) => {
  const routeKbId = useKnowledgeBaseIdFromRoute()
  const kbId = knowledgeBaseId || routeKbId

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: documentKeys.filter(kbId),
    queryFn: async () => {
      const response = await knowledgeAPI.document.getFilter(kbId)
      return response.filter
    },
    enabled: !!kbId,
    staleTime: 60 * 1000, // 1分钟缓存
    gcTime: 5 * 60 * 1000,
  })

  return {
    filterOptions: data ?? null,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

// 运行/停止文档解析
export const useRunDocument = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: {
      docIds: string[]
      run: 0 | 1 | 2 // 0=停止, 1=开始, 2=取消
      deleteHistory?: boolean
    }) => {
      await knowledgeAPI.document.run(
        params.docIds,
        params.run,
        params.deleteHistory,
      )
      return params
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })

  return {
    runDocument: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 更改文档启用状态
export const useChangeDocumentStatus = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: { docIds: string[]; status: 0 | 1 }) => {
      const result = await knowledgeAPI.document.changeStatus({
        doc_ids: params.docIds,
        status: params.status,
      })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })

  return {
    changeStatus: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 重命名文档
export const useRenameDocument = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: { docId: string; name: string }) => {
      const result = await knowledgeAPI.document.rename(
        params.docId,
        params.name,
      )
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })

  return {
    renameDocument: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 下载文档
export const useDownloadDocument = () => {
  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: { docId: string; filename?: string }) => {
      await knowledgeAPI.document.download(params.docId, params.filename)
      return params
    },
  })

  return {
    downloadDocument: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}

// 更新文档解析器配置 - 使用 RAGFlow 的 change_parser API
export const useUpdateDocumentParser = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (params: {
      docId: string
      parserId: string
      parserConfig?: Record<string, any>
    }) => {
      await knowledgeAPI.document.changeParser({
        doc_id: params.docId,
        parser_id: params.parserId,
        parser_config: params.parserConfig,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })

  return {
    updateDocumentParser: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}
