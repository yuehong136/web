/**
 * 团队管理页面
 * 容器组件 - 组合 hooks、tabs 和 dialogs
 */

import { useTranslation } from 'react-i18next'
import { UserPlus } from 'lucide-react'
import { DetailTemplate } from '@/components/page-templates'
import { InlineStats, type InlineStat } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTeamStore, type TeamActiveTab } from '@/stores/team'
import { useTeamPageData, useTeamActions } from './hooks'
import { TeamManagementTab } from './TeamManagementTab'
import { JoinedTeamsTab } from './JoinedTeamsTab'
import { BatchInviteDialog, TeamSelector } from './components'

const TAB_CONTENT =
  'mt-0 flex min-h-0 flex-1 flex-col focus-visible:ring-0 focus-visible:ring-offset-0'

export function TeamPage() {
  const { t } = useTranslation()
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

  const membersTab = activeTab === 'my-team'
  // Members and joined teams are complete lists, so these are true totals.
  const memberStats: InlineStat[] = [
    {
      key: 'admins',
      label: t('settings.team.stats.admins'),
      value: stats.adminMembers,
    },
    {
      key: 'pending',
      label: t('settings.team.stats.pending'),
      value: stats.pendingInvites,
      tone: stats.pendingInvites ? 'warning' : undefined,
    },
  ]
  const teamStats: InlineStat[] = [
    {
      key: 'invitations',
      label: t('settings.team.stats.invitations'),
      value: pendingTeamInvites,
      tone: pendingTeamInvites ? 'warning' : undefined,
    },
  ]
  const busy =
    loadingStates.removeLoading ||
    loadingStates.respondLoading ||
    loadingStates.roleLoading
  const target = confirmDialog.target?.name ?? ''
  const confirmCopy =
    confirmDialog.type === 'remove'
      ? {
          title: t('settings.team.confirm.removeTitle'),
          description: t('settings.team.confirm.removeDescription', {
            name: target,
          }),
          confirm: t('settings.team.confirm.remove'),
          destructive: true,
        }
      : confirmDialog.type === 'leave'
        ? {
            title: t('settings.team.confirm.leaveTitle'),
            description: t('settings.team.confirm.leaveDescription', {
              name: target,
            }),
            confirm: t('settings.team.confirm.leave'),
            destructive: true,
          }
        : {
            title: t('settings.team.confirm.roleTitle'),
            description: t(
              confirmDialog.roleChangeInfo?.newRole === 'admin'
                ? 'settings.team.confirm.makeAdminDescription'
                : 'settings.team.confirm.removeAdminDescription',
              { name: target },
            ),
            confirm: t('common.confirm'),
            destructive: false,
          }
  const confirm = () => {
    if (confirmDialog.type === 'remove') void handleConfirmRemove()
    else if (confirmDialog.type === 'leave') void handleConfirmLeave()
    else if (confirmDialog.type === 'change-role')
      void handleConfirmRoleChange()
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as TeamActiveTab)}
      className="h-full min-h-0"
    >
      <DetailTemplate
        title={t('settings.team.title')}
        count={membersTab ? members.length : joinedTeams.length}
        countLabel={
          membersTab
            ? t('settings.team.memberCount', { count: members.length })
            : t('settings.team.teamCount', { count: joinedTeams.length })
        }
        subline={<InlineStats items={membersTab ? memberStats : teamStats} />}
        actions={
          membersTab ? (
            <>
              <TeamSelector
                ownTenant={tenantInfo}
                manageableTeams={manageableTeams}
                selectedTenantId={selectedTenantId}
                onSelectTenant={setSelectedManagedTenantId}
              />
              {permissions.canInvite && members.length > 0 ? (
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="size-icon-sm" aria-hidden="true" />
                  {t('settings.team.invite')}
                </Button>
              ) : null}
            </>
          ) : null
        }
        tabs={
          <TabsList
            aria-label={t('settings.team.tabs.label')}
            className="border-b-0"
          >
            <TabsTrigger value="my-team">
              {t('settings.team.tabs.members')}
              <span className="text-xs font-normal text-fg-subtle tabular-nums">
                {members.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="joined-teams">
              {t('settings.team.tabs.joined')}
              <span className="text-xs font-normal text-fg-subtle tabular-nums">
                {joinedTeams.length}
              </span>
            </TabsTrigger>
          </TabsList>
        }
        bodyScroll="none"
      >
        <TabsContent value="my-team" className={TAB_CONTENT}>
          <TeamManagementTab
            currentUserId={currentUserId}
            members={members}
            membersLoading={membersLoading}
            permissions={permissions}
            onRemoveMember={handleRemoveMember}
            onChangeRole={handleChangeRole}
            onOpenInviteDialog={() => setInviteDialogOpen(true)}
          />
        </TabsContent>
        <TabsContent value="joined-teams" className={TAB_CONTENT}>
          <JoinedTeamsTab
            joinedTeams={joinedTeams}
            teamsLoading={teamsLoading}
            respondLoading={loadingStates.respondLoading}
            onAccept={handleAcceptInvitation}
            onReject={handleRejectInvitation}
            onLeave={handleLeaveTeam}
            onManageTeam={(tenantId) => {
              setSelectedManagedTenantId(tenantId)
              setActiveTab('my-team')
            }}
          />
        </TabsContent>
      </DetailTemplate>

      <BatchInviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvite={handleBatchInvite}
        isLoading={loadingStates.batchInviteLoading}
      />
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open && !busy) closeConfirmDialog()
        }}
        variant={confirmCopy.destructive ? 'destructive' : 'default'}
        pending={busy}
        title={confirmCopy.title}
        description={confirmCopy.description}
        cancelLabel={t('common.cancel')}
        confirmLabel={confirmCopy.confirm}
        onConfirm={confirm}
      />
    </Tabs>
  )
}

TeamPage.displayName = 'TeamPage'
