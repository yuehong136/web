import { apiClient } from './client'
import { API_BASE_URL, STORAGE_KEYS } from '@/constants'
import type {
  DialogApp,
  DialogImportResult,
  RemoveDialogRequest,
  SetDialogRequest,
} from '@/types/api'

// Dialog 列表请求参数（与 ragflow 保持一致）
export interface DialogListParams {
  keywords?: string
  page?: number
  page_size?: number
}

// Dialog 列表响应（与 ragflow 保持一致）
export interface DialogListResponse {
  dialogs: DialogApp[]
  total: number
}

export const dialogAPI = {
  // 获取对话应用列表 (使用 next 接口，与 ragflow 保持一致)
  // POST /dialog/next?keywords=xxx&page=1&page_size=30
  // Body: { owner_ids: [] }
  list: (params?: DialogListParams): Promise<DialogListResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.keywords) searchParams.set('keywords', params.keywords)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString())
    
    const queryString = searchParams.toString()
    const url = queryString ? `/dialog/next?${queryString}` : '/dialog/next'
    
    // Body 传递 owner_ids（后端 ListDialogsRequest 需要）
    return apiClient.post(url, { owner_ids: [] })
  },

  // 兼容旧接口的简化调用（返回所有 dialogs）
  listAll: async (): Promise<DialogApp[]> => {
    const response = await apiClient.post(
      '/dialog/next?page=1&page_size=9999',
      { owner_ids: [] }
    ) as DialogListResponse
    return response.dialogs
  },

  // 删除对话应用
  remove: (dialogIds: string[]): Promise<boolean> =>
    apiClient.post('/dialog/rm', { dialog_ids: dialogIds } as RemoveDialogRequest),

  // 创建或更新对话应用
  set: (data: any): Promise<DialogApp> => {
    return apiClient.post('/dialog/set', data)
  },

  // 获取对话应用详情
  getDetail: (dialogId: string): Promise<DialogApp> =>
    apiClient.get(`/dialog/get?dialog_id=${dialogId}`),

  // 更新系统提示词
  updateSystemPrompt: async (dialogId: string, systemPrompt: string): Promise<DialogApp> => {
    // 首先获取当前对话配置
    const currentDialog = await apiClient.get(`/dialog/get?dialog_id=${dialogId}`)
    
    // 构建完整的更新请求
    const requestData: SetDialogRequest = {
      dialog_id: dialogId,
      name: currentDialog.name,
      description: currentDialog.description,
      icon: currentDialog.icon || '',
      prompt_config: {
        system: systemPrompt,
        prologue: currentDialog.prompt_config?.prologue || '您好，我是您的助手！',
        parameters: currentDialog.prompt_config?.parameters || [],
        empty_response: currentDialog.prompt_config?.empty_response || ''
      }
    }
    
    return apiClient.post('/dialog/set', requestData)
  },

  // 创建对话应用（如需要的话）
  create: (data: Partial<DialogApp>): Promise<DialogApp> =>
    apiClient.post('/dialog/create', data),

  // 更新对话应用（如需要的话）
  update: (dialogId: string, data: Partial<DialogApp>): Promise<DialogApp> =>
    apiClient.put(`/dialog/${dialogId}`, data),

  exportTemplates: async (dialogIds: string[]): Promise<void> => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    const ids = dialogIds.join(',')
    const response = await fetch(
      `${API_BASE_URL}/v1/dialog/export?dialog_ids=${encodeURIComponent(ids)}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    )

    if (!response.ok) {
      const text = await response.text()
      try {
        const json = JSON.parse(text)
        throw new Error(json.retmsg || json.message || `Export failed (${response.status})`)
      } catch {
        throw new Error(`Export failed (${response.status})`)
      }
    }

    const contentType = response.headers.get('content-type') || ''
    const disposition = response.headers.get('content-disposition') || ''
    let filename = 'template.json'

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;\s]+)/)
    const asciiMatch = disposition.match(/filename="([^"]+)"/) || disposition.match(/filename=([^;\s]+)/)
    if (utf8Match) {
      filename = decodeURIComponent(utf8Match[1])
    } else if (asciiMatch) {
      filename = asciiMatch[1]
    } else if (contentType.includes('application/zip')) {
      filename = 'dialog-templates.zip'
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  importTemplates: (file: File): Promise<DialogImportResult> =>
    apiClient.upload<DialogImportResult>('/dialog/import', file),
}