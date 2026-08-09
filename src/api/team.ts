/**
 * 团队管理 API 客户端
 *
 * 已迁移到后端的 RESTful 入口 `/api/v1/tenants/*`；旧的 `/v1/tenant/*` 端点后端仍
 * 保留（标了 deprecated），这里作为兼容期回退使用。
 */

import { API_BASE_URL } from '@/constants'
import { apiClient } from './client'
import { withLegacyFallback } from './legacy-fallback'
import type {
  TenantInfo,
  TeamMembersResponse,
  JoinedTeamsResponse,
  BatchInviteResponse,
  UpdateRoleResponse,
} from '@/types/team'

const teamRestConfig = { baseURL: `${API_BASE_URL}/api` }

/**
 * TODO(2026-08-01): 兼容期实现——优先打 `/api/v1/tenants/*`，只有后端尚未上线该路由
 * （404/405）时才回落到旧的 web 端点 `/v1/tenant/*`。待所有部署环境的后端都带上
 * RESTful 团队路由后，删掉本文件的全部 legacy 回退分支；后端届时也可以摘掉
 * `/v1/tenant/*`。
 */

const removeTenantUser = (tenantId: string, userId: string): Promise<void> =>
  withLegacyFallback(
    () =>
      apiClient.delete<void>(
        `/v1/tenants/${encodeURIComponent(tenantId)}/users`,
        {
          ...teamRestConfig,
          data: { user_id: userId },
        },
      ),
    () =>
      apiClient.delete<void>(
        `/tenant/${encodeURIComponent(tenantId)}/user/${encodeURIComponent(userId)}`,
      ),
  )

export const teamAPI = {
  // 获取当前租户信息（旧 `/v1/user/tenant_info` 已随 user_app.py 一起删除）
  getTenantInfo: (): Promise<TenantInfo> =>
    apiClient.get('/users/me/models', teamRestConfig),

  // 获取团队成员列表（owner 和 admin 均可调用）
  listTeamMembers: (tenantId: string): Promise<TeamMembersResponse> =>
    withLegacyFallback(
      () =>
        apiClient.get<TeamMembersResponse>(
          `/v1/tenants/${encodeURIComponent(tenantId)}/users`,
          teamRestConfig,
        ),
      () => apiClient.get<TeamMembersResponse>(`/tenant/${tenantId}/user/list`),
    ),

  // 邀请单个成员加入团队
  inviteMember: (tenantId: string, email: string): Promise<void> =>
    withLegacyFallback(
      () =>
        apiClient.post<void>(
          `/v1/tenants/${encodeURIComponent(tenantId)}/users`,
          { email },
          teamRestConfig,
        ),
      () => apiClient.post<void>(`/tenant/${tenantId}/user`, { email }),
    ),

  // 批量邀请成员加入团队
  batchInviteMembers: (
    tenantId: string,
    emails: string[],
  ): Promise<BatchInviteResponse> =>
    withLegacyFallback(
      () =>
        apiClient.post<BatchInviteResponse>(
          `/v1/tenants/${encodeURIComponent(tenantId)}/users/batch`,
          { emails },
          teamRestConfig,
        ),
      () =>
        apiClient.post<BatchInviteResponse>(`/tenant/${tenantId}/user/batch`, {
          emails,
        }),
    ),

  // 更新成员角色（仅 owner 可调用）
  updateMemberRole: (
    tenantId: string,
    userId: string,
    role: 'admin' | 'normal',
  ): Promise<UpdateRoleResponse> =>
    withLegacyFallback(
      () =>
        apiClient.put<UpdateRoleResponse>(
          `/v1/tenants/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(userId)}/role`,
          { role },
          teamRestConfig,
        ),
      () =>
        apiClient.put<UpdateRoleResponse>(
          `/tenant/${tenantId}/user/${userId}/role`,
          { role },
        ),
    ),

  // 移除团队成员 / 撤销邀请
  removeMember: removeTenantUser,

  // 获取已加入的团队列表
  listJoinedTeams: (): Promise<JoinedTeamsResponse> =>
    withLegacyFallback(
      () => apiClient.get<JoinedTeamsResponse>('/v1/tenants', teamRestConfig),
      () => apiClient.get<JoinedTeamsResponse>('/tenant/list'),
    ),

  // 接受团队邀请
  acceptInvitation: (tenantId: string): Promise<void> =>
    withLegacyFallback(
      () =>
        apiClient.patch<void>(
          `/v1/tenants/${encodeURIComponent(tenantId)}`,
          undefined,
          teamRestConfig,
        ),
      () => apiClient.put<void>(`/tenant/agree/${tenantId}`),
    ),

  // 拒绝团队邀请（删除邀请记录）
  rejectInvitation: removeTenantUser,
}
