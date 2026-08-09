/**
 * 认证 / 用户 API 客户端
 *
 * 后端在 2026-08-03（commit 5ec3bd4c）把整个 user 模块迁到 RESTful 路由
 * （`api/apps/restful_apis/user_api.py`，挂载在 `/api/v1`），旧的
 * `api/apps/user_app.py` 连同它的 `/v1/user/*` 端点一起删除 —— 后端**没有**保留
 * deprecated 兼容层，所以这里不做 legacy 回退，全部直接走 `/api/v1`。
 *
 * 端点对照（旧 → 新）：
 *   POST  /v1/user/login                 → POST  /api/v1/auth/login
 *   POST  /v1/user/register              → POST  /api/v1/users
 *   GET   /v1/user/login/channels        → GET   /api/v1/auth/login/channels
 *   GET   /v1/user/login/{channel}       → GET   /api/v1/auth/login/{channel}
 *   GET   /v1/user/logout                → POST  /api/v1/auth/logout          （方法变更）
 *   GET   /v1/user/info                  → GET   /api/v1/users/me
 *   POST  /v1/user/setting               → PATCH /api/v1/users/me             （方法变更）
 *   GET   /v1/user/tenant_info           → GET   /api/v1/users/me/models
 *   POST  /v1/user/set_tenant_info       → PATCH /api/v1/users/me/models      （方法变更）
 *   GET   /v1/user/forget/captcha        → POST  /api/v1/auth/password/forgot/captcha （方法变更）
 *   POST  /v1/user/forget/otp            → POST  /api/v1/auth/password/forgot/otp
 *   POST  /v1/user/forget/verify-otp     → POST  /api/v1/auth/password/forgot/otp/verify
 *   POST  /v1/user/forget/reset-password → POST  /api/v1/auth/password/reset
 *
 * 本文件此前还有一批后端**从未实现过**的端点（`/v1/user/update`、`/v1/user/tenant`、
 * `/v1/user/refresh`、`/v1/user/change-password`、`/v1/user/reset-password`、
 * `/v1/user/verify-reset-token`、`/v1/user/set-new-password`、POST 形式的 OAuth 登录），
 * 已随本次对齐删除，不再留假接口。修改密码走 {@link authAPI.updateUserSettings}。
 */

import { apiClient, APIError } from './client'
import { API_BASE_URL } from '@/constants'
import { encryptPassword } from '@/utils/crypt'
import type {
  LoginRequest,
  RegisterRequest,
  UserInfo,
  UserProfile,
  UpdateUserProfileRequest,
  LoginChannel,
} from '../types/api'
// GET /api/v1/users/me/models 返回的是租户的默认模型配置，形状以 types/team 为准
import type { TenantInfo } from '@/types/team'
import type { UserSettingsUpdateResponse } from '../types'

/** apiClient 的 baseURL 覆盖，使请求走 /api/v1/...（与 memory.ts / system.ts 一致） */
const sdkBase = { baseURL: `${API_BASE_URL}/api` }

/**
 * 登录/注册的响应信封。
 *
 * JWT 不在 body 里，而是在 `Authorization` 响应头上，由 apiClient 提取后挂到
 * `auth` 字段（见 client.ts 的 isAuthEnvelopeEndpoint）。
 */
export interface AuthEnvelope {
  retcode?: number
  retmsg?: string
  data: UserInfo
  auth?: string
  refresh_token?: string
}

/** 租户默认模型设置 —— PATCH /api/v1/users/me/models 的请求体 */
export interface TenantModelSettings {
  tenant_id: string
  name?: string
  llm_id?: string
  embd_id?: string
  asr_id?: string
  img2txt_id?: string
  rerank_id?: string
  tts_id?: string
}

/** 忘记密码：验证图片验证码并发送邮箱 OTP */
export interface SendPasswordResetOtpRequest {
  email: string
  captcha: string
}

/** 忘记密码：校验邮箱 OTP */
export interface VerifyPasswordResetOtpRequest {
  email: string
  otp: string
}

/** 忘记密码：提交新密码 */
export interface ResetPasswordRequest {
  email: string
  new_password: string
  confirm_new_password: string
}

export const authAPI = {
  // 用户登录 —— 后端字段名是 username（值仍然是邮箱）
  login: (data: LoginRequest): Promise<AuthEnvelope> =>
    apiClient.post(
      '/auth/login',
      { username: data.email, password: encryptPassword(data.password) },
      { ...sdkBase, skipAuth: true },
    ),

  // 用户注册
  register: (data: RegisterRequest): Promise<AuthEnvelope> =>
    apiClient.post(
      '/users',
      { ...data, password: encryptPassword(data.password) },
      { ...sdkBase, skipAuth: true },
    ),

  // 获取用户信息
  getUserInfo: (): Promise<UserInfo> => apiClient.get('/users/me', sdkBase),

  // 获取用户档案信息
  getUserProfile: (): Promise<UserProfile> =>
    apiClient.get('/users/me', sdkBase),

  // 更新用户信息
  updateUserInfo: (data: Partial<UserInfo>): Promise<boolean> =>
    apiClient.patch('/users/me', data, sdkBase),

  // 更新用户档案信息
  updateUserProfile: (data: UpdateUserProfileRequest): Promise<boolean> =>
    apiClient.patch('/users/me', data, sdkBase),

  // 获取当前用户名下租户的默认模型设置
  getTenantInfo: (): Promise<TenantInfo> =>
    apiClient.get('/users/me/models', sdkBase),

  // 更新当前用户名下租户的默认模型设置
  updateTenantInfo: (data: TenantModelSettings): Promise<boolean> =>
    apiClient.patch('/users/me/models', data, sdkBase),

  // 获取登录渠道
  getLoginChannels: (): Promise<LoginChannel[]> =>
    apiClient.get('/auth/login/channels', { ...sdkBase, skipAuth: true }),

  // 获取OAuth登录URL（后端 302 重定向到授权页）
  getOAuthURL: (
    channel: string,
    redirectUri?: string,
  ): Promise<{ url: string }> =>
    apiClient.get(`/auth/login/${encodeURIComponent(channel)}`, {
      ...sdkBase,
      skipAuth: true,
      headers: redirectUri ? { 'X-Redirect-URI': redirectUri } : {},
    }),

  // 登出
  logout: (): Promise<boolean> =>
    apiClient.post('/auth/logout', undefined, sdkBase),

  /**
   * 忘记密码第 1 步：取图片验证码。
   *
   * 后端直接返回 image/jpeg 原始字节（不是 JSON 信封），apiClient 对非 JSON 响应
   * 原样透传 Response，所以这里自己取 blob；email 是查询参数而非请求体。
   */
  requestPasswordResetCaptcha: async (email: string): Promise<Blob> => {
    const response = await apiClient.post<Response>(
      '/auth/password/forgot/captcha',
      undefined,
      { ...sdkBase, skipAuth: true, params: { email } },
    )
    if (!(response instanceof Response)) {
      throw new APIError(
        500,
        'INVALID_CAPTCHA_RESPONSE',
        'Captcha endpoint did not return an image',
      )
    }
    return response.blob()
  },

  // 忘记密码第 2 步：校验图片验证码并把 OTP 发到邮箱
  sendPasswordResetOtp: (data: SendPasswordResetOtpRequest): Promise<boolean> =>
    apiClient.post('/auth/password/forgot/otp', data, {
      ...sdkBase,
      skipAuth: true,
    }),

  // 忘记密码第 3 步：校验邮箱 OTP
  verifyPasswordResetOtp: (
    data: VerifyPasswordResetOtpRequest,
  ): Promise<boolean> =>
    apiClient.post('/auth/password/forgot/otp/verify', data, {
      ...sdkBase,
      skipAuth: true,
    }),

  // 忘记密码第 4 步：提交新密码
  resetPassword: (data: ResetPasswordRequest): Promise<boolean> =>
    apiClient.post('/auth/password/reset', data, {
      ...sdkBase,
      skipAuth: true,
    }),

  // 用户设置更新（含修改密码）—— PATCH /api/v1/users/me
  // 支持的参数: nickname, timezone, avatar, password, new_password
  updateUserSettings: async (data: {
    nickname?: string
    timezone?: string
    avatar?: string
    password?: string
    new_password?: string
  }): Promise<UserSettingsUpdateResponse> => {
    try {
      const response = await apiClient.patch('/users/me', data, sdkBase)

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
