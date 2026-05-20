/**
 * 团队管理页面
 * 容器组件 - 组合 hooks、tabs 和 dialogs
 */

import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Users, Building2, UserCheck, Clock, Shield } from 'lucide-react'
import { useTeamStore } from '@/stores/team'
import { useTeamPageData, useTeamActions } from './hooks'
import { TeamManagementTab } from './TeamManagementTab'
import { JoinedTeamsTab } from './JoinedTeamsTab'
import { BatchInviteDialog, ConfirmDialog, TeamStatsCard } from './components'

export const TeamPage: React.FC = () => {
  const {
    tenantInfo,
    joinedTeams,
    members,
    membersLoading,
    teamsLoading,
    manageableTeams,
    selectedTenantId,
    permissions,
    stats,
    pendingTeamInvites,
    currentUserId,
  } = useTeamPageData()

  const {
    handleBatchInvite,
    handleRemoveMember,
    handleConfirmRemove,
    handleChangeRole,
    handleConfirmRoleChange,
    handleAcceptInvitation,
    handleRejectInvitation,
    handleLeaveTeam,
    handleConfirmLeave,
    loadingStates,
  } = useTeamActions(selectedTenantId)

  const {
    activeTab,
    setActiveTab,
    inviteDialogOpen,
    setInviteDialogOpen,
    confirmDialog,
    closeConfirmDialog,
    setSelectedManagedTenantId,
  } = useTeamStore()

  // 从已加入团队跳转到团队管理
  const handleManageTeam = (tenantId: string) => {
    setSelectedManagedTenantId(tenantId)
    setActiveTab('my-team')
  }

  // 确认对话框统一处理
  const handleConfirm = () => {
    if (confirmDialog.type === 'remove') handleConfirmRemove()
    else if (confirmDialog.type === 'leave') handleConfirmLeave()
    else if (confirmDialog.type === 'change-role') handleConfirmRoleChange()
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* 页面头部 */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">团队管理</h1>
          <p className="mt-1 text-sm text-text-secondary">
            管理您的团队成员和已加入的团队
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="mb-4">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
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
            title="管理员"
            value={stats.adminMembers}
            icon={Shield}
            color="purple"
          />
          <TeamStatsCard
            title="待处理邀请"
            value={stats.pendingInvites + pendingTeamInvites}
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
        onValueChange={(value) =>
          setActiveTab(value as 'my-team' | 'joined-teams')
        }
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="mb-4 flex items-center justify-center">
          <TabsList>
            <TabsTrigger value="my-team">
              <Users className="mr-2 h-4 w-4" />
              团队管理
              {stats.pendingInvites > 0 && (
                <span className="ml-2 rounded-full bg-status-warning-subtle px-1.5 py-0.5 text-xs text-status-warning">
                  {stats.pendingInvites}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="joined-teams">
              <Building2 className="mr-2 h-4 w-4" />
              已加入的团队
              {pendingTeamInvites > 0 && (
                <span className="ml-2 rounded-full bg-status-info-subtle px-1.5 py-0.5 text-xs text-status-info">
                  {pendingTeamInvites}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="my-team" className="flex min-h-0 flex-1 flex-col">
          <TeamManagementTab
            tenantInfo={tenantInfo}
            manageableTeams={manageableTeams}
            selectedTenantId={selectedTenantId}
            currentUserId={currentUserId}
            members={members}
            membersLoading={membersLoading}
            permissions={permissions}
            onSelectTenant={setSelectedManagedTenantId}
            onRemoveMember={handleRemoveMember}
            onChangeRole={handleChangeRole}
            onOpenInviteDialog={() => setInviteDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent
          value="joined-teams"
          className="flex min-h-0 flex-1 flex-col"
        >
          <JoinedTeamsTab
            joinedTeams={joinedTeams}
            teamsLoading={teamsLoading}
            respondLoading={loadingStates.respondLoading}
            onAccept={handleAcceptInvitation}
            onReject={handleRejectInvitation}
            onLeave={handleLeaveTeam}
            onManageTeam={handleManageTeam}
          />
        </TabsContent>
      </Tabs>

      {/* 批量邀请对话框 */}
      <BatchInviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvite={handleBatchInvite}
        isLoading={loadingStates.batchInviteLoading}
      />

      {/* 确认对话框 */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={closeConfirmDialog}
        type={confirmDialog.type}
        targetName={confirmDialog.target?.name ?? ''}
        roleChangeInfo={confirmDialog.roleChangeInfo}
        onConfirm={handleConfirm}
        isLoading={
          loadingStates.removeLoading ||
          loadingStates.respondLoading ||
          loadingStates.roleLoading
        }
      />
    </div>
  )
}

TeamPage.displayName = 'TeamPage'
