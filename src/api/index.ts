// API 客户端和接口统一导出
export { apiClient, APIClient, APIError, type RequestConfig } from './client'

// 认证相关API
export { authAPI } from './auth'

// 对话相关API
export { conversationAPI } from './conversation'

// 知识库相关API
export { knowledgeAPI } from './knowledge'

// 对话应用相关API
export { dialogAPI } from './dialog'

// 创建一个统一的API对象
export const api = {
  auth: authAPI,
  conversation: conversationAPI,
  knowledge: knowledgeAPI,
  dialog: dialogAPI,
}

// 默认导出
export default api