import { apiClient } from './client'
import type { LLMModel, LLMType } from '../types/api'

export const llmAPI = {
  // 获取模型列表
  list: (params?: {
    mdl_type?: LLMType
    available?: boolean
  }): Promise<Record<string, LLMModel[]>> =>
    apiClient.get('/v1/llm/list', { params }),

  // 获取模型详情
  get: (modelId: string): Promise<LLMModel> =>
    apiClient.get(`/v1/llm/${modelId}`),

  // 添加模型
  add: (data: {
    name: string
    provider: string
    model_type: LLMType
    config: Record<string, any>
    is_active?: boolean
  }): Promise<LLMModel> =>
    apiClient.post('/v1/llm/add', data),

  // 更新模型
  update: (modelId: string, data: {
    name?: string
    config?: Record<string, any>
    is_active?: boolean
  }): Promise<LLMModel> =>
    apiClient.put(`/v1/llm/${modelId}`, data),

  // 删除模型
  delete: (modelId: string): Promise<void> =>
    apiClient.delete(`/v1/llm/${modelId}`),

  // 测试模型连接
  test: (modelId: string): Promise<{ success: boolean; message?: string }> =>
    apiClient.post(`/v1/llm/${modelId}/test`),
}