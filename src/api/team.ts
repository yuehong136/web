/**
 * 团队管理 API 客户端
 * 基于 ragflow 后端 API 结构
 */

import { apiClient } from './client'
import type {
  TenantInfo,
  TeamMembersResponse,
  JoinedTeamsResponse,
} from '@/types/team'

export const teamAPI = {
  // 获取当前租户信息
  getTenantInfo: (): Promise<TenantInfo> =>
    apiClient.get('/user/tenant_info'),

  // 获取团队成员列表
  listTeamMembers: (tenantId: string): Promise<TeamMembersResponse> =>
    apiClient.get(`/tenant/${tenantId}/user/list`),

  // 邀请成员加入团队
  inviteMember: (tenantId: string, email: string): Promise<void> =>
    apiClient.post(`/tenant/${tenantId}/user`, { email }),

  // 移除团队成员
  removeMember: (tenantId: string, userId: string): Promise<void> =>
    apiClient.delete(`/tenant/${tenantId}/user/${userId}`),

  // 获取已加入的团队列表
  listJoinedTeams: (): Promise<JoinedTeamsResponse> =>
    apiClient.get('/tenant/list'),

  // 接受团队邀请
  acceptInvitation: (tenantId: string): Promise<void> =>
    apiClient.put(`/tenant/agree/${tenantId}`),

  // 拒绝团队邀请（删除邀请记录）
  rejectInvitation: (tenantId: string, userId: string): Promise<void> =>
    apiClient.delete(`/tenant/${tenantId}/user/${userId}`),
}
