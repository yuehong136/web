/**
 * Admin 管理员 API
 * 对应后端独立 admin_server（默认 port 8130），路由前缀 /api/v1/admin
 *
 * 认证：独立的 Admin JWT，存储于 localStorage['admin_token']
 * 密码传输：RSA(PKCS1_v1_5(base64(password)))，与 admin_client.py 保持一致
 */

import { API_BASE_URL, API_VERSION } from '@/constants'
import JSEncrypt from 'jsencrypt'
import type { AdminUser, CreateUserParams, AdminLoginResponse } from '@/pages/settings/admin/types'

const ADMIN_LOGIN_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArq9XTUSeYr2+N1h3Afl/
z8Dse/2yD0ZGrKwx+EEEcdsBLca9Ynmx3nIB5obmLlSfmskLpBo0UACBmB5rEjBp
2Q2f3AG3Hjd4B+gNCG6BDaawuDlgANIhGnaTLrIqWrrcm4EMzJOnAOI1fgzJRsOO
UEfaS318Eq9OVO3apEyCCt0lOQK6PuksduOjVxtltDav+guVAA068NrPYmRNabVK
RNLJpL8w4D44sfth5RvZ3q9t+6RTArpEtc5sh5ChzvqPOzKGMXW83C95TxmXqpbK
6olN4RevSfVjEAgCydH6HN6OhtOQEcnrU97r9H0iZOWwbw3pVrZiUkuRD1R56Wzs
2wIDAQAB
-----END PUBLIC KEY-----`

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function encryptAdminLoginPassword(password: string): string {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(ADMIN_LOGIN_PUBLIC_KEY)
  const encrypted = encryptor.encrypt(utf8ToBase64(password))
  if (!encrypted) {
    throw new Error('管理员登录密码加密失败')
  }
  return encrypted
}

// ─── Admin API Base URL ───────────────────────────────────────────────────────
// 从主 API URL 派生 admin URL（替换端口为 8130），可通过 VITE_ADMIN_API_BASE_URL 覆盖

const ADMIN_API_BASE_URL = (() => {
  // 开发环境优先走 Vite 代理，避免跨域导致 Authorization 响应头不可读
  if (import.meta.env.DEV) return '/admin-api'

  const override = import.meta.env.VITE_ADMIN_API_BASE_URL
  if (override) return `${override.replace(/\/$/, '')}/api/${API_VERSION}/admin`
  // 从主 API URL 替换端口
  try {
    const url = new URL(API_BASE_URL)
    url.port = '8130'
    return `${url.toString().replace(/\/$/, '')}/api/${API_VERSION}/admin`
  } catch {
    return `http://localhost:8130/api/${API_VERSION}/admin`
  }
})()

const ADMIN_TOKEN_KEY = 'admin_auth_token'

function normalizeAdminToken(rawToken?: string | null): string | null {
  if (!rawToken) return null
  const token = rawToken.trim()
  if (!token) return null
  return token.toLowerCase().startsWith('bearer ')
    ? token.slice(7).trim()
    : token
}

function isJwtToken(token?: string | null): boolean {
  if (!token) return false
  // JWT 典型格式：header.payload.signature
  return token.split('.').length === 3
}

// ─── Admin HTTP Client ────────────────────────────────────────────────────────

interface AdminRequestConfig {
  method?: string
  body?: string
  skipAuth?: boolean
}

async function adminRequest<T>(endpoint: string, config: AdminRequestConfig = {}): Promise<T> {
  const url = `${ADMIN_API_BASE_URL}${endpoint}`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (!config.skipAuth) {
    const token = normalizeAdminToken(localStorage.getItem(ADMIN_TOKEN_KEY))
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    method: config.method || 'GET',
    headers,
    body: config.body,
  })

  const data = await res.json()

  // 适配后端 APIResponse: { code/retcode, message/retmsg, data }
  const code = data.retcode ?? data.code ?? 0
  if (code !== 0 || !res.ok) {
    throw new Error(data.retmsg || data.message || `HTTP ${res.status}`)
  }

  return data.data as T
}

// ─── Admin Auth ───────────────────────────────────────────────────────────────

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token: string | null): void {
  const normalizedToken = normalizeAdminToken(token)
  if (normalizedToken) {
    localStorage.setItem(ADMIN_TOKEN_KEY, normalizedToken)
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
  }
}

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminAPI = {
  /** 管理员登录，获取 JWT token */
  login: async (email: string, password: string): Promise<AdminLoginResponse> => {
    const encryptedPassword = encryptAdminLoginPassword(password)
    const res = await fetch(`${ADMIN_API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: encryptedPassword }),
    })
    const data = await res.json()
    const code = data.retcode ?? data.code ?? 0
    if (code !== 0 || !res.ok) {
      throw new Error(data.retmsg || data.message || '登录失败，请检查管理员凭据')
    }
    // 兼容后端返回:
    // 1) 响应头 Authorization
    // 2) 响应体 auth/token（部分实现会放在 body）
    // 注意：data.access_token 通常是用户访问标识，不是 admin JWT，不能用于 /admin/* 鉴权
    const headerToken = normalizeAdminToken(
      res.headers.get('Authorization') || res.headers.get('authorization'),
    )

    const bodyToken = normalizeAdminToken(
      data?.data?.token ||
      data?.data?.auth ||
      data?.token ||
      data?.auth,
    )

    const maybeAccessToken = normalizeAdminToken(data?.data?.access_token || data?.access_token)

    const tokenCandidates = [headerToken, bodyToken, maybeAccessToken].filter(Boolean) as string[]
    const token = tokenCandidates.find(candidate => isJwtToken(candidate)) || null

    if (!token) {
      throw new Error('登录失败：未收到有效 JWT（请后端返回 auth/token，或暴露 Authorization 响应头）')
    }
    return { token }
  },

  /** 管理员登出 */
  logout: async (): Promise<void> => {
    await adminRequest<void>('/logout')
    setAdminToken(null)
  },

  /** 验证当前 admin token 是否有效 */
  verify: (): Promise<null> =>
    adminRequest<null>('/verify'),

  /** 获取所有用户列表 */
  listUsers: (): Promise<AdminUser[]> =>
    adminRequest<AdminUser[]>('/users'),

  /** 创建新用户 */
  createUser: (data: CreateUserParams): Promise<Record<string, unknown>> =>
    adminRequest<Record<string, unknown>>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** 删除用户 (by username/email) */
  deleteUser: (username: string): Promise<null> =>
    adminRequest<null>(`/users/${encodeURIComponent(username)}`, { method: 'DELETE' }),

  /** 修改用户密码 */
  updateUserPassword: (username: string, newPassword: string): Promise<null> =>
    adminRequest<null>(`/users/${encodeURIComponent(username)}/password`, {
      method: 'PUT',
      body: JSON.stringify({ new_password: newPassword }),
    }),

  /** 切换用户激活状态 */
  updateUserActivate: (username: string, activate: boolean): Promise<null> =>
    adminRequest<null>(`/users/${encodeURIComponent(username)}/activate`, {
      method: 'PUT',
      body: JSON.stringify({ activate_status: activate ? 'on' : 'off' }),
    }),

  /** 授予管理员权限 */
  grantAdmin: (username: string): Promise<null> =>
    adminRequest<null>(`/users/${encodeURIComponent(username)}/admin`, { method: 'PUT' }),

  /** 撤销管理员权限 */
  revokeAdmin: (username: string): Promise<null> =>
    adminRequest<null>(`/users/${encodeURIComponent(username)}/admin`, { method: 'DELETE' }),
}
