// Zustand stores 统一导出
export { useAuthStore } from './auth'
export { useUIStore } from './ui'
export { useConversationStore } from './conversation'
export { useChatStore } from './chat'
export { useKnowledgeStore } from './knowledge'
export { useModelStore } from './model'

// 导入stores用于初始化
import { useAuthStore } from './auth'
import { useUIStore } from './ui'
import { useConversationStore } from './conversation'
import { apiClient } from '../api/client'

// 导出类型
export type { } from './auth'
export type { } from './ui'
export type { } from './conversation'

// 创建一个全局store重置函数
export const resetAllStores = () => {
  // 获取所有store的引用并重置
  const authStore = useAuthStore.getState()
  const uiStore = useUIStore.getState()
  const conversationStore = useConversationStore.getState()

  // 执行登出操作，这会清理相关状态
  authStore.logout().catch(console.error)
  
  // 清理UI状态
  uiStore.clearNotifications()
  
  // 清理对话状态
  conversationStore.clearCurrentConversation()
}

// 创建一个初始化函数
export const initializeStores = () => {
  // 可以在这里进行一些初始化操作
  const authStore = useAuthStore.getState()
  const uiStore = useUIStore.getState()
  
  // 检查认证状态
  const token = localStorage.getItem('auth_token')
  const userInfo = localStorage.getItem('user_info')
  
  if (token && userInfo) {
    try {
      const user = JSON.parse(userInfo)
      // 设置API客户端的token
      apiClient.setAuthToken(token)
      // 设置Zustand store的认证状态
      authStore.setToken(token)
      authStore.setUser(user)
    } catch (error) {
      console.error('Failed to parse stored user info:', error)
      authStore.logout().catch(console.error)
    }
  }
  
  // 应用主题设置
  uiStore.setTheme(uiStore.theme)
}