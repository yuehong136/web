import { apiClient } from './client'
import type {
  LoginRequest,
  RegisterRequest,
  OAuthLoginRequest,
  AuthResponse,
  UserInfo,
  TenantInfo,
  LoginChannel,
} from '../types/api'

export const authAPI = {
  // 用户登录
  login: (data: LoginRequest): Promise<AuthResponse> =>
    apiClient.post('/v1/user/login', data, { skipAuth: true }),

  // 用户注册
  register: (data: RegisterRequest): Promise<AuthResponse> =>
    apiClient.post('/v1/user/register', data, { skipAuth: true }),

  // OAuth登录
  oauthLogin: (channel: string, data: OAuthLoginRequest): Promise<AuthResponse> =>
    apiClient.post(`/v1/user/login/${channel}`, data, { skipAuth: true }),

  // 获取用户信息
  getUserInfo: (): Promise<UserInfo> =>
    apiClient.get('/v1/user/info'),

  // 更新用户信息
  updateUserInfo: (data: Partial<UserInfo>): Promise<UserInfo> =>
    apiClient.post('/v1/user/update', data),

  // 获取租户信息
  getTenantInfo: (): Promise<TenantInfo> =>
    apiClient.get('/v1/user/tenant'),

  // 获取登录渠道
  getLoginChannels: (): Promise<LoginChannel[]> =>
    apiClient.get('/v1/user/login/channels', { skipAuth: true }),

  // 获取OAuth登录URL
  getOAuthURL: (channel: string, redirectUri?: string): Promise<{ url: string }> =>
    apiClient.get(`/v1/user/login/${channel}`, {
      skipAuth: true,
      headers: redirectUri ? { 'X-Redirect-URI': redirectUri } : {},
    }),

  // 刷新token
  refreshToken: (refreshToken: string): Promise<AuthResponse> =>
    apiClient.post('/v1/user/refresh', { refresh_token: refreshToken }, { skipAuth: true }),

  // 登出
  logout: (): Promise<void> =>
    apiClient.post('/v1/user/logout'),

  // 修改密码
  changePassword: (data: { old_password: string; new_password: string }): Promise<void> =>
    apiClient.post('/v1/user/change-password', data),

  // 重置密码
  resetPassword: (email: string): Promise<void> =>
    apiClient.post('/v1/user/reset-password', { email }, { skipAuth: true }),

  // 验证重置密码令牌
  verifyResetToken: (token: string): Promise<{ valid: boolean }> =>
    apiClient.post('/v1/user/verify-reset-token', { token }, { skipAuth: true }),

  // 设置新密码
  setNewPassword: (token: string, newPassword: string): Promise<void> =>
    apiClient.post('/v1/user/set-new-password', { token, new_password: newPassword }, { skipAuth: true }),
}