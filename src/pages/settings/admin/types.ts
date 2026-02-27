/**
 * Admin 用户管理类型定义
 * 对应后端 admin_server.py (port 8130) 的 API 响应结构
 */

/** 用户列表项（对应 UserResponse model） */
export interface AdminUser {
  email: string        // 用户邮箱（同时作为 username 标识符）
  nickname: string
  is_active: boolean | null
  create_date?: string | null
}

/** 创建用户请求参数 */
export interface CreateUserParams {
  username: string    // 实际是 email
  password: string
  role: string        // 'user' | 'admin'
}

/** 修改密码请求参数 */
export interface ChangePasswordParams {
  username: string
  newPassword: string
}

/** Admin 登录响应（包含 JWT token） */
export interface AdminLoginResponse {
  token: string
  message?: string
}

/** 状态筛选枚举 */
export enum UserStatusFilter {
  ALL = 'all',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/** 角色筛选枚举 */
export enum UserRoleFilter {
  ALL = 'all',
  ADMIN = 'admin',
  NORMAL = 'normal',
}

/** Admin 认证状态 */
export interface AdminAuthState {
  token: string | null
  isAuthenticated: boolean
}
