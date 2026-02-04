/**
 * 团队管理模块类型定义
 * 基于 ragflow 后端 API 结构
 */

// 租户角色枚举
export const enum TenantRole {
  Owner = 'owner',
  Invite = 'invite',
  Normal = 'normal',
}

// 团队成员信息
// 来自 /tenant/<tenant_id>/user/list 接口
export interface TeamMember {
  id: string           // UserTenant 记录的 ID
  user_id: string      // 用户 ID
  nickname: string     // 用户昵称
  email: string        // 用户邮箱
  avatar: string | null
  role: TenantRole     // 在该租户中的角色
  status: number       // UserTenant 状态
  update_date: string  // 更新时间
  delta_seconds: number // 距离上次更新的秒数（后端计算）
  is_active?: boolean
  is_superuser?: boolean
}

// 已加入的团队信息
// 来自 /tenant/list 接口
export interface JoinedTeam {
  tenant_id: string    // 团队（租户）ID，即团队所有者的 user_id
  nickname: string     // 团队所有者的昵称
  email: string        // 团队所有者的邮箱
  avatar: string | null
  role: TenantRole     // 当前用户在该团队中的角色
  update_date: string  // 更新时间
  delta_seconds: number // 距离上次更新的秒数（后端计算）
}

// 当前租户信息
// 来自 /user/tenant_info 接口
// 注意：此接口只返回当前用户作为 owner 的租户信息
export interface TenantInfo {
  tenant_id: string    // 租户 ID（即当前用户的 user_id）
  name: string         // 租户名称
  role: TenantRole     // 角色（总是 owner）
  llm_id: string       // 默认 LLM 模型 ID
  embd_id: string      // 默认 Embedding 模型 ID
  asr_id: string       // 默认 ASR 模型 ID
  img2txt_id: string   // 默认图像转文本模型 ID
  tts_id?: string      // 默认 TTS 模型 ID
  rerank_id: string    // 默认 Rerank 模型 ID
  parser_ids: string   // 解析器 ID 列表（逗号分隔）
}

// 邀请成员请求
export interface InviteMemberRequest {
  email: string
}

// 响应邀请请求
export interface RespondInvitationRequest {
  agree: boolean
}

// API 响应结构
// 注意：ragflow 后端直接返回数组，不包装在对象中
export type TeamMembersResponse = TeamMember[]

export type JoinedTeamsResponse = JoinedTeam[]

// 统计数据
export interface TeamStats {
  totalMembers: number
  activeMembers: number
  pendingInvites: number
  joinedTeams: number
}
