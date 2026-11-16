import { useTranslation } from 'react-i18next'
import { ChevronsUpDown } from 'lucide-react'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuLabel,
  ActionMenuRadioGroup,
  ActionMenuRadioItem,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { Button } from '@/components/ui/button'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { TenantRole, type JoinedTeam, type TenantInfo } from '@/types/team'
import { RoleBadge } from './RoleBadge'

interface TeamSelectorProps {
  ownTenant: TenantInfo | null
  manageableTeams: JoinedTeam[]
  selectedTenantId: string | null
  onSelectTenant: (tenantId: string) => void
}

/** Switches the managed team; hidden when the user manages only their own. */
export function TeamSelector({
  ownTenant,
  manageableTeams,
  selectedTenantId,
  onSelectTenant,
}: TeamSelectorProps) {
  const { t } = useTranslation()
  if (manageableTeams.length === 0) return null
  const ownName = ownTenant?.name || t('settings.team.selector.own')
  const managed = manageableTeams.find(
    (team) => team.tenant_id === selectedTenantId,
  )
  const current = managed
    ? {
        name: managed.nickname || t('settings.team.unnamedTeam'),
        role: managed.role,
        seed: managed.tenant_id,
        avatar: managed.avatar,
      }
    : {
        name: ownName,
        role: TenantRole.Owner,
        seed: ownTenant?.tenant_id,
        avatar: null,
      }
  return (
    <ActionMenu>
      <ActionMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={`${t('settings.team.selector.label')}: ${current.name}`}
          className="max-w-64 justify-between"
        >
          <span className="flex min-w-0 items-center gap-space-xs">
            <EntityAvatar
              name={current.name}
              src={current.avatar}
              seed={current.seed}
              size="xs"
              shape="circle"
            />
            <span className="truncate">{current.name}</span>
          </span>
          <ChevronsUpDown
            className="size-icon-sm text-text-tertiary"
            aria-hidden="true"
          />
        </Button>
      </ActionMenuTrigger>
      <ActionMenuContent align="end" className="min-w-64">
        <ActionMenuRadioGroup
          value={selectedTenantId ?? ownTenant?.tenant_id ?? ''}
          onValueChange={onSelectTenant}
        >
          {ownTenant ? (
            <>
              <ActionMenuLabel className="px-space-sm py-space-xs text-xs text-text-tertiary">
                {t('settings.team.selector.own')}
              </ActionMenuLabel>
              <ActionMenuRadioItem value={ownTenant.tenant_id}>
                <span className="min-w-0 flex-1 truncate">{ownName}</span>
                <RoleBadge role={TenantRole.Owner} />
              </ActionMenuRadioItem>
              <ActionMenuSeparator />
            </>
          ) : null}
          <ActionMenuLabel className="px-space-sm py-space-xs text-xs text-text-tertiary">
            {t('settings.team.selector.managed')}
          </ActionMenuLabel>
          {manageableTeams.map((team) => (
            <ActionMenuRadioItem key={team.tenant_id} value={team.tenant_id}>
              <span className="min-w-0 flex-1 truncate">
                {team.nickname || t('settings.team.unnamedTeam')}
              </span>
              <RoleBadge role={team.role} />
            </ActionMenuRadioItem>
          ))}
        </ActionMenuRadioGroup>
      </ActionMenuContent>
    </ActionMenu>
  )
}
