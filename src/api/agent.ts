import { API_BASE_URL, STORAGE_KEYS } from '@/constants'
import { resolveCanvasCategory } from '@/lib/agent'
import { apiClient } from './client'
import type {
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
  DebugAgentNodePayload,
  RunAgentPayload,
  SetAgentPayload,
  UpdateAgentSettingsPayload,
} from '@/types/agent'

export const agentAPI = {
  externalApiBase: {
    baseURL: `${API_BASE_URL}/api`,
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
    const nextPayload = {
      id: payload.id,
      title: payload.title,
      description: payload.description,
      dsl:
        typeof payload.dsl === 'string' || payload.dsl === undefined
          ? payload.dsl
          : JSON.stringify(payload.dsl),
      canvas_category:
        payload.canvas_category ||
        resolveCanvasCategory(payload.canvas_type),
      avatar: payload.avatar,
      permission: payload.permission,
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

  uploadCanvasFileWithProgress: async (
    canvasId: string,
    file: File,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
  ) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

      xhr.open('POST', `${baseURL}/v1/canvas/upload/${canvasId}`)

      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
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

  downloadFile: async (fileId: string, chunkId: string) =>
    apiClient.get(`/v1/canvas/download`, {
      params: {
        file_id: fileId,
        chunk_id: chunkId,
      },
    }),
}
