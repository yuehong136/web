import { apiClient } from './client'
import { API_BASE_URL } from '@/constants'
import type { SearchApp, SearchAppListItem } from '@/types/search'
import type {
  CreateSearchRequest,
  ListSearchRequest,
  UpdateSearchRequest,
  RemoveSearchRequest,
} from '@/types'

const sdkBase = { baseURL: `${API_BASE_URL}/api` }

export const searchAPI = {
  // 获取搜索应用列表
  list: (
    params?: ListSearchRequest,
  ): Promise<{ search_apps: SearchAppListItem[]; total: number }> => {
    const queryParams = new URLSearchParams()
    queryParams.set('page', (params?.page ?? 1).toString())
    queryParams.set('page_size', (params?.page_size ?? 12).toString())
    queryParams.set('orderby', params?.orderby || 'update_time')
    queryParams.set('desc', (params?.desc ?? true).toString())
    if (params?.keywords) queryParams.set('keywords', params.keywords)
    params?.owner_ids?.forEach((ownerId) =>
      queryParams.append('owner_ids', ownerId),
    )

    return apiClient.get(`/searches?${queryParams.toString()}`, sdkBase)
  },

  // 获取搜索应用详情
  detail: (searchId: string): Promise<SearchApp> =>
    apiClient.get(`/searches/${searchId}`, sdkBase),

  // 创建搜索应用
  create: (data: CreateSearchRequest): Promise<{ search_id: string }> =>
    apiClient.post('/searches', data, sdkBase),

  // 更新搜索应用
  update: (data: UpdateSearchRequest): Promise<SearchApp> => {
    const { search_id, tenant_id, ...body } = data
    void tenant_id
    return apiClient.put(`/searches/${search_id}`, body, sdkBase)
  },

  // 删除搜索应用
  remove: (searchId: RemoveSearchRequest['search_id']): Promise<boolean> =>
    apiClient.delete(`/searches/${searchId}`, sdkBase),

  // 流式问答 (返回 fetch Response 用于 SSE 处理)
  askStream: (data: {
    question: string
    kb_ids: string[]
    search_id?: string
    signal?: AbortSignal
  }): Promise<Response> => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const token = localStorage.getItem('auth_token')
    return fetch(`${baseURL}/v1/conversation/ask`, {
      method: 'POST',
      signal: data.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        question: data.question,
        kb_ids: data.kb_ids,
        search_id: data.search_id,
      }),
    })
  },

  // 查询思维导图
  mindmap: (data: {
    question: string
    kb_ids: string[]
    search_id?: string
    doc_ids?: string[]
  }): Promise<unknown> =>
    apiClient.post('/v1/conversation/mindmap', {
      question: data.question,
      kb_ids: data.kb_ids,
      search_id: data.search_id,
      doc_ids: data.doc_ids,
    }),

  // 分享态查询思维导图（对齐 ragflow /searchbots/mindmap）
  mindmapShare: async (data: {
    question: string
    kb_ids: string[]
    search_id?: string
    signal?: AbortSignal
  }): Promise<unknown> => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const searchAuth =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('auth')
        : null
    const storedToken = localStorage.getItem('auth_token')
    const authorization = searchAuth
      ? `Bearer ${searchAuth}`
      : storedToken
        ? `Bearer ${storedToken}`
        : undefined

    const response = await fetch(`${baseURL}/api/v1/searchbots/mindmap`, {
      method: 'POST',
      signal: data.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { Authorization: authorization }),
      },
      body: JSON.stringify({
        question: data.question,
        kb_ids: data.kb_ids,
        search_id: data.search_id,
      }),
    })

    const raw = await response.json()
    const code = raw?.retcode ?? raw?.code ?? 0
    if (!response.ok || code !== 0) {
      throw new Error(raw?.retmsg || raw?.message || `HTTP ${response.status}`)
    }
    return raw?.data ?? null
  },
}
