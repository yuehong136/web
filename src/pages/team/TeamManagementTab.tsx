import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, UserPlus, Users } from 'lucide-react'
import { CollectionTemplate } from '@/components/page-templates'
import {
  PageEmptyState,
  ResourceCard,
  ResourceGrid,
  ResourceList,
  ResourceListHeader,
  ResourceRow,
  type ResourceItemProps,
} from '@/components/patterns'
import { ResourceCreateCard } from '@/components/patterns/resource-card'
import { Button } from '@/components/ui/button'
import { useTeamStore } from '@/stores/team'
import { useCollectionView } from '@/stores/collection-view'
import { TenantRole, type TeamMember, type TeamPermissions } from '@/types/team'
import { useFilteredMembers } from './hooks'
import { formatTeamTime } from './utils'
import { RoleBadge } from './components/RoleBadge'
import { TeamFilterBar } from './components/team-filter-bar'
import { TeamMemberActionsMenu } from './components/team-member-actions-menu'

interface TeamManagementTabProps {
  currentUserId?: string
  members: TeamMember[]
  membersLoading: boolean
  permissions: TeamPermissions
  onRemoveMember: (userId: string, nickname: string) => void
  onChangeRole: (
    userId: string,
    nickname: string,
    currentRole: TenantRole,
  ) => void
  onOpenInviteDialog: () => void
}

/** Members of the selected team as rows or cards. */
export function TeamManagementTab({
  currentUserId,
  members,
  membersLoading,
  permissions,
  onRemoveMember,
  onChangeRole,
  onOpenInviteDialog,
}: TeamManagementTabProps) {
  const { t } = useTranslation()
  const { memberSearchQuery, setMemberSearchQuery, timeFormat, setTimeFormat } =
    useTeamStore()
  const [sortDesc, setSortDesc] = useState(true)
  const filtered = useFilteredMembers(members, memberSearchQuery, sortDesc)
  // The member list is complete, so its length is the collection size.
  const [viewMode, setViewMode] = useCollectionView(
    'team-members',
    membersLoading ? undefined : members.length,
  )

  const item = (member: TeamMember): ResourceItemProps => {
    const self = member.user_id === currentUserId
    const canRemove =
      permissions.canRemove && member.role !== TenantRole.Owner && !self
    const canChangeRole =
      permissions.canChangeRole &&
      member.role !== TenantRole.Owner &&
      member.role !== TenantRole.Invite &&
      !self
    const name = member.nickname || t('settings.team.unnamedMember')
    return {
      name: self ? `${name} ${t('settings.team.you')}` : name,
      description: member.email,
      avatar: {
        src: member.avatar,
        seed: member.user_id,
        shape: 'circle',
      },
      status: <RoleBadge role={member.role} />,
      meta: (
        <span>
          {formatTeamTime(
            member.update_date,
            member.delta_seconds,
            timeFormat,
          ) ?? t('settings.team.unknownTime')}
        </span>
      ),
      actions:
        canRemove || canChangeRole ? (
          <TeamMemberActionsMenu
            member={member}
            canChangeRole={canChangeRole}
            canRemove={canRemove}
            onChangeRole={onChangeRole}
            onRemove={onRemoveMember}
          />
        ) : undefined,
    }
  }

  const state = membersLoading
    ? 'loading'
    : filtered.length === 0
      ? 'empty'
      : 'content'

  return (
    <CollectionTemplate
      filterBar={
        <TeamFilterBar
          search={memberSearchQuery}
          onSearchChange={setMemberSearchQuery}
          searchPlaceholder={t('settings.team.searchMembers')}
          sortDescending={sortDesc}
          onSortDescendingChange={setSortDesc}
          timeFormat={timeFormat}
          onTimeFormatChange={setTimeFormat}
          view={viewMode}
          onViewChange={setViewMode}
        />
      }
      state={state}
      emptyState={
        memberSearchQuery ? (
          <PageEmptyState
            icon={<Search className="size-icon-lg" />}
            title={t('settings.team.empty.searchTitle')}
            description={t('settings.team.empty.searchDescription')}
            action={
              <Button
                variant="outline"
                onClick={() => setMemberSearchQuery('')}
              >
                {t('settings.team.empty.clearSearch')}
              </Button>
            }
          />
        ) : (
          <PageEmptyState
            icon={<Users className="size-icon-lg" />}
            title={t('settings.team.empty.membersTitle')}
            description={t('settings.team.empty.membersDescription')}
            action={
              permissions.canInvite ? (
                <Button onClick={onOpenInviteDialog}>
                  <UserPlus className="size-icon-sm" aria-hidden="true" />
                  {t('settings.team.invite')}
                </Button>
              ) : undefined
            }
          />
        )
      }
    >
      {viewMode === 'grid' ? (
        <ResourceGrid label={t('settings.team.tabs.members')}>
          {filtered.map((member) => (
            <ResourceCard key={member.user_id} {...item(member)} />
          ))}
          {permissions.canInvite && !memberSearchQuery ? (
            <ResourceCreateCard
              label={t('settings.team.invite')}
              description={t('settings.team.inviteCardDescription')}
              onClick={onOpenInviteDialog}
            />
          ) : null}
        </ResourceGrid>
      ) : (
        <ResourceList
          label={t('settings.team.tabs.members')}
          header={
            <ResourceListHeader
              name={t('settings.team.columns.member')}
              status={t('settings.team.columns.role')}
              meta={t('settings.team.columns.updated')}
            />
          }
        >
          {filtered.map((member) => (
            <ResourceRow key={member.user_id} {...item(member)} />
          ))}
        </ResourceList>
      )}
    </CollectionTemplate>
  )
}
