import { STORAGE_KEYS } from '@/constants'
import { resolveCanvasCategory } from '@/lib/agent'
import { apiClient } from './client'
import type {
  AgentCanvasUploadResult,
  AgentExternalInputs,
  AgentFlow,
  AgentInputFormSchema,
  AgentListParams,
  AgentListResponse,
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
  RunAgentPayload,
  SetAgentPayload,
  UpdateAgentSettingsPayload,
} from '@/types/agent'

const EXTERNAL_API_BASE_URL = '/api'

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
    if (params.keywords || params.name) query.keywords = params.keywords || params.name || ''
    if (params.canvas_category) {
      query.canvas_category = params.canvas_category
    } else if (params.canvas_type) {
      query.canvas_category = resolveCanvasCategory(params.canvas_type)
    }

    return apiClient.get<AgentListResponse>('/v1/canvas/list', {
      params: query,
    })
  },

  fetchAgent: async (id: string) => apiClient.get<AgentFlow>(`/v1/canvas/get/${id}`),

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

    return apiClient.post<AgentFlow>('/v1/canvas/set', nextPayload)
  },

  deleteAgent: async (id: string) =>
    apiClient.post('/v1/canvas/rm', {
      canvas_ids: [id],
    }),

  runAgent: async (
    payload: RunAgentPayload,
    options?: {
      signal?: AbortSignal
    },
  ) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    const response = await fetch(`${baseURL}/v1/canvas/completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        id: payload.id,
        query: payload.query || '',
        session_id: payload.session_id,
        files: payload.files || [],
        inputs: payload.inputs || {},
        ...(payload.release !== undefined ? { release: payload.release } : {}),
        ...(payload.user_id ? { user_id: payload.user_id } : {}),
      }),
      signal: options?.signal,
    })

    return response
  },

  resetAgent: async (id: string) => apiClient.post('/v1/canvas/reset', { id }),

  debugNode: async (payload: DebugAgentNodePayload) =>
    apiClient.post('/v1/canvas/debug', {
      id: payload.canvas_id,
      component_id: payload.component_id,
      params: payload.inputs || {},
    }),

  debugSingle: async (payload: DebugAgentNodePayload) =>
    apiClient.post('/v1/canvas/debug', {
      id: payload.canvas_id,
      component_id: payload.component_id,
      params: payload.inputs || {},
    }),

  fetchVersions: async (id: string) =>
    apiClient.get<AgentVersionSummary[]>(`/v1/canvas/getlistversion/${id}`),

  fetchVersion: async (versionId: string) =>
    apiClient.get<AgentFlow>(`/v1/canvas/getversion/${versionId}`),

  fetchTrace: async (canvasId: string, messageId: string) =>
    apiClient.get<AgentTraceItem[]>(`/v1/canvas/trace`, {
      params: {
        canvas_id: canvasId,
        message_id: messageId,
      },
    }),

  fetchTemplates: async () =>
    apiClient.get<AgentTemplate[]>('/v1/canvas/templates'),

  fetchPrompt: async () =>
    apiClient.get<Record<string, string>>('/v1/canvas/prompts'),

  updateSetting: async (payload: UpdateAgentSettingsPayload) =>
    apiClient.post('/v1/canvas/setting', payload),

  testDbConnect: async (payload: Record<string, unknown>) =>
    apiClient.post('/v1/canvas/test_db_connect', payload),

  uploadFile: async (canvasId: string, file: File) =>
    apiClient.upload(`/v1/canvas/upload/${canvasId}`, file),

  fetchCanvasSSE: async (canvasId: string) =>
    apiClient.get<AgentFlow>(`/v1/canvas/getsse/${canvasId}`),

  fetchAgentAvatar: async (canvasId: string) =>
    apiClient.get<AgentFlow>(`/v1/canvas/getsse/${canvasId}`),

  fetchSessions: async (canvasId: string) =>
    apiClient.get<AgentSessionListResponse | AgentSession[]>(`/v1/canvas/${canvasId}/sessions`),

  fetchSession: async (canvasId: string, sessionId: string) =>
    apiClient.get<AgentSession>(`/v1/canvas/${canvasId}/sessions/${sessionId}`),

  createSession: async (canvasId: string, name: string) =>
    apiClient.put<AgentSession>(`/v1/canvas/${canvasId}/sessions`, { name }),

  deleteSession: async (canvasId: string, sessionId: string) =>
    apiClient.delete(`/v1/canvas/${canvasId}/sessions/${sessionId}`),

  cancelTask: async (taskId: string) =>
    apiClient.put(`/v1/canvas/cancel/${taskId}`),

  cancelDataflow: async (taskId: string) =>
    apiClient.put(`/v1/canvas/cancel/${taskId}`),

  inputForm: async (canvasId: string, componentId: string) =>
    apiClient.get<AgentInputFormSchema>(`/v1/canvas/input_form`, {
      params: {
        id: canvasId,
        component_id: componentId,
      },
    }),

  fetchExternalAgentInputs: async (canvasId: string, betaToken: string) =>
    apiClient.get<AgentExternalInputs>(
      `/agentbots/${canvasId}/inputs`,
      {
        ...agentAPI.externalApiBase,
        skipAuth: true,
        headers: {
          Authorization: `Bearer ${betaToken}`,
        },
      },
    ),

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
        options?.baseURL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

      xhr.open('POST', `${baseURL}/v1/canvas/upload/${canvasId}`)

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
            reject(new Error(response.message || response.retmsg || 'Upload failed'))
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
            formData.append(key, value instanceof Blob ? value : String(value ?? ''))
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
    apiClient.get<AgentWebhookTraceResponse>(
      `/webhook_trace/${canvasId}`,
      {
        ...agentAPI.externalApiBase,
        skipAuth: true,
        params: payload,
      },
    ),

  downloadFile: async (fileId: string, chunkId: string) =>
    apiClient.get(`/v1/canvas/download`, {
      params: {
        file_id: fileId,
        chunk_id: chunkId,
      },
    }),
}
