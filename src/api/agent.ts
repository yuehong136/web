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
    
    console.log('🔍 请求Canvas列表:', url)
    const result = await apiClient.get<{ canvas: IFlow[]; total: number }>(url)
    console.log('📦 Canvas列表返回:', result)
    return result
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
    console.log('🔍 请求模版列表: /v1/canvas/templates')
    const result = await apiClient.get<IFlow[]>('/v1/canvas/templates')
    console.log('📦 模版API返回:', result)
    return result
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
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(`/v1/canvas/upload/${canvasId}`, formData)
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

  // 下载文件
  // 对应: GET /v1/canvas/download
  downloadFile: async (fileId: string, chunkId: string) => {
    const queryString = `?file_id=${fileId}&chunk_id=${chunkId}`
    return apiClient.get(`/v1/canvas/download${queryString}`)
  },
}

