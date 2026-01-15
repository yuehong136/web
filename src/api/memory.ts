/**
 * 记忆库 API 接口层
 * 对接后端 memory_app.py API 端点
 */

import { apiClient } from './client'
import type {
  Memory,
  CreateMemoryParams,
  UpdateMemoryParams,
  MemoryListParams,
  MessageListParams,
  MemoryListResponse,
  MessageListResponse,
  MessageContentResponse,
} from '@/types/memory'

/**
 * 后端 API 端点：
 * POST   /v1/memory              - 创建 Memory
 * GET    /v1/memory              - 获取 Memory 列表
 * PUT    /v1/memory/:id          - 更新 Memory
 * DELETE /v1/memory/:id          - 删除 Memory
 * GET    /v1/memory/:id/config   - 获取 Memory 配置
 */

export const memoryAPI = {
  // ============ 记忆库管理 ============
  memory: {
    /**
     * 获取记忆库列表
     * 后端 Query 参数: tenant_id[], memory_type[], storage_type, keywords, page, page_size
     */
    list: (params?: MemoryListParams): Promise<MemoryListResponse> => {
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.page_size) queryParams.set('page_size', params.page_size.toString())
      if (params?.keywords) queryParams.set('keywords', params.keywords)
      if (params?.storage_type) queryParams.set('storage_type', params.storage_type)
      
      // FastAPI Query 参数格式：数组使用多个同名参数
      // 例如：?memory_type=raw&memory_type=semantic
      if (params?.memory_type?.length) {
        params.memory_type.forEach(type => {
          queryParams.append('memory_type', type)
        })
      }
      if (params?.tenant_id?.length) {
        params.tenant_id.forEach(id => {
          queryParams.append('tenant_id', id)
        })
      }

      const queryString = queryParams.toString()
      return apiClient.get(`/memory${queryString ? `?${queryString}` : ''}`)
    },

    /**
     * 获取记忆库详情/配置
     * 后端接口: GET /v1/memory/:id/config
     */
    get: (id: string): Promise<Memory> =>
      apiClient.get(`/memory/${id}/config`),

    /**
     * 获取记忆库配置（用于设置页面）
     * 与 get 相同，保持兼容性
     */
    getConfig: (id: string): Promise<Memory> =>
      apiClient.get(`/memory/${id}/config`),

    /**
     * 创建记忆库
     * 后端接口: POST /v1/memory
     * 请求体: { name, memory_type: string[], embd_id, llm_id }
     */
    create: (data: CreateMemoryParams): Promise<Memory> =>
      apiClient.post('/memory', data),

    /**
     * 更新记忆库
     * 后端接口: PUT /v1/memory/:id
     * 注意: 不允许修改 id, tenant_id, memory_type, storage_type, embd_id
     */
    update: (id: string, data: UpdateMemoryParams): Promise<Memory> =>
      apiClient.put(`/memory/${id}`, data),

    /**
     * 删除记忆库
     * 后端接口: DELETE /v1/memory/:id
     */
    delete: (id: string): Promise<void> =>
      apiClient.delete(`/memory/${id}`),
  },

  // ============ 记忆消息管理 ============
  // TODO: 后端消息接口待实现
  message: {
    /**
     * 获取消息列表
     * TODO: 后端接口待实现
     */
    list: (memoryId: string, params?: MessageListParams): Promise<MessageListResponse> => {
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.page_size) queryParams.set('page_size', params.page_size.toString())
      if (params?.keywords) queryParams.set('keywords', params.keywords)
      if (params?.status !== undefined) queryParams.set('status', params.status.toString())
      if (params?.session_id) queryParams.set('session_id', params.session_id)
      
      // 数组参数使用多值格式
      if (params?.message_type?.length) {
        params.message_type.forEach(type => {
          queryParams.append('message_type', type)
        })
      }

      const queryString = queryParams.toString()
      return apiClient.get(`/memory/${memoryId}/messages${queryString ? `?${queryString}` : ''}`)
    },

    /**
     * 获取消息内容
     * TODO: 后端接口待实现
     */
    getContent: (memoryId: string, messageId: string): Promise<MessageContentResponse> =>
      apiClient.get(`/memory/${memoryId}/messages/${messageId}/content`),

    /**
     * 更新消息状态（启用/禁用）
     * TODO: 后端接口待实现
     */
    updateState: (memoryId: string, messageId: string, status: boolean): Promise<void> =>
      apiClient.put(`/memory/${memoryId}/messages/${messageId}`, { status }),

    /**
     * 遗忘消息（删除）
     * TODO: 后端接口待实现
     */
    forget: (memoryId: string, messageId: string): Promise<void> =>
      apiClient.delete(`/memory/${memoryId}/messages/${messageId}`),
  },
}

// 导出 API 对象
export default memoryAPI
