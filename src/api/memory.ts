/**
 * 记忆库 API 接口层
 * 对接后端 api/apps/sdk/memories.py 和 api/apps/sdk/messages.py
 *
 * 后端路由前缀为 /api/v1（SDK 路径），使用 baseURL override 实现：
 *   apiClient 的 baseURL 设为 API_BASE_URL，请求时传 { baseURL: `${API_BASE_URL}/api` }
 *   最终 URL = API_BASE_URL/api/v1/<endpoint>
 */

import { apiClient } from './client'
import type {
  MemoryMaintenanceJob,
  MemoryMaintenanceCandidate,
  MemoryMaintenanceCommand,
  MemoryCandidateReview,
  MemoryCandidatePublication,
  MemoryMaintenancePublication,
} from '@/types/memory-dreaming'
import type {
  MemoryCapabilities,
  MemoryEntry,
  MemoryRevisionPage,
  MemoryRevisionCommand,
  MemoryRevisionPreview,
  MemoryOperation,
  MemoryOperationPage,
  MemorySourceState,
  MemoryAppendCommand,
  MemoryAppendOperation,
} from '@/types/memory-revisions'
import { collectListWindow, isLargeListWindow } from './list-pagination'
import { API_BASE_URL } from '@/constants'
import type {
  Memory,
  CreateMemoryParams,
  UpdateMemoryParams,
  MemoryListParams,
  MemoryListResponse,
  MessageListResponse,
  MessageContentResponse,
  MemoryMessage,
  MemoryMessagesDetailResponse,
} from '@/types/memory'

/** apiClient 的 baseURL 覆盖，使请求走 /api/v1/... */
const sdkBase = { baseURL: `${API_BASE_URL}/api` }

type SdkEnvelope<T> = {
  retcode?: number
  retmsg?: string
  data?: T
}

function unwrapSdkEnvelope<T>(response: T | SdkEnvelope<T>): T {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    ('retcode' in response || 'retmsg' in response)
  ) {
    return (response as SdkEnvelope<T>).data as T
  }
  return response as T
}

export function createMemoryRevisionAPI(
  baseURL = API_BASE_URL,
  client = apiClient,
) {
  const sdkBase = { baseURL: `${baseURL}/api` }
  return {
    append: (
      memoryId: string,
      command: MemoryAppendCommand,
    ): Promise<MemoryAppendOperation> =>
      client.post(
        `/memories/${encodeURIComponent(memoryId)}/messages`,
        command,
        sdkBase,
      ),
    capabilities: (
      memoryId: string,
      signal?: AbortSignal,
    ): Promise<MemoryCapabilities> =>
      client.get(`/memories/${encodeURIComponent(memoryId)}/capabilities`, {
        ...sdkBase,
        signal,
      }),
    findEntry: (
      memoryId: string,
      messageId: string,
      signal?: AbortSignal,
    ): Promise<MemoryEntry | null> =>
      client.get(
        `/memories/${encodeURIComponent(memoryId)}/messages/${encodeURIComponent(messageId)}/entry`,
        { ...sdkBase, signal },
      ),
    adoptEntry: (
      memoryId: string,
      operationId: string,
      messageId: string,
    ): Promise<MemoryOperation> =>
      client.post(
        `/memories/${encodeURIComponent(memoryId)}/entries`,
        { operation_id: operationId, legacy_message_id: messageId },
        sdkBase,
      ),
    getEntry: (
      memoryId: string,
      entryId: string,
      signal?: AbortSignal,
    ): Promise<MemoryEntry> =>
      client.get(
        `/memories/${encodeURIComponent(memoryId)}/entries/${encodeURIComponent(entryId)}`,
        { ...sdkBase, signal },
      ),
    history: (
      memoryId: string,
      entryId: string,
      cursor?: string,
      signal?: AbortSignal,
    ): Promise<MemoryRevisionPage> =>
      client.get(
        `/memories/${encodeURIComponent(memoryId)}/entries/${encodeURIComponent(entryId)}/revisions`,
        { ...sdkBase, signal, params: { limit: 20, cursor } },
      ),
    revise: (
      memoryId: string,
      entryId: string,
      command: MemoryRevisionCommand,
    ): Promise<MemoryRevisionPreview | MemoryOperation> =>
      client.post(
        `/memories/${encodeURIComponent(memoryId)}/entries/${encodeURIComponent(entryId)}/revisions`,
        command,
        sdkBase,
      ),
    operation: (
      memoryId: string,
      operationId: string,
      signal?: AbortSignal,
    ): Promise<MemoryOperation> =>
      client.get(
        `/memories/${encodeURIComponent(memoryId)}/operations/${encodeURIComponent(operationId)}`,
        { ...sdkBase, signal },
      ),
    operations: (
      memoryId: string,
      params: { view: 'pending' | 'all'; limit: number; cursor?: string },
      signal?: AbortSignal,
    ): Promise<MemoryOperationPage> =>
      client.get(`/memories/${encodeURIComponent(memoryId)}/operations`, {
        ...sdkBase,
        signal,
        params,
      }),
    reconcile: (
      memoryId: string,
      operationId: string,
    ): Promise<MemoryOperation> =>
      client.post(
        `/memories/${encodeURIComponent(memoryId)}/operations/${encodeURIComponent(operationId)}/reconciliations`,
        {},
        sdkBase,
      ),
    deleteBank: (
      memoryId: string,
      operationId: string,
    ): Promise<MemoryOperation> =>
      client.post(
        `/memories/${encodeURIComponent(memoryId)}/deletions`,
        { operation_id: operationId },
        sdkBase,
      ),
    source: (
      memoryId: string,
      sourceId: string,
      signal?: AbortSignal,
    ): Promise<MemorySourceState> =>
      client.get(
        `/memories/${encodeURIComponent(memoryId)}/sources/${encodeURIComponent(sourceId)}/state`,
        { ...sdkBase, signal },
      ),
    adoptSource: (
      memoryId: string,
      sourceId: string,
      operationId: string,
      hash: string,
    ): Promise<MemoryOperation> =>
      client.post(
        `/memories/${encodeURIComponent(memoryId)}/sources/${encodeURIComponent(sourceId)}/adoptions`,
        { operation_id: operationId, expected_content_sha256: hash },
        sdkBase,
      ),
    withdraw: (
      memoryId: string,
      sourceId: string,
      operationId: string,
      revision: number,
      reason: string,
    ): Promise<MemoryOperation> =>
      client.post(
        `/memories/${encodeURIComponent(memoryId)}/sources/${encodeURIComponent(sourceId)}/withdrawals`,
        {
          operation_id: operationId,
          expected_source_revision: revision,
          reason,
        },
        sdkBase,
      ),
  }
}

export function createMemoryDreamingAPI(
  baseURL = API_BASE_URL,
  client = apiClient,
) {
  const sdkBase = { baseURL: `${baseURL}/api` }
  const path = (memoryId: string, jobId?: string) =>
    `/memories/${encodeURIComponent(memoryId)}/maintenance-jobs${jobId ? `/${encodeURIComponent(jobId)}` : ''}`
  return {
    create: (
      memoryId: string,
      command: MemoryMaintenanceCommand,
    ): Promise<MemoryMaintenanceJob> =>
      client.post(path(memoryId), command, sdkBase),
    list: (
      memoryId: string,
      signal?: AbortSignal,
    ): Promise<{ jobs: MemoryMaintenanceJob[] }> =>
      client.get(path(memoryId), { ...sdkBase, signal, params: { limit: 20 } }),
    job: (
      memoryId: string,
      jobId: string,
      signal?: AbortSignal,
    ): Promise<MemoryMaintenanceJob> =>
      client.get(path(memoryId, jobId), { ...sdkBase, signal }),
    candidates: (
      memoryId: string,
      jobId: string,
      signal?: AbortSignal,
    ): Promise<{ candidates: MemoryMaintenanceCandidate[] }> =>
      client.get(`${path(memoryId, jobId)}/candidates`, { ...sdkBase, signal }),
    run: (
      memoryId: string,
      jobId: string,
      operationId: string,
    ): Promise<MemoryMaintenanceJob> =>
      client.post(
        `${path(memoryId, jobId)}/runs`,
        { operation_id: operationId },
        sdkBase,
      ),
    review: (
      memoryId: string,
      jobId: string,
      candidateId: string,
      command: MemoryCandidateReview,
    ): Promise<MemoryMaintenanceCandidate> =>
      client.post(
        `${path(memoryId, jobId)}/candidates/${encodeURIComponent(candidateId)}/reviews`,
        command,
        sdkBase,
      ),
    publish: (
      memoryId: string,
      jobId: string,
      command: MemoryCandidatePublication,
    ): Promise<MemoryMaintenancePublication> =>
      client.post(`${path(memoryId, jobId)}/publications`, command, sdkBase),
    cancel: (
      memoryId: string,
      jobId: string,
      operationId: string,
    ): Promise<MemoryMaintenanceJob> =>
      client.post(
        `${path(memoryId, jobId)}/cancellations`,
        { operation_id: operationId },
        sdkBase,
      ),
  }
}

export const memoryAPI = {
  revision: createMemoryRevisionAPI(),
  dreaming: createMemoryDreamingAPI(),
  // ============ 记忆库管理 ============
  // 后端路由: api/apps/sdk/memories.py，前缀 /api/v1
  memory: {
    /**
     * 获取记忆库列表
     * GET /api/v1/memories
     */
    list: (
      params?: MemoryListParams,
      signal?: AbortSignal,
    ): Promise<MemoryListResponse> => {
      if (isLargeListWindow(params))
        return collectListWindow<
          MemoryListResponse & { total: number },
          'memory_list'
        >(
          params!,
          async (page) => {
            const result = await memoryAPI.memory.list(
              { ...params, ...page },
              signal,
            )
            return { ...result, total: result.total_count }
          },
          'memory_list',
          signal,
        )
      const queryParams = new URLSearchParams()

      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.page_size)
        queryParams.set('page_size', params.page_size.toString())
      if (params?.keywords) queryParams.set('keywords', params.keywords)
      if (params?.storage_type)
        queryParams.set('storage_type', params.storage_type)

      if (params?.memory_type?.length) {
        params.memory_type.forEach((type) =>
          queryParams.append('memory_type', type),
        )
      }
      if (params?.tenant_id?.length) {
        params.tenant_id.forEach((id) => queryParams.append('tenant_id', id))
      }

      const qs = queryParams.toString()
      return apiClient.get(`/memories${qs ? `?${qs}` : ''}`, {
        ...sdkBase,
        signal,
      })
    },

    /**
     * 获取记忆库配置
     * GET /api/v1/memories/{id}/config
     */
    get: (id: string): Promise<Memory> =>
      apiClient.get(`/memories/${id}/config`, sdkBase),

    getConfig: (id: string): Promise<Memory> =>
      apiClient.get(`/memories/${id}/config`, sdkBase),

    /**
     * 获取记忆库详情及消息列表
     * GET /api/v1/memories/{id}
     */
    getDetail: (
      id: string,
      params?: {
        agent_id?: string[]
        keywords?: string
        page?: number
        page_size?: number
      },
    ): Promise<MemoryMessagesDetailResponse> => {
      const queryParams = new URLSearchParams()
      if (params?.keywords) queryParams.set('keywords', params.keywords)
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.page_size)
        queryParams.set('page_size', params.page_size.toString())
      if (params?.agent_id?.length) {
        params.agent_id.forEach((id) => queryParams.append('agent_id', id))
      }
      const qs = queryParams.toString()
      return apiClient.get(`/memories/${id}${qs ? `?${qs}` : ''}`, sdkBase)
    },

    /**
     * 创建记忆库
     * POST /api/v1/memories
     */
    create: (data: CreateMemoryParams): Promise<Memory> =>
      apiClient.post('/memories', data, sdkBase),

    /**
     * 更新记忆库
     * PUT /api/v1/memories/{id}
     */
    update: (id: string, data: UpdateMemoryParams): Promise<Memory> =>
      apiClient.put(`/memories/${id}`, data, sdkBase),

    /**
     * 删除记忆库
     * DELETE /api/v1/memories/{id}
     */
    delete: (id: string): Promise<void> =>
      apiClient.delete(`/memories/${id}`, sdkBase),
  },

  // ============ 记忆消息管理 ============
  // 后端路由: api/apps/sdk/messages.py，前缀 /api/v1
  message: {
    /**
     * 获取最近消息列表
     * GET /api/v1/messages?memory_id=...&agent_id=...&session_id=...&limit=...
     */
    list: (params: {
      memory_id: string | string[]
      agent_id?: string
      session_id?: string
      limit?: number
    }): Promise<MessageListResponse> => {
      const queryParams = new URLSearchParams()
      const ids = Array.isArray(params.memory_id)
        ? params.memory_id
        : [params.memory_id]
      ids.forEach((id) => queryParams.append('memory_id', id))
      if (params.agent_id) queryParams.set('agent_id', params.agent_id)
      if (params.session_id) queryParams.set('session_id', params.session_id)
      if (params.limit) queryParams.set('limit', params.limit.toString())
      return apiClient.get(`/messages?${queryParams.toString()}`, sdkBase)
    },

    /**
     * 搜索消息
     * GET /api/v1/messages/search
     */
    search: async (
      params: {
        memory_id: string[]
        query: string
        similarity_threshold?: number
        keywords_similarity_weight?: number
        top_n?: number
        agent_id?: string
        session_id?: string
      },
      signal?: AbortSignal,
    ): Promise<MemoryMessage[]> => {
      const queryParams = new URLSearchParams()
      params.memory_id.forEach((id) => queryParams.append('memory_id', id))
      queryParams.set('query', params.query)
      if (params.similarity_threshold !== undefined)
        queryParams.set(
          'similarity_threshold',
          params.similarity_threshold.toString(),
        )
      if (params.keywords_similarity_weight !== undefined)
        queryParams.set(
          'keywords_similarity_weight',
          params.keywords_similarity_weight.toString(),
        )
      if (params.top_n !== undefined)
        queryParams.set('top_n', params.top_n.toString())
      if (params.agent_id) queryParams.set('agent_id', params.agent_id)
      if (params.session_id) queryParams.set('session_id', params.session_id)
      const response = await apiClient.get<
        MemoryMessage[] | SdkEnvelope<MemoryMessage[]>
      >(`/messages/search?${queryParams.toString()}`, { ...sdkBase, signal })
      return unwrapSdkEnvelope(response)
    },

    /**
     * 获取消息内容
     * GET /api/v1/messages/{memory_id}:{message_id}/content
     */
    getContent: async (
      memoryId: string,
      messageId: string | number,
    ): Promise<MessageContentResponse> => {
      const response = await apiClient.get<
        MessageContentResponse | SdkEnvelope<MessageContentResponse>
      >(`/messages/${memoryId}:${messageId}/content`, sdkBase)
      return unwrapSdkEnvelope(response)
    },

    /**
     * 更新消息状态（启用/禁用）
     * PUT /api/v1/messages/{memory_id}:{message_id}
     */
    updateState: (
      memoryId: string,
      messageId: string | number,
      status: boolean,
    ): Promise<void> =>
      apiClient.put(`/messages/${memoryId}:${messageId}`, { status }, sdkBase),

    /**
     * 遗忘消息（软删除）
     * DELETE /api/v1/messages/{memory_id}:{message_id}
     */
    forget: (memoryId: string, messageId: string | number): Promise<void> =>
      apiClient.delete(`/messages/${memoryId}:${messageId}`, sdkBase),

    /**
     * 添加消息到记忆
     * POST /api/v1/messages
     */
    add: (data: {
      memory_id: string | string[]
      agent_id: string
      session_id: string
      user_input: string
      agent_response: string
      user_id?: string
    }): Promise<void> => apiClient.post('/messages', data, sdkBase),
  },
}

export default memoryAPI
