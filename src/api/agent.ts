import { apiClient } from './client'
import type {
  IFlow,
  IAgentListRequest,
  ISetAgentRequest,
  IRunAgentRequest,
  IDebugNodeRequest,
} from '@/pages/agent/types'

// Agent相关API - 对接后端 /v1/canvas/* 接口
export const agentAPI = {
  // 获取Canvas/Agent列表
  // 对应: GET /v1/canvas/list
  // 后端返回: { retcode, retmsg, data: { canvas: [], total: 0 } }
  // apiClient自动提取data字段，所以这里泛型是data的类型
  listAgents: async (params?: IAgentListRequest) => {
    const query = new URLSearchParams()
    if (params?.page !== undefined) query.append('page', String(params.page))
    if (params?.page_size) query.append('page_size', String(params.page_size))
    if (params?.orderby) query.append('orderby', params.orderby)
    if (params?.desc !== undefined) query.append('desc', String(params.desc))
    if (params?.name) query.append('keywords', params.name)
    if (params?.canvas_type) query.append('canvas_category', params.canvas_type)
    
    const queryString = query.toString()
    const url = `/v1/canvas/list${queryString ? '?' + queryString : ''}`
    
    return apiClient.get<{ canvas: IFlow[]; total: number }>(url)
  },

  // 获取Canvas详情
  // 对应: GET /v1/canvas/get/{canvas_id}
  fetchAgent: async (id: string) => {
    return apiClient.get<IFlow>(`/v1/canvas/get/${id}`)
  },

  // 创建或更新Canvas
  // 对应: POST /v1/canvas/set
  setAgent: async (data: ISetAgentRequest) => {
    return apiClient.post<IFlow>('/v1/canvas/set', {
      id: data.id,
      title: data.title,
      description: data.description,
      dsl: typeof data.dsl === 'string' ? data.dsl : JSON.stringify(data.dsl),
      canvas_category: data.canvas_type === 'pipeline' ? 'Ingestion' : 'Agent',
      avatar: data.avatar,
    })
  },

  // 删除Canvas
  // 对应: POST /v1/canvas/rm
  deleteAgent: async (id: string) => {
    return apiClient.post('/v1/canvas/rm', {
      canvas_ids: [id]
    })
  },

  // 执行Canvas (SSE)
  // 对应: POST /v1/canvas/completion
  runAgent: async (data: IRunAgentRequest) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const token = localStorage.getItem('auth_token')
    
    const response = await fetch(`${baseURL}/v1/canvas/completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        id: data.id,
        query: data.query || '',
        files: data.files || [],
        inputs: {},
      })
    })
    
    return response
  },

  // 重置Canvas执行状态
  // 对应: POST /v1/canvas/reset
  resetAgent: async (id: string) => {
    return apiClient.post('/v1/canvas/reset', { id })
  },

  // 单节点调试
  // 对应: POST /v1/canvas/debug
  debugNode: async (data: IDebugNodeRequest) => {
    return apiClient.post('/v1/canvas/debug', {
      id: data.canvas_id,
      component_id: data.component_id,
      params: data.inputs || {},
    })
  },

  // 获取版本列表
  // 对应: GET /v1/canvas/getlistversion/{canvas_id}
  fetchVersions: async (id: string) => {
    return apiClient.get(`/v1/canvas/getlistversion/${id}`)
  },

  // 获取特定版本
  // 对应: GET /v1/canvas/getversion/{version_id}
  fetchVersion: async (versionId: string) => {
    return apiClient.get(`/v1/canvas/getversion/${versionId}`)
  },

  // 获取执行日志/追踪
  // 对应: GET /v1/canvas/trace
  fetchTrace: async (canvasId: string, messageId: string) => {
    const queryString = `?canvas_id=${canvasId}&message_id=${messageId}`
    return apiClient.get(`/v1/canvas/trace${queryString}`)
  },

  // 获取模版列表
  // 对应: GET /v1/canvas/templates
  // 后端返回: { retcode, retmsg, data: [...] }
  // apiClient自动提取data字段，所以这里泛型直接是IFlow[]
  fetchTemplates: async () => {
    return apiClient.get<IFlow[]>('/v1/canvas/templates')
  },

  // 更新Canvas设置（标题、描述等）
  // 对应: POST /v1/canvas/setting
  updateSetting: async (data: { id: string; title: string; description?: string; avatar?: string; permission?: string }) => {
    return apiClient.post('/v1/canvas/setting', data)
  },

  // 测试数据库连接（用于ExeSQL节点）
  // 对应: POST /v1/canvas/test_db_connect
  testDbConnect: async (data: {
    db_type: string
    database: string
    username: string
    host: string
    port: number
    password: string
  }) => {
    return apiClient.post('/v1/canvas/test_db_connect', data)
  },

  // 上传文件到Canvas
  // 对应: POST /v1/canvas/upload/{canvas_id}
  uploadFile: async (canvasId: string, file: File) => {
    return apiClient.upload(`/v1/canvas/upload/${canvasId}`, file)
  },

  // 获取Canvas SSE详情
  // 对应: GET /v1/canvas/getsse/{canvas_id}
  fetchCanvasSSE: async (canvasId: string) => {
    return apiClient.get(`/v1/canvas/getsse/${canvasId}`)
  },

  // 获取Agent头像或共享详情
  // 对应: GET /v1/canvas/getsse/{canvas_id}
  fetchAgentAvatar: async (canvasId: string) => {
    return apiClient.get(`/v1/canvas/getsse/${canvasId}`)
  },

  // 获取Canvas会话列表
  // 对应: GET /v1/canvas/{canvas_id}/sessions
  fetchSessions: async (canvasId: string) => {
    return apiClient.get(`/v1/canvas/${canvasId}/sessions`)
  },

  // 取消正在执行的任务
  // 对应: PUT /v1/canvas/cancel/{task_id}
  cancelTask: async (taskId: string) => {
    return apiClient.put(`/v1/canvas/cancel/${taskId}`)
  },

  // 取消Pipeline执行
  // 对应: PUT /v1/canvas/cancel/{task_id}
  cancelDataflow: async (taskId: string) => {
    return apiClient.put(`/v1/canvas/cancel/${taskId}`)
  },

  // 获取输入表单配置
  // 对应: GET /v1/canvas/input_form?id=xxx&component_id=xxx
  inputForm: async (canvasId: string, componentId: string) => {
    return apiClient.get(`/v1/canvas/input_form`, {
      params: {
        id: canvasId,
        component_id: componentId,
      },
    })
  },

  // 获取外部共享Agent输入
  // 对应: GET /v1/agentbots/{canvas_id}/inputs
  fetchExternalAgentInputs: async (canvasId: string) => {
    return apiClient.get(`/v1/agentbots/${canvasId}/inputs`)
  },

  // 带进度的Canvas文件上传
  // 对应: POST /v1/canvas/upload/{canvas_id}
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

      const token = localStorage.getItem('auth_token')
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress?.(progress)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.code === 0 || response.retcode === 0) {
              resolve(response.data)
            } else {
              reject(new Error(response.message || response.retmsg || 'Upload failed'))
            }
          } catch (e) {
            reject(new Error('Invalid response format'))
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
        }
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

  // 单节点调试（兼容RAGFlow接口）
  // 对应: POST /v1/canvas/debug
  debugSingle: async (data: IDebugNodeRequest) => {
    return apiClient.post('/v1/canvas/debug', {
      id: data.canvas_id,
      component_id: data.component_id,
      params: data.inputs || {},
    })
  },

  // 下载文件
  // 对应: GET /v1/canvas/download
  downloadFile: async (fileId: string, chunkId: string) => {
    const queryString = `?file_id=${fileId}&chunk_id=${chunkId}`
    return apiClient.get(`/v1/canvas/download${queryString}`)
  },
}
