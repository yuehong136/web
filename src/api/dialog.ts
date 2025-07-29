import { apiClient } from './client'
import type {
  DialogApp,
  RemoveDialogRequest,
  SetDialogRequest,
} from '../types/api'

export const dialogAPI = {
  // 获取对话应用列表
  list: (): Promise<DialogApp[]> =>
    apiClient.get('/dialog/list'),

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
}