import { API_BASE_URL, STORAGE_KEYS } from '@/constants'
import { resolveCanvasCategory } from '@/lib/agent'
import { apiClient } from './client'
import type {
  AgentCanvasUploadResult,
  AgentExternalInputs,
  AgentFlow,
  AgentInputFormSchema,
  AgentListParams,
  AgentListResponse,
  AgentSessionListParams,
  AgentSession,
  AgentSessionListResponse,
  AgentTemplate,
  AgentTraceItem,
  AgentVersionSummary,
  AgentWebhookTestRequest,
  AgentWebhookTraceRequest,
  AgentWebhookTraceResponse,
  DebugAgentNodePayload,
  ExternalAgentCompletionPayload,
  PersonDataItem,
  RunAgentPayload,
  SetAgentPayload,
  UpdateAgentSettingsPayload,
} from '@/types/agent'

const EXTERNAL_API_BASE_URL = '/api'
const restBase = { baseURL: `${API_BASE_URL}/api` }

const getRuntimeApiBaseUrl = () =>
  import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000'

const getAuthToken = () =>
  typeof localStorage === 'undefined'
    ? null
    : localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)

export function buildAgentSessionListQuery(
  params: AgentSessionListParams = {},
) {
  const query: Record<string, string | number | boolean> = {}

  if (params.page !== undefined) query.page = params.page
  if (params.page_size !== undefined) query.page_size = params.page_size
  if (params.keywords) query.keywords = params.keywords
  if (params.from_date) query.from_date = params.from_date
  if (params.to_date) query.to_date = params.to_date
  if (params.orderby) query.orderby = params.orderby
  if (params.desc !== undefined) query.desc = params.desc
  if (params.exp_user_id) query.exp_user_id = params.exp_user_id

  return query
}

export const agentAPI = {
  externalApiBase: {
    baseURL: EXTERNAL_API_BASE_URL,
  },

  listAgents: async (params: AgentListParams = {}) => {
    const query: Record<string, string | number | boolean> = {}

    if (params.page !== undefined) query.page = params.page
    if (params.page_size !== undefined) query.page_size = params.page_size
    if (params.orderby) query.orderby = params.orderby
    if (params.desc !== undefined) query.desc = params.desc
    if (params.keywords || params.name)
      query.keywords = params.keywords || params.name || ''
    if (params.canvas_category) {
      query.canvas_category = params.canvas_category
    } else if (params.canvas_type) {
      query.canvas_category = resolveCanvasCategory(params.canvas_type)
    }

    return apiClient.get<AgentListResponse>('/agents', {
      ...restBase,
      params: query,
    })
  },

  fetchAgent: async (id: string) =>
    apiClient.get<AgentFlow>(`/agents/${encodeURIComponent(id)}`, restBase),

  setAgent: async (payload: SetAgentPayload) => {
    const canvasCategory =
      payload.canvas_category ??
      (payload.canvas_type
        ? resolveCanvasCategory(payload.canvas_type)
        : undefined)

    const nextPayload: Record<string, unknown> = {
      id: payload.id,
      title: payload.title,
      description: payload.description,
      dsl:
        typeof payload.dsl === 'string' || payload.dsl === undefined
          ? payload.dsl
          : JSON.stringify(payload.dsl),
      avatar: payload.avatar,
      permission: payload.permission,
    }

    if (canvasCategory) {
      nextPayload.canvas_category = canvasCategory
    }

    if (payload.release !== undefined) {
      nextPayload.release = payload.release
    }

    if (payload.id) {
      delete nextPayload.id
      return apiClient.put<AgentFlow>(
        `/agents/${encodeURIComponent(payload.id)}`,
        nextPayload,
        restBase,
      )
    }

    return apiClient.post<AgentFlow>('/agents', nextPayload, restBase)
  },

  deleteAgent: async (id: string) =>
    apiClient.delete(`/agents/${encodeURIComponent(id)}`, restBase),

  runAgent: async (
    payload: RunAgentPayload,
    options?: {
      signal?: AbortSignal
    },
  ) => {
    const baseURL = getRuntimeApiBaseUrl()
    const token = getAuthToken()
    const response = await fetch(`${baseURL}/api/v1/agents/chat/completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        agent_id: payload.id,
        query: payload.query || '',
        session_id: payload.session_id,
        files: payload.files || [],
        inputs: payload.inputs || {},
        ...(payload.a2ui ? { a2ui: payload.a2ui } : {}),
        ...(payload.metadata ? { metadata: payload.metadata } : {}),
        ...(payload.release !== undefined ? { release: payload.release } : {}),
        ...(payload.user_id ? { user_id: payload.user_id } : {}),
      }),
      signal: options?.signal,
    })

    return response
  },

  runAgentSession: async (
    payload: RunAgentPayload,
    options?: {
      signal?: AbortSignal
    },
  ) => {
    const baseURL = getRuntimeApiBaseUrl()
    const token = getAuthToken()
    const response = await fetch(`${baseURL}/api/v1/agents/chat/completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        agent_id: payload.id,
        query: payload.query || '',
        session_id: payload.session_id,
        files: payload.files || [],
        inputs: payload.inputs || {},
        ...(payload.a2ui ? { a2ui: payload.a2ui } : {}),
        ...(payload.metadata ? { metadata: payload.metadata } : {}),
        ...(payload.release !== undefined ? { release: payload.release } : {}),
        ...(payload.user_id ? { user_id: payload.user_id } : {}),
      }),
      signal: options?.signal,
    })

    return response
  },

  resetAgent: async (id: string) =>
    apiClient.post(`/agents/${encodeURIComponent(id)}/reset`, {}, restBase),

  debugNode: async (payload: DebugAgentNodePayload) =>
    apiClient.post(
      `/agents/${encodeURIComponent(payload.canvas_id)}/components/${encodeURIComponent(payload.component_id)}/debug`,
      { params: payload.inputs || {} },
      restBase,
    ),

  debugSingle: async (payload: DebugAgentNodePayload) =>
    apiClient.post(
      `/agents/${encodeURIComponent(payload.canvas_id)}/components/${encodeURIComponent(payload.component_id)}/debug`,
      { params: payload.inputs || {} },
      restBase,
    ),

  fetchVersions: async (id: string) =>
    apiClient.get<AgentVersionSummary[]>(
      `/agents/${encodeURIComponent(id)}/versions`,
      restBase,
    ),

  fetchVersion: async (agentId: string, versionId: string) =>
    apiClient.get<AgentFlow>(
      `/agents/${encodeURIComponent(agentId)}/versions/${encodeURIComponent(versionId)}`,
      restBase,
    ),

  /**
   * Fetches the transient workflow trace stored under
   * `{canvas_id}-{message_id}-logs`.
   *
   * Backend constraint: trace lives in Redis only and has no frontend-visible
   * TTL contract. T8 therefore fetches it once after a terminal run/session is
   * available instead of polling indefinitely.
   */
  fetchTrace: async (canvasId: string, messageId: string) =>
    apiClient.get<AgentTraceItem[]>(
      `/agents/${encodeURIComponent(canvasId)}/logs/${encodeURIComponent(messageId)}`,
      restBase,
    ),

  fetchTemplates: async () =>
    apiClient.get<AgentTemplate[]>('/agents/templates', restBase),

  fetchPrompt: async () =>
    apiClient.get<Record<string, string>>('/agents/prompts', restBase),

  updateSetting: async (payload: UpdateAgentSettingsPayload) =>
    apiClient.put(
      `/agents/${encodeURIComponent(payload.id)}`,
      {
        title: payload.title,
        description: payload.description,
        avatar: payload.avatar,
        permission: payload.permission,
      },
      restBase,
    ),

  testDbConnect: async (payload: Record<string, unknown>) =>
    apiClient.post('/agents/test_db_connection', payload, restBase),

  uploadFile: async (canvasId: string, file: File | File[]) =>
    Array.isArray(file)
      ? apiClient.uploadRepeated(
          `/agents/${encodeURIComponent(canvasId)}/upload`,
          'file',
          file,
          undefined,
          restBase,
        )
      : apiClient.upload(
          `/agents/${encodeURIComponent(canvasId)}/upload`,
          file,
          undefined,
          restBase,
        ),

  uploadPublicFile: async (canvasId: string, file: File | File[]) =>
    Array.isArray(file)
      ? apiClient.uploadRepeated(
          `/agents/${encodeURIComponent(canvasId)}/upload`,
          'file',
          file,
          undefined,
          {
            skipAuth: true,
            baseURL: '/api',
          },
        )
      : apiClient.upload(
          `/agents/${encodeURIComponent(canvasId)}/upload`,
          file,
          undefined,
          {
            skipAuth: true,
            baseURL: '/api',
          },
        ),

  fetchCanvasSSE: async (canvasId: string) =>
    apiClient.get<AgentFlow>(
      `/agents/${encodeURIComponent(canvasId)}`,
      restBase,
    ),

  fetchAgentAvatar: async (canvasId: string) =>
    apiClient.get<AgentFlow>(
      `/agents/${encodeURIComponent(canvasId)}`,
      restBase,
    ),

  /**
   * Lists persisted `t_ai_api4conversations` rows for a canvas.
   *
   * Backend supports query params that T8 intentionally does not pass yet:
   * `page`, `page_size`, `keywords`, `from_date`, `to_date`, `orderby`, `desc`,
   * and `exp_user_id`. T9 owns Explore filtering, ordering, and pagination.
   */
  fetchSessions: async (
    canvasId: string,
    params: AgentSessionListParams = {},
  ) =>
    apiClient.get<AgentSessionListResponse | AgentSession[]>(
      `/agents/${encodeURIComponent(canvasId)}/sessions`,
      {
        ...restBase,
        params: buildAgentSessionListQuery(params),
      },
    ),

  fetchSession: async (canvasId: string, sessionId: string) =>
    apiClient.get<AgentSession>(
      `/agents/${encodeURIComponent(canvasId)}/sessions/${encodeURIComponent(sessionId)}`,
      restBase,
    ),

  createSession: async (canvasId: string, name: string) =>
    apiClient.post<AgentSession>(
      `/agents/${encodeURIComponent(canvasId)}/sessions`,
      { name },
      restBase,
    ),

  deleteSession: async (canvasId: string, sessionId: string) =>
    apiClient.delete(
      `/agents/${encodeURIComponent(canvasId)}/sessions/${encodeURIComponent(sessionId)}`,
      restBase,
    ),

  cancelTask: async (taskId: string) =>
    apiClient.put(`/v1/canvas/cancel/${taskId}`),

  cancelDataflow: async (taskId: string) =>
    apiClient.put(`/v1/canvas/cancel/${taskId}`),

  inputForm: async (canvasId: string, componentId: string) =>
    apiClient.get<AgentInputFormSchema>(
      `/agents/${encodeURIComponent(canvasId)}/components/${encodeURIComponent(componentId)}/input-form`,
      restBase,
    ),

  fetchExternalAgentInputs: async (canvasId: string, betaToken: string) =>
    apiClient.get<AgentExternalInputs>(`/agentbots/${canvasId}/inputs`, {
      ...agentAPI.externalApiBase,
      skipAuth: true,
      headers: {
        Authorization: `Bearer ${betaToken}`,
      },
    }),

  // Begin 节点 persondata 输入类型候选项（登录态）：GET /v1/datav/persondataList/{id}
  fetchPersonDataList: async (workflowId: string) =>
    apiClient.get<PersonDataItem[]>(`/v1/datav/persondataList/${workflowId}`),

  // 同上的分享/嵌入公开变体：GET /api/v1/agentbots/{id}/persondataList，beta token 鉴权
  fetchExternalPersonDataList: async (workflowId: string, betaToken: string) =>
    apiClient.get<PersonDataItem[]>(`/agentbots/${workflowId}/persondataList`, {
      ...agentAPI.externalApiBase,
      skipAuth: true,
      headers: {
        Authorization: `Bearer ${betaToken}`,
      },
    }),

  runExternalAgent: async (
    payload: ExternalAgentCompletionPayload,
    options?: {
      signal?: AbortSignal
    },
  ) => {
    const search = new URLSearchParams()
    if (payload.release !== undefined && payload.release !== false) {
      search.set('release', String(payload.release))
    }
    const queryString = search.toString()
    const response = await fetch(
      `${EXTERNAL_API_BASE_URL}/v1/agentbots/${payload.id}/completions${queryString ? `?${queryString}` : ''}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${payload.betaToken}`,
        },
        body: JSON.stringify({
          query: payload.query || '',
          inputs: payload.inputs || {},
          ...(payload.a2ui ? { a2ui: payload.a2ui } : {}),
          ...(payload.metadata ? { metadata: payload.metadata } : {}),
          files: payload.files || [],
          session_id: payload.session_id,
          ...(payload.release !== undefined
            ? { release: payload.release }
            : {}),
          ...(payload.user_id ? { user_id: payload.user_id } : {}),
        }),
        signal: options?.signal,
      },
    )

    return response
  },

  uploadCanvasFileWithProgress: async (
    canvasId: string,
    file: File,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
    options?: {
      skipAuth?: boolean
      baseURL?: string
    },
  ) => {
    return new Promise<AgentCanvasUploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const baseURL =
        options?.baseURL ??
        import.meta.env.VITE_API_BASE_URL ??
        'http://localhost:8000'

      xhr.open(
        'POST',
        `${baseURL}/api/v1/agents/${encodeURIComponent(canvasId)}/upload`,
      )

      const token = options?.skipAuth
        ? null
        : localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress?.(Math.round((event.loaded / event.total) * 100))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.code === 0 || response.retcode === 0) {
              resolve(response.data)
              return
            }
            reject(
              new Error(response.message || response.retmsg || 'Upload failed'),
            )
          } catch {
            reject(new Error('Invalid response format'))
          }
          return
        }

        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
      }

      xhr.onerror = () => reject(new Error('Network error'))
      xhr.ontimeout = () => reject(new Error('Upload timeout'))

      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort()
          reject(new Error('Upload cancelled'))
        })
      }

      const formData = new FormData()
      formData.append('file', file)
      xhr.send(formData)
    })
  },

  uploadPublicCanvasFileWithProgress: async (
    canvasId: string,
    file: File,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
  ) =>
    agentAPI.uploadCanvasFileWithProgress(canvasId, file, onProgress, signal, {
      skipAuth: true,
      baseURL: '',
    }),

  testWebhook: async ({
    canvasId,
    method,
    query,
    headers,
    body,
    contentType,
  }: AgentWebhookTestRequest) => {
    const search = new URLSearchParams()
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== '') {
        search.set(key, value)
      }
    })

    const requestHeaders: Record<string, string> = {
      ...(headers || {}),
    }

    let requestBody: BodyInit | undefined
    const upperMethod = method.toUpperCase()

    if (!['GET', 'HEAD'].includes(upperMethod)) {
      if (contentType === 'application/x-www-form-urlencoded') {
        const formBody = new URLSearchParams()
        Object.entries((body || {}) as Record<string, unknown>).forEach(
          ([key, value]) => {
            formBody.set(key, String(value ?? ''))
          },
        )
        requestBody = formBody
        requestHeaders['Content-Type'] = contentType
      } else if (contentType === 'text/plain') {
        requestBody =
          typeof body === 'string' ? body : JSON.stringify(body ?? {})
        requestHeaders['Content-Type'] = contentType
      } else if (contentType === 'multipart/form-data') {
        const formData = new FormData()
        Object.entries((body || {}) as Record<string, unknown>).forEach(
          ([key, value]) => {
            formData.append(
              key,
              value instanceof Blob ? value : String(value ?? ''),
            )
          },
        )
        requestBody = formData
      } else {
        requestBody = JSON.stringify(body || {})
        requestHeaders['Content-Type'] = contentType || 'application/json'
      }
    }

    return fetch(
      `${EXTERNAL_API_BASE_URL}/v1/webhook_test/${canvasId}${search.toString() ? `?${search.toString()}` : ''}`,
      {
        method: upperMethod,
        headers: requestHeaders,
        body: requestBody,
      },
    )
  },

  fetchWebhookTrace: async (
    canvasId: string,
    payload: AgentWebhookTraceRequest = {},
  ) =>
    apiClient.get<AgentWebhookTraceResponse>(`/webhook_trace/${canvasId}`, {
      ...agentAPI.externalApiBase,
      skipAuth: true,
      params: payload,
    }),

  downloadFile: async (fileId: string, createdBy: string) =>
    apiClient.get(`/agents/download`, {
      ...restBase,
      params: {
        id: fileId,
        created_by: createdBy,
      },
    }),
}
