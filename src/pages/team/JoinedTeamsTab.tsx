import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  Check,
  LogOut,
  MoreHorizontal,
  Search,
  Settings,
  X,
} from 'lucide-react'
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
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { Button } from '@/components/ui/button'
import { useTeamStore } from '@/stores/team'
import { TenantRole, type JoinedTeam } from '@/types/team'
import { useFilteredJoinedTeams } from './hooks'
import { formatTeamTime } from './utils'
import { RoleBadge } from './components/RoleBadge'
import { TeamFilterBar } from './components/team-filter-bar'

interface JoinedTeamsTabProps {
  joinedTeams: JoinedTeam[]
  teamsLoading: boolean
  respondLoading: boolean
  onAccept: (tenantId: string) => void
  onReject: (tenantId: string) => void
  onLeave: (tenantId: string, nickname: string) => void
  onManageTeam: (tenantId: string) => void
}

function JoinedTeamActions({
  team,
  name,
  busy,
  onAccept,
  onReject,
  onLeave,
  onManageTeam,
}: Omit<
  JoinedTeamsTabProps,
  'joinedTeams' | 'teamsLoading' | 'respondLoading'
> & {
  team: JoinedTeam
  name: string
  busy: boolean
}) {
  const { t } = useTranslation()
  if (team.role === TenantRole.Invite)
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => onAccept(team.tenant_id)}
        >
          <Check className="size-icon-sm" aria-hidden="true" />
          {t('settings.team.accept')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('settings.team.reject')}
          disabled={busy}
          onClick={() => onReject(team.tenant_id)}
        >
          <X className="size-icon-sm" aria-hidden="true" />
        </Button>
      </>
    )
  const manager =
    team.role === TenantRole.Owner || team.role === TenantRole.Admin
  if (!manager && team.role !== TenantRole.Normal) return null
  return (
    <ActionMenu>
      <ActionMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('settings.team.teamActions', { name })}
        >
          <MoreHorizontal className="size-icon-sm" aria-hidden="true" />
        </Button>
      </ActionMenuTrigger>
      <ActionMenuContent align="end">
        {manager ? (
          <ActionMenuItem onSelect={() => onManageTeam(team.tenant_id)}>
            <Settings className="size-icon-sm" aria-hidden="true" />
            {t('settings.team.manage')}
          </ActionMenuItem>
        ) : (
          <ActionMenuItem
            danger
            disabled={busy}
            onSelect={() => onLeave(team.tenant_id, team.nickname)}
          >
            <LogOut className="size-icon-sm" aria-hidden="true" />
            {t('settings.team.leave')}
          </ActionMenuItem>
        )}
      </ActionMenuContent>
    </ActionMenu>
  )
}

/** Teams the user belongs to or is invited to, as rows or cards. */
export function JoinedTeamsTab({
  joinedTeams,
  teamsLoading,
  respondLoading,
  ...handlers
}: JoinedTeamsTabProps) {
  const { t } = useTranslation()
  const {
    joinedTeamsViewMode,
    setJoinedTeamsViewMode,
    teamSearchQuery,
    setTeamSearchQuery,
    timeFormat,
    setTimeFormat,
  } = useTeamStore()
  const [sortDesc, setSortDesc] = useState(true)
  const filtered = useFilteredJoinedTeams(
    joinedTeams,
    teamSearchQuery,
    sortDesc,
  )

  const item = (team: JoinedTeam): ResourceItemProps => {
    const name = team.nickname || t('settings.team.unnamedTeam')
    return {
      name,
      description: team.email,
      avatar: { src: team.avatar, seed: team.tenant_id, shape: 'circle' },
      status: <RoleBadge role={team.role} />,
      meta: (
        <span>
          {formatTeamTime(team.update_date, team.delta_seconds, timeFormat) ??
            t('settings.team.unknownTime')}
        </span>
      ),
      actions: (
        <JoinedTeamActions
          team={team}
          name={name}
          busy={respondLoading}
          {...handlers}
        />
      ),
    }
  }

  const state = teamsLoading
    ? 'loading'
    : filtered.length === 0
      ? 'empty'
      : 'content'

  return (
    <CollectionTemplate
      filterBar={
        <TeamFilterBar
          search={teamSearchQuery}
          onSearchChange={setTeamSearchQuery}
          searchPlaceholder={t('settings.team.searchTeams')}
          sortDescending={sortDesc}
          onSortDescendingChange={setSortDesc}
          timeFormat={timeFormat}
          onTimeFormatChange={setTimeFormat}
          view={joinedTeamsViewMode}
          onViewChange={setJoinedTeamsViewMode}
        />
      }
      state={state}
      emptyState={
        teamSearchQuery ? (
          <PageEmptyState
            icon={<Search className="size-icon-lg" />}
            title={t('settings.team.empty.searchTitle')}
            description={t('settings.team.empty.searchDescription')}
            action={
              <Button variant="outline" onClick={() => setTeamSearchQuery('')}>
                {t('settings.team.empty.clearSearch')}
              </Button>
            }
          />
        ) : (
          <PageEmptyState
            icon={<Building2 className="size-icon-lg" />}
            title={t('settings.team.empty.joinedTitle')}
            description={t('settings.team.empty.joinedDescription')}
          />
        )
      }
    >
      {joinedTeamsViewMode === 'grid' ? (
        <ResourceGrid label={t('settings.team.tabs.joined')}>
          {filtered.map((team) => (
            <ResourceCard key={team.tenant_id} {...item(team)} />
          ))}
        </ResourceGrid>
      ) : (
        <ResourceList
          label={t('settings.team.tabs.joined')}
          header={
            <ResourceListHeader
              name={t('settings.team.columns.team')}
              status={t('settings.team.columns.role')}
              meta={t('settings.team.columns.updated')}
            />
          }
        >
          {filtered.map((team) => (
            <ResourceRow
              key={team.tenant_id}
              {...item(team)}
              actionsVisibility={
                team.role === TenantRole.Invite ? 'always' : 'hover'
              }
            />
          ))}
        </ResourceList>
      )}
    </CollectionTemplate>
  )
}
