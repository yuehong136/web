/**
 * 团队管理页面 Hooks
 * 提取自 TeamPage 的数据获取、权限计算和操作处理逻辑
 */

import { useMemo } from 'react'
import {
  useFetchTenantInfo,
  useFetchTeamMembers,
  useFetchJoinedTeams,
  useBatchInviteMembers,
  useUpdateMemberRole,
  useRemoveMember,
  useAcceptInvitation,
  useRejectInvitation,
} from '@/hooks/use-team-request'
import { useTeamStore } from '@/stores/team'
import { useAuthStore } from '@/stores'
import { TenantRole, type TeamMember, type JoinedTeam, type TeamPermissions, type TeamStats } from '@/types/team'
import { toast } from '@/lib/toast'

/** 页面数据和权限计算 */
export const useTeamPageData = () => {
  const { tenantInfo } = useFetchTenantInfo()
  const { joinedTeams, isLoading: teamsLoading } = useFetchJoinedTeams()
  const { selectedManagedTenantId } = useTeamStore()
  const { user } = useAuthStore()

  // 可管理的团队（joined teams 中角色为 owner/admin，排除自己的租户）
  const manageableTeams = useMemo(
    () =>
      joinedTeams.filter(
        (t) =>
          (t.role === TenantRole.Owner || t.role === TenantRole.Admin) &&
          t.tenant_id !== tenantInfo?.tenant_id
      ),
    [joinedTeams, tenantInfo?.tenant_id]
  )

  // 当前选中的团队 ID
  const selectedTenantId = selectedManagedTenantId ?? tenantInfo?.tenant_id ?? null

  // 当前选中团队的角色
  const selectedRole = useMemo(() => {
    if (!selectedTenantId || selectedTenantId === tenantInfo?.tenant_id) {
      return TenantRole.Owner
    }
    const team = joinedTeams.find((t) => t.tenant_id === selectedTenantId)
    return team?.role ?? TenantRole.Normal
  }, [selectedTenantId, tenantInfo?.tenant_id, joinedTeams])

  // 获取选中团队的成员列表
  const { members, isLoading: membersLoading, refetch: refetchMembers } = useFetchTeamMembers(
    selectedTenantId ?? undefined
  )

  // 权限
  const permissions: TeamPermissions = useMemo(() => ({
    canInvite: selectedRole === TenantRole.Owner || selectedRole === TenantRole.Admin,
    canRemove: selectedRole === TenantRole.Owner || selectedRole === TenantRole.Admin,
    canChangeRole: selectedRole === TenantRole.Owner,
  }), [selectedRole])

  // 统计数据
  const stats: TeamStats = useMemo(() => ({
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.role !== TenantRole.Invite).length,
    adminMembers: members.filter((m) => m.role === TenantRole.Admin).length,
    pendingInvites: members.filter((m) => m.role === TenantRole.Invite).length,
    joinedTeams: joinedTeams.length,
  }), [members, joinedTeams])

  const pendingTeamInvites = useMemo(
    () => joinedTeams.filter((t) => t.role === TenantRole.Invite).length,
    [joinedTeams]
  )

  return {
    tenantInfo,
    joinedTeams,
    members,
    membersLoading,
    teamsLoading,
    manageableTeams,
    selectedTenantId,
    selectedRole,
    permissions,
    stats,
    pendingTeamInvites,
    refetchMembers,
    currentUserId: user?.id,
  }
}

/** 团队操作 handlers */
export const useTeamActions = (selectedTenantId: string | null) => {
  const { user } = useAuthStore()
  const {
    openConfirmDialog,
    closeConfirmDialog,
    confirmDialog,
    setInviteDialogOpen,
  } = useTeamStore()

  const { batchInvite, isLoading: batchInviteLoading } = useBatchInviteMembers()
  const { updateRole, isLoading: roleLoading } = useUpdateMemberRole()
  const { removeMember, isLoading: removeLoading } = useRemoveMember()
  const { acceptInvitation, isLoading: acceptLoading } = useAcceptInvitation()
  const { rejectInvitation, isLoading: rejectLoading } = useRejectInvitation()

  const handleBatchInvite = async (emails: string[]) => {
    if (!selectedTenantId) throw new Error('无法获取租户信息')
    return await batchInvite({ tenantId: selectedTenantId, emails })
  }

  const handleRemoveMember = (userId: string, nickname: string) => {
    openConfirmDialog('remove', { id: userId, name: nickname })
  }

  const handleConfirmRemove = async () => {
    if (!confirmDialog.target || !selectedTenantId) return
    try {
      await removeMember({ tenantId: selectedTenantId, userId: confirmDialog.target.id })
      toast.success('操作成功')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
    } finally {
      closeConfirmDialog()
    }
  }

  const handleChangeRole = (userId: string, nickname: string, currentRole: TenantRole) => {
    const newRole = currentRole === TenantRole.Admin ? 'normal' : 'admin'
    openConfirmDialog('change-role', { id: userId, name: nickname }, { newRole })
  }

  const handleConfirmRoleChange = async () => {
    if (!confirmDialog.target || !selectedTenantId || !confirmDialog.roleChangeInfo) return
    try {
      await updateRole({
        tenantId: selectedTenantId,
        userId: confirmDialog.target.id,
        role: confirmDialog.roleChangeInfo.newRole,
      })
      const label = confirmDialog.roleChangeInfo.newRole === 'admin' ? '已设为管理员' : '已取消管理员'
      toast.success(label)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
    } finally {
      closeConfirmDialog()
    }
  }

  const handleAcceptInvitation = async (tenantId: string) => {
    try {
      await acceptInvitation(tenantId)
      toast.success('已接受邀请')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  const handleRejectInvitation = async (tenantId: string) => {
    if (!user?.id) return
    try {
      await rejectInvitation({ tenantId, userId: user.id })
      toast.success('已拒绝邀请')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  const handleLeaveTeam = (tenantId: string, nickname: string) => {
    openConfirmDialog('leave', { id: tenantId, name: nickname })
  }

  const handleConfirmLeave = async () => {
    if (!confirmDialog.target || !user?.id) {
      closeConfirmDialog()
      return
    }
    try {
      await rejectInvitation({ tenantId: confirmDialog.target.id, userId: user.id })
      toast.success('已退出团队')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
    } finally {
      closeConfirmDialog()
    }
  }

  return {
    handleBatchInvite,
    handleRemoveMember,
    handleConfirmRemove,
    handleChangeRole,
    handleConfirmRoleChange,
    handleAcceptInvitation,
    handleRejectInvitation,
    handleLeaveTeam,
    handleConfirmLeave,
    setInviteDialogOpen,
    loadingStates: {
      batchInviteLoading,
      roleLoading,
      removeLoading,
      respondLoading: acceptLoading || rejectLoading,
    },
  }
}

/** 成员列表过滤排序 */
export const useFilteredMembers = (
  members: TeamMember[],
  searchQuery: string,
  sortDesc: boolean
) => {
  return useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    const list = query
      ? members.filter(
          (m) =>
            m.nickname?.toLowerCase().includes(query) ||
            m.email?.toLowerCase().includes(query)
        )
      : members

    return [...list].sort((a, b) => {
      const timeA = new Date(a.update_date).getTime() || 0
      const timeB = new Date(b.update_date).getTime() || 0
      return sortDesc ? timeB - timeA : timeA - timeB
    })
  }, [members, searchQuery, sortDesc])
}

/** 已加入团队列表过滤排序 */
export const useFilteredJoinedTeams = (
  joinedTeams: JoinedTeam[],
  searchQuery: string,
  sortDesc: boolean
) => {
  return useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    const list = query
      ? joinedTeams.filter(
          (t) =>
            t.nickname?.toLowerCase().includes(query) ||
            t.email?.toLowerCase().includes(query)
        )
      : joinedTeams

    return [...list].sort((a, b) => {
      const timeA = new Date(a.update_date).getTime() || 0
      const timeB = new Date(b.update_date).getTime() || 0
      return sortDesc ? timeB - timeA : timeA - timeB
    })
  }, [joinedTeams, searchQuery, sortDesc])
}
