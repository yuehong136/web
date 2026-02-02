/**
 * 团队管理页面
 * 容器组件 - 处理所有业务逻辑、状态管理和 API 调用
 */

import React, { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ViewToggle } from '@/components/ui/view-toggle'
import { CustomSelect } from '@/components/ui/custom-select'
import {
  Search,
  Grid3X3,
  List as ListIcon,
  Users,
  UserCheck,
  Clock,
  UserPlus,
  Building2,
} from 'lucide-react'
import { toast } from '@/lib/toast'

// Hooks
import {
  useFetchTenantInfo,
  useFetchTeamMembers,
  useFetchJoinedTeams,
  useInviteMember,
  useRemoveMember,
  useAcceptInvitation,
  useRejectInvitation,
} from '@/hooks/use-team-request'
import { useTeamStore } from '@/stores/team'
import { useAuthStore } from '@/stores'

// Types
import { TenantRole } from '@/types/team'

// Components
import {
  TeamMemberCard,
  TeamMemberListRow,
  JoinedTeamCard,
  JoinedTeamListRow,
  TeamEmptyState,
  MemberSkeleton,
  TeamStatsCard,
  InviteMemberDialog,
} from './components'

export const TeamPage: React.FC = () => {
  // UI State from store
  const {
    viewMode,
    setViewMode,
    joinedTeamsViewMode,
    setJoinedTeamsViewMode,
    activeTab,
    setActiveTab,
    memberSearchQuery,
    setMemberSearchQuery,
    teamSearchQuery,
    setTeamSearchQuery,
    timeFormat,
    setTimeFormat,
    inviteDialogOpen,
    setInviteDialogOpen,
    confirmDialog,
    openConfirmDialog,
    closeConfirmDialog,
  } = useTeamStore()

  // API Data
  const { tenantInfo } = useFetchTenantInfo()
  const { members, isLoading: membersLoading, refetch: refetchMembers } = useFetchTeamMembers(
    tenantInfo?.tenant_id
  )
  const {
    joinedTeams,
    isLoading: teamsLoading,
    refetch: refetchTeams,
  } = useFetchJoinedTeams()

  // Current user
  const { user } = useAuthStore()

  // Mutations
  const { inviteMember, isLoading: inviteLoading } = useInviteMember()
  const { removeMember, isLoading: removeLoading } = useRemoveMember()
  const { acceptInvitation, isLoading: acceptLoading } = useAcceptInvitation()
  const { rejectInvitation, isLoading: rejectLoading } = useRejectInvitation()
  const respondLoading = acceptLoading || rejectLoading

  // Check if current user is owner
  const isOwner = tenantInfo?.role === TenantRole.Owner

  // Filtered members
  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return members
    const query = memberSearchQuery.toLowerCase()
    return members.filter(
      (m) =>
        m.nickname?.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query)
    )
  }, [members, memberSearchQuery])

  // Filtered joined teams
  const filteredJoinedTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return joinedTeams
    const query = teamSearchQuery.toLowerCase()
    return joinedTeams.filter(
      (t) =>
        t.nickname?.toLowerCase().includes(query) ||
        t.email?.toLowerCase().includes(query)
    )
  }, [joinedTeams, teamSearchQuery])

  // Stats
  const stats = useMemo(() => {
    const activeMembers = members.filter((m) => m.role !== TenantRole.Invite).length
    const pendingInvites = members.filter((m) => m.role === TenantRole.Invite).length
    const pendingTeamInvites = joinedTeams.filter(
      (t) => t.role === TenantRole.Invite
    ).length

    return {
      totalMembers: members.length,
      activeMembers,
      pendingInvites,
      joinedTeams: joinedTeams.length,
      pendingTeamInvites,
    }
  }, [members, joinedTeams])

  // Handlers
  const handleInviteMember = async (email: string) => {
    if (!tenantInfo?.tenant_id) {
      throw new Error('无法获取租户信息')
    }

    await inviteMember({ tenantId: tenantInfo.tenant_id, email })
    toast.success('邀请已发送')
    refetchMembers()
  }

  const handleRemoveMember = (userId: string, nickname: string) => {
    openConfirmDialog('remove', { id: userId, name: nickname })
  }

  const handleConfirmRemove = async () => {
    if (!confirmDialog.target || !tenantInfo?.tenant_id) return

    try {
      await removeMember({
        tenantId: tenantInfo.tenant_id,
        userId: confirmDialog.target.id,
      })
      toast.success('成员已移除')
      refetchMembers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '移除失败')
    } finally {
      closeConfirmDialog()
    }
  }

  const handleAcceptInvitation = async (tenantId: string) => {
    try {
      await acceptInvitation(tenantId)
      toast.success('已接受邀请')
      refetchTeams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  const handleRejectInvitation = async (tenantId: string) => {
    if (!user?.id) {
      toast.error('无法获取用户信息')
      return
    }
    try {
      await rejectInvitation({ tenantId, userId: user.id })
      toast.success('已拒绝邀请')
      refetchTeams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  const handleLeaveTeam = (tenantId: string, nickname: string) => {
    openConfirmDialog('leave', { id: tenantId, name: nickname })
  }

  const handleConfirmLeave = async () => {
    if (!confirmDialog.target || !user?.id) {
      toast.error('无法获取必要信息')
      closeConfirmDialog()
      return
    }

    try {
      await rejectInvitation({ tenantId: confirmDialog.target.id, userId: user.id })
      toast.success('已退出团队')
      refetchTeams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
    } finally {
      closeConfirmDialog()
    }
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* 页面头部 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">团队管理</h1>
          <p className="text-sm text-text-secondary mt-1">
            管理您的团队成员和已加入的团队
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            邀请成员
          </Button>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <TeamStatsCard
            title="成员总数"
            value={stats.totalMembers}
            icon={Users}
            color="info"
          />
          <TeamStatsCard
            title="活跃成员"
            value={stats.activeMembers}
            icon={UserCheck}
            color="success"
          />
          <TeamStatsCard
            title="待处理邀请"
            value={stats.pendingInvites + stats.pendingTeamInvites}
            icon={Clock}
            color="warning"
          />
          <TeamStatsCard
            title="已加入团队"
            value={stats.joinedTeams}
            icon={Building2}
            color="purple"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'my-team' | 'joined-teams')}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="flex items-center justify-center mb-4">
          <TabsList>
            <TabsTrigger value="my-team">
              <Users className="h-4 w-4 mr-2" />
              我的团队
              {stats.pendingInvites > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-state-warning-subtle text-state-warning">
                  {stats.pendingInvites}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="joined-teams">
              <Building2 className="h-4 w-4 mr-2" />
              已加入的团队
              {stats.pendingTeamInvites > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-state-info-subtle text-state-info">
                  {stats.pendingTeamInvites}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 我的团队 Tab */}
        <TabsContent value="my-team" className="flex-1 flex flex-col min-h-0">
          {/* 工具栏 */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 max-w-md">
              <Input
                type="search"
                placeholder="搜索成员..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex items-center space-x-2">
              <CustomSelect
                options={[
                  { value: 'detailed', label: '详细时间' },
                  { value: 'compact', label: '简洁时间' },
                  { value: 'relative', label: '相对时间' },
                ]}
                value={timeFormat}
                onChange={(value) =>
                  setTimeFormat(value as 'detailed' | 'compact' | 'relative')
                }
                size="sm"
                className="min-w-[100px]"
              />
              <ViewToggle
                value={viewMode}
                onChange={setViewMode}
                size="md"
                options={[
                  { value: 'grid', icon: <Grid3X3 />, label: '网格视图' },
                  { value: 'list', icon: <ListIcon />, label: '列表视图' },
                ]}
              />
            </div>
          </div>

          {/* 成员列表 */}
          <div className="flex-1 overflow-y-auto pt-1 pb-2 -mx-1 px-1">
            {membersLoading ? (
              <MemberSkeleton viewMode={viewMode} count={6} />
            ) : filteredMembers.length === 0 ? (
              <TeamEmptyState
                type={memberSearchQuery ? 'search' : 'members'}
                searchQuery={memberSearchQuery}
                onInvite={isOwner ? () => setInviteDialogOpen(true) : undefined}
              />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMembers.map((member) => (
                  <TeamMemberCard
                    key={member.user_id}
                    member={member}
                    isOwner={isOwner}
                    onRemove={handleRemoveMember}
                    timeFormat={timeFormat}
                  />
                ))}
              </div>
            ) : (
              <div
                className="rounded-lg border overflow-hidden"
                style={{
                  backgroundColor: 'var(--color-surface-primary)',
                  borderColor: 'var(--color-border-default)',
                }}
              >
                {/* 表头 */}
                <div
                  className="grid grid-cols-[2fr_1fr_1fr_120px_60px] items-center gap-4 px-5 h-12 border-b"
                  style={{
                    backgroundColor: 'var(--color-surface-secondary)',
                    borderColor: 'var(--color-border-default)',
                  }}
                >
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    成员
                  </div>
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    角色
                  </div>
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    邮箱
                  </div>
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    加入时间
                  </div>
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
                    操作
                  </div>
                </div>
                {/* 列表内容 */}
                <div
                  className="divide-y"
                  style={{ borderColor: 'var(--color-border-subtle)' }}
                >
                  {filteredMembers.map((member) => (
                    <TeamMemberListRow
                      key={member.user_id}
                      member={member}
                      isOwner={isOwner}
                      onRemove={handleRemoveMember}
                      timeFormat={timeFormat}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 已加入的团队 Tab */}
        <TabsContent value="joined-teams" className="flex-1 flex flex-col min-h-0">
          {/* 工具栏 */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 max-w-md">
              <Input
                type="search"
                placeholder="搜索团队..."
                value={teamSearchQuery}
                onChange={(e) => setTeamSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex items-center space-x-2">
              <CustomSelect
                options={[
                  { value: 'detailed', label: '详细时间' },
                  { value: 'compact', label: '简洁时间' },
                  { value: 'relative', label: '相对时间' },
                ]}
                value={timeFormat}
                onChange={(value) =>
                  setTimeFormat(value as 'detailed' | 'compact' | 'relative')
                }
                size="sm"
                className="min-w-[100px]"
              />
              <ViewToggle
                value={joinedTeamsViewMode}
                onChange={setJoinedTeamsViewMode}
                size="md"
                options={[
                  { value: 'grid', icon: <Grid3X3 />, label: '网格视图' },
                  { value: 'list', icon: <ListIcon />, label: '列表视图' },
                ]}
              />
            </div>
          </div>

          {/* 团队列表 */}
          <div className="flex-1 overflow-y-auto pt-1 pb-2 -mx-1 px-1">
            {teamsLoading ? (
              <MemberSkeleton viewMode={joinedTeamsViewMode} count={6} />
            ) : filteredJoinedTeams.length === 0 ? (
              <TeamEmptyState
                type={teamSearchQuery ? 'search' : 'joined-teams'}
                searchQuery={teamSearchQuery}
              />
            ) : joinedTeamsViewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredJoinedTeams.map((team) => (
                  <JoinedTeamCard
                    key={team.tenant_id}
                    team={team}
                    onAccept={handleAcceptInvitation}
                    onReject={handleRejectInvitation}
                    onLeave={handleLeaveTeam}
                    timeFormat={timeFormat}
                    isLoading={respondLoading}
                  />
                ))}
              </div>
            ) : (
              <div
                className="rounded-lg border overflow-hidden"
                style={{
                  backgroundColor: 'var(--color-surface-primary)',
                  borderColor: 'var(--color-border-default)',
                }}
              >
                {/* 表头 */}
                <div
                  className="grid grid-cols-[2fr_1fr_1fr_120px_100px] items-center gap-4 px-5 h-12 border-b"
                  style={{
                    backgroundColor: 'var(--color-surface-secondary)',
                    borderColor: 'var(--color-border-default)',
                  }}
                >
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    团队
                  </div>
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    角色
                  </div>
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    邮箱
                  </div>
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    加入时间
                  </div>
                  <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
                    操作
                  </div>
                </div>
                {/* 列表内容 */}
                <div
                  className="divide-y"
                  style={{ borderColor: 'var(--color-border-subtle)' }}
                >
                  {filteredJoinedTeams.map((team) => (
                    <JoinedTeamListRow
                      key={team.tenant_id}
                      team={team}
                      onAccept={handleAcceptInvitation}
                      onReject={handleRejectInvitation}
                      onLeave={handleLeaveTeam}
                      timeFormat={timeFormat}
                      isLoading={respondLoading}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 邀请成员对话框 */}
      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvite={handleInviteMember}
        isLoading={inviteLoading}
      />

      {/* 确认对话框 */}
      <Dialog open={confirmDialog.open} onOpenChange={closeConfirmDialog}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'remove' ? '移除成员' : '退出团队'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'remove'
                ? `确定要将 "${confirmDialog.target?.name}" 从团队中移除吗？此操作不可撤销。`
                : `确定要退出 "${confirmDialog.target?.name}" 团队吗？退出后需要重新接受邀请才能加入。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirmDialog}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={
                confirmDialog.type === 'remove'
                  ? handleConfirmRemove
                  : handleConfirmLeave
              }
              disabled={removeLoading || respondLoading}
            >
              {confirmDialog.type === 'remove' ? '移除' : '退出'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

TeamPage.displayName = 'TeamPage'
