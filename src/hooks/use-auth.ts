import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authAPI } from '../api/auth'
import { queryKeys } from '../lib/query-client'
import { STORAGE_KEYS } from '../constants'
import { toast } from '../lib/toast'
import type { LoginRequest, RegisterRequest, AuthResponse, UserInfo } from '../types/api'

// 登录
export const useLogin = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: LoginRequest) => authAPI.login(data),
    onSuccess: (response: AuthResponse) => {
      // 存储token和用户信息
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.access_token)
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user))
      
      // 更新查询缓存
      queryClient.setQueryData(queryKeys.user.info(), response.user)
      
      toast.success('登录成功')
    },
    onError: (error: any) => {
      toast.error(error.message || '登录失败')
    },
  })
}

// 注册
export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authAPI.register(data),
    onSuccess: (response: AuthResponse) => {
      // 存储token和用户信息
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.access_token)
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user))
      
      toast.success('注册成功')
    },
    onError: (error: any) => {
      toast.error(error.message || '注册失败')
    },
  })
}

// 获取用户信息
export const useUserInfo = () => {
  return useQuery({
    queryKey: queryKeys.user.info(),
    queryFn: authAPI.getUserInfo,
    enabled: !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
    staleTime: 5 * 60 * 1000, // 5分钟
  })
}

// 更新用户信息
export const useUpdateUserInfo = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<UserInfo>) => authAPI.updateUserInfo(data),
    onSuccess: (updatedUser) => {
      // 更新本地存储
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser))
      
      // 更新查询缓存
      queryClient.setQueryData(queryKeys.user.info(), updatedUser)
      
      toast.success('信息更新成功')
    },
    onError: (error: any) => {
      toast.error(error.message || '更新失败')
    },
  })
}

// 登出
export const useLogout = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      // 清除本地存储
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_INFO)
      
      // 清除所有查询缓存
      queryClient.clear()
      
      toast.success('已安全退出')
      
      // 重定向到登录页
      window.location.href = '/auth/login'
    },
    onError: (error: any) => {
      // 即使后端退出失败，也要清除本地数据
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_INFO)
      queryClient.clear()
      
      toast.error(error.message || '退出失败')
      window.location.href = '/auth/login'
    },
  })
}

// 修改密码
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: { old_password: string; new_password: string }) => 
      authAPI.changePassword(data),
    onSuccess: () => {
      toast.success('密码修改成功')
    },
    onError: (error: any) => {
      toast.error(error.message || '密码修改失败')
    },
  })
}

// 获取登录渠道
export const useLoginChannels = () => {
  return useQuery({
    queryKey: ['auth', 'channels'],
    queryFn: authAPI.getLoginChannels,
    staleTime: 10 * 60 * 1000, // 10分钟
  })
}

// OAuth登录
export const useOAuthLogin = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ channel, data }: { channel: string; data: any }) => 
      authAPI.oauthLogin(channel, data),
    onSuccess: (response: AuthResponse) => {
      // 存储token和用户信息
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.access_token)
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user))
      
      // 更新查询缓存
      queryClient.setQueryData(queryKeys.user.info(), response.user)
      
      toast.success('登录成功')
    },
    onError: (error: any) => {
      toast.error(error.message || 'OAuth登录失败')
    },
  })
}

// 检查是否已登录
export const useIsAuthenticated = () => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  const { data: userInfo, isLoading } = useUserInfo()
  
  return {
    isAuthenticated: !!token && !!userInfo,
    isLoading,
    user: userInfo,
  }
}

// 重置密码
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authAPI.resetPassword(email),
    onSuccess: () => {
      toast.success('重置密码邮件已发送，请查收邮箱')
    },
    onError: (error: any) => {
      toast.error(error.message || '发送重置邮件失败')
    },
  })
}