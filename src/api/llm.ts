import { apiClient } from './client'
import { LLMFactory } from '@/stores/model'
import type { LLMModel, LLMType } from '@/types/api'

// set_api_key / add_llm 的后端响应（verify 模式下携带校验结果）
interface LLMVerifyResponse {
  success?: boolean
  message?: string
}

export const llmAPI = {
  // 获取模型列表
  list: (params?: {
    mdl_type?: LLMType
    available?: boolean
  }): Promise<Record<string, LLMModel[]>> =>
    apiClient.get('/v1/llm/my_llms', { params }),

  // 别名：getMyLLMs -> list
  getMyLLMs: (params?: {
    mdl_type?: LLMType
    available?: boolean
  }): Promise<Record<string, LLMModel[]>> => llmAPI.list(params),

  // 获取模型工厂列表
  getFactories: (): Promise<any> => apiClient.get('/v1/llm/factories'),

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
  }): Promise<LLMModel> => apiClient.post('/v1/llm/add', data),

  // 添加本地模型（Ollama / Xinference 等）：POST /llm/add_llm，verify 模式返回校验结果
  addLLM: (
    params: Record<string, any>,
    verify = false,
  ): Promise<LLMVerifyResponse> =>
    apiClient.post('/v1/llm/add_llm', { ...params, verify }),

  // 设置 API Key（云服务厂商）：POST /llm/set_api_key
  // 字段用 llm_factory（非 provider）；SILICONFLOW 依 base_url 选模型源；verify 模式返回校验结果
  setApiKey: (
    llmFactory: string,
    apiKey: string,
    baseUrl?: string,
    additionalParams?: Record<string, any>,
    verify = false,
  ): Promise<LLMVerifyResponse> => {
    const requestData: Record<string, any> = {
      llm_factory: llmFactory,
      api_key: apiKey,
      verify,
      ...additionalParams,
    }
    if (baseUrl) {
      requestData.base_url = baseUrl
    }
    if (llmFactory === LLMFactory.SILICONFLOW) {
      requestData.source_fid = (baseUrl || '')
        .toLowerCase()
        .includes('api.siliconflow.com')
        ? 'siliconflow_intl'
        : LLMFactory.SILICONFLOW
    }
    return apiClient.post('/v1/llm/set_api_key', requestData)
  },

  // 启用/禁用指定模型：POST /llm/enable_llm
  enableLlm: (
    llmFactory: string,
    llmName: string,
    enabled: boolean,
  ): Promise<void> =>
    apiClient.post('/v1/llm/enable_llm', {
      llm_factory: llmFactory,
      llm_name: llmName,
      status: enabled ? '1' : '0',
    }),

  // 更新模型
  update: (
    modelId: string,
    data: {
      name?: string
      config?: Record<string, any>
      is_active?: boolean
    },
  ): Promise<LLMModel> => apiClient.put(`/v1/llm/${modelId}`, data),

  // 删除模型
  delete: (modelId: string): Promise<void> =>
    apiClient.delete(`/v1/llm/${modelId}`),

  // 删除模型供应商：POST /llm/delete_factory（传 llm_factory）
  deleteFactory: (llmFactory: string): Promise<void> =>
    apiClient.post('/v1/llm/delete_factory', { llm_factory: llmFactory }),

  // 测试模型连接
  test: (modelId: string): Promise<{ success: boolean; message?: string }> =>
    apiClient.post(`/v1/llm/${modelId}/test`),
}
