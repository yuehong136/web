import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/constants'
import { apiClient } from '@/api/client'
import type { UserInfo, TenantInfo } from '@/types/api'

interface AuthState {
  // 状态
  user: UserInfo | null
  tenant: TenantInfo | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // 动作
  setUser: (user: UserInfo | null) => void
  setTenant: (tenant: TenantInfo | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  login: (email: string, password: string, remember?: boolean) => Promise<void>
  register: (data: { username: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updates: Partial<UserInfo>) => void
  refreshToken: () => Promise<void>
  
  // 工具方法
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      tenant: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // 设置用户
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),

      // 设置租户
      setTenant: (tenant) => set({ tenant }),

      // 设置token
      setToken: (token) => set({ 
        token, 
        isAuthenticated: !!token && !!get().user 
      }),

      // 设置加载状态
      setLoading: (isLoading) => set({ isLoading }),

      // 登录
      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await apiClient.post('/user/login', {
            username: email,  // 后端期望的是username字段
            password
          })

          // 后端返回的数据结构：{ data: user_info, auth: jwt_token, retcode: 200, retmsg: "Welcome back!" }
          console.log('Full login response:', response)
          
          const { data: user, auth: access_token } = response
          
          console.log('Extracted user:', user)
          console.log('Extracted token:', access_token)
          console.log('Login successful, setting token:', access_token?.substring(0, 20) + '...')
          
          // 设置API客户端的token
          apiClient.setAuthToken(access_token)
          
          // 更新状态
          set({ 
            token: access_token, 
            user, 
            tenant: null, // 租户信息需要单独获取
            isAuthenticated: true,
            isLoading: false 
          })
          
          // 保存到本地存储
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, access_token)
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user))
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // 注册
      register: async (data) => {
        set({ isLoading: true })
        try {
          const response = await apiClient.post('/user/register', {
            email: data.email,
            nickname: data.username,
            password: data.password
          })

          // 后端返回的数据结构：{ data: user_info, auth: jwt_token, retcode: 200, retmsg: "Welcome aboard!" }
          const { data: user, auth: access_token } = response
          
          // 设置API客户端的token
          apiClient.setAuthToken(access_token)
          
          // 更新状态
          set({ 
            token: access_token, 
            user, 
            tenant: null,
            isAuthenticated: true,
            isLoading: false 
          })
          
          // 保存到本地存储
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, access_token)
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user))
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // 登出
      logout: async () => {
        try {
          // 调用后端logout接口
          await apiClient.get('/logout')
        } catch (error) {
          console.warn('Backend logout failed:', error)
          // 即使后端logout失败，也要清除前端状态
        }
        
        // 清除API客户端的token
        apiClient.setAuthToken(null)
        
        // 清除本地存储
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_INFO)
        localStorage.removeItem('tenant_info')
        
        set({ 
          user: null, 
          tenant: null,
          token: null, 
          isAuthenticated: false,
          isLoading: false 
        })
      },

      // 刷新token
      refreshToken: async () => {
        const currentToken = get().token
        if (!currentToken) return

        try {
          const response = await apiClient.post('/auth/refresh', {})
          const { data: user, auth: access_token } = response
          
          // 设置API客户端的token
          apiClient.setAuthToken(access_token)
          
          // 更新状态
          set({ 
            token: access_token, 
            user,
            isAuthenticated: true 
          })
          
          // 更新本地存储
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, access_token)
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user))
        } catch (error) {
          // 刷新失败，登出用户
          get().logout()
          throw error
        }
      },

      // 更新用户信息
      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates }
          set({ user: updatedUser })
          
          // 更新本地存储
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser))
        }
      },

      // 检查权限
      hasPermission: (permission) => {
        const user = get().user
        return user?.permissions?.includes(permission) || false
      },

      // 检查角色
      hasRole: (role) => {
        const user = get().user
        return user?.roles?.includes(role) || false
      },
    }),
    {
      name: 'auth-storage',
      // 只持久化必要的数据
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // 从存储中恢复状态时的处理
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 验证token是否仍然有效
          const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
          if (storedToken !== state.token) {
            state.logout()
          } else if (storedToken) {
            // 如果有token，设置到API客户端
            apiClient.setAuthToken(storedToken)
          }
        }
      },
    }
  )
)