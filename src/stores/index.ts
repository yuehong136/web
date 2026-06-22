// Zustand stores 统一导出
export { useAuthStore } from './auth'
export { useUIStore } from './ui'
export { useKnowledgeStore } from './knowledge'
export { useModelStore } from './model'
export {
  useStudioStore,
  useHasActiveFilters as useStudioHasActiveFilters,
  useSelectedCount as useStudioSelectedCount,
} from './studio'
export { useSearchStore } from './search'
export {
  useHomeStore,
  useSelectedApps,
  useSelectedAppIds,
  useSelectedMCPServers,
  useSelectedMCPIds,
  useSelectedConversationId,
  useSelectedModelId,
} from './home'

// 导入stores用于初始化
import { useAuthStore } from './auth'
import { useUIStore } from './ui'
import { apiClient } from '@/api/client'
import { authAPI } from '@/api/auth'

// 导出类型
export type {} from './auth'
export type {} from './ui'

// 创建一个全局store重置函数
export const resetAllStores = () => {
  // 获取所有store的引用并重置
  const authStore = useAuthStore.getState()
  const uiStore = useUIStore.getState()

  // 执行登出操作，这会清理相关状态
  authStore.logout().catch(console.error)

  // 清理UI状态
  uiStore.clearNotifications()
}

// 创建一个初始化函数
// 参照 ragflow 的做法：在初始化时获取完整的用户信息（包含 avatar）
export const initializeStores = async () => {
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

      // 异步获取最新的用户信息（包含 avatar）
      // 这样刷新页面后，sidebar 和其他地方都能正确显示头像
      try {
        const latestUserInfo = await authAPI.getUserProfile()
        if (latestUserInfo) {
          // 更新 authStore 中的用户信息
          authStore.updateUser({
            avatar: latestUserInfo.avatar || '',
            nickname: latestUserInfo.nickname || '',
          })
        }
      } catch (error) {
        // 获取用户信息失败（如 token 过期），但不影响基本初始化
        console.warn('Failed to fetch latest user info:', error)
      }
    } catch (error) {
      console.error('Failed to parse stored user info:', error)
      authStore.logout().catch(console.error)
    }
  }

  // 应用主题设置
  uiStore.setTheme(uiStore.theme)
}
