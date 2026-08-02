import { apiClient } from './client'
import { encryptPassword } from '@/utils/crypt'
import { API_BASE_URL } from '@/constants'
import type {
  LoginRequest,
  RegisterRequest,
  OAuthLoginRequest,
  AuthResponse,
  UserInfo,
  UserProfile,
  UpdateUserProfileRequest,
  TenantInfo,
  LoginChannel,
} from '../types/api'
import type { UserSettingsUpdateResponse } from '../types'

const authRestConfig = { baseURL: `${API_BASE_URL}/api` }
const publicAuthRestConfig = { ...authRestConfig, skipAuth: true }

export const authAPI = {
  // 用户登录
  login: (data: LoginRequest): Promise<AuthResponse> =>
    apiClient.post(
      '/auth/login',
      { username: data.email, password: encryptPassword(data.password) },
      publicAuthRestConfig,
    ),

  // 用户注册
  register: (data: RegisterRequest): Promise<AuthResponse> =>
    apiClient.post(
      '/users',
      { ...data, password: encryptPassword(data.password) },
      publicAuthRestConfig,
    ),

  // OAuth登录
  oauthLogin: (
    channel: string,
    data: OAuthLoginRequest,
  ): Promise<AuthResponse> =>
    apiClient.get(`/auth/login/${channel}`, {
      ...publicAuthRestConfig,
      params: data,
    }),

  // 获取用户信息
  getUserInfo: (): Promise<UserInfo> =>
    apiClient.get('/users/me', authRestConfig),

  // 获取用户档案信息
  getUserProfile: (): Promise<UserProfile> =>
    apiClient.get('/users/me', authRestConfig),

  // 更新用户信息
  updateUserInfo: (data: Partial<UserInfo>): Promise<UserInfo> =>
    apiClient.patch('/users/me', data, authRestConfig),

  // 更新用户档案信息
  updateUserProfile: (data: UpdateUserProfileRequest): Promise<UserProfile> =>
    apiClient.patch('/users/me', data, authRestConfig),

  // 获取租户信息
  getTenantInfo: (): Promise<TenantInfo> =>
    apiClient.get('/users/me/models', authRestConfig),

  // 获取登录渠道
  getLoginChannels: (): Promise<LoginChannel[]> =>
    apiClient.get('/auth/login/channels', publicAuthRestConfig),

  // 获取OAuth登录URL
  getOAuthURL: (
    channel: string,
    redirectUri?: string,
  ): Promise<{ url: string }> =>
    apiClient.get(`/auth/login/${channel}`, {
      ...publicAuthRestConfig,
      headers: redirectUri ? { 'X-Redirect-URI': redirectUri } : {},
    }),

  // 刷新token
  refreshToken: (refreshToken: string): Promise<AuthResponse> =>
    apiClient.post(
      '/v1/user/refresh',
      { refresh_token: refreshToken },
      { skipAuth: true },
    ),

  // 登出
  logout: (): Promise<void> =>
    apiClient.post('/auth/logout', undefined, authRestConfig),

  // 修改密码
  changePassword: (data: {
    old_password: string
    new_password: string
  }): Promise<void> => apiClient.post('/v1/user/change-password', data),

  // 重置密码
  resetPassword: (email: string): Promise<void> =>
    apiClient.post('/v1/user/reset-password', { email }, { skipAuth: true }),

  // 验证重置密码令牌
  verifyResetToken: (token: string): Promise<{ valid: boolean }> =>
    apiClient.post(
      '/v1/user/verify-reset-token',
      { token },
      { skipAuth: true },
    ),

  // 设置新密码
  setNewPassword: (token: string, newPassword: string): Promise<void> =>
    apiClient.post(
      '/v1/user/set-new-password',
      { token, new_password: newPassword },
      { skipAuth: true },
    ),

  // 用户设置更新（包含密码修改） - 对应 RESTful /api/v1/users/me 接口
  // 支持的参数: nickname, timezone, avatar, password, new_password
  updateUserSettings: async (data: {
    nickname?: string
    timezone?: string
    avatar?: string
    password?: string
    new_password?: string
  }): Promise<UserSettingsUpdateResponse> => {
    try {
      // 使用APIClient的内部request方法
      const response = await apiClient.patch('/users/me', data, authRestConfig)

      // 如果返回的是布尔值true，说明操作成功
      if (response === true) {
        return {
          retcode: 0,
          retmsg: 'success',
          data: true,
        }
      }

      // 如果返回的是完整响应对象，直接返回
      if (typeof response === 'object' && 'retcode' in response) {
        return response as UserSettingsUpdateResponse
      }

      // 其他情况，构造一个成功响应
      return {
        retcode: 0,
        retmsg: 'success',
        data: response,
      }
    } catch (error: any) {
      // 如果是APIError，可能包含了完整的错误信息
      if (
        error.details &&
        typeof error.details === 'object' &&
        'retcode' in error.details
      ) {
        return error.details as UserSettingsUpdateResponse
      }

      // 如果APIError包含了status和message，转换为我们需要的格式
      if (error.status && error.code) {
        return {
          retcode: parseInt(error.code) || error.status,
          retmsg: error.message,
          data: false,
        }
      }

      // 重新抛出错误让上层处理
      throw error
    }
  },
}
