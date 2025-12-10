// API 客户端和接口统一导出
export { apiClient, APIClient, APIError, type RequestConfig } from './client'

// API 模块导入
import { authAPI } from './auth'
import { conversationAPI } from './conversation'
import { knowledgeAPI } from './knowledge'
import { dialogAPI } from './dialog'
import { mcpAPI } from './mcp'
import { agentAPI } from './agent'
import { documentAPI } from './document'

// 导出各个API模块
export { authAPI } from './auth'
export { conversationAPI } from './conversation'
export { knowledgeAPI } from './knowledge'
export { dialogAPI } from './dialog'
export { mcpAPI } from './mcp'
export { agentAPI } from './agent'
export { documentAPI } from './document'

// 创建一个统一的API对象
export const api = {
  auth: authAPI,
  conversation: conversationAPI,
  knowledge: knowledgeAPI,
  dialog: dialogAPI,
  mcp: mcpAPI,
  agent: agentAPI,
  document: documentAPI,
}

// 默认导出
export default api