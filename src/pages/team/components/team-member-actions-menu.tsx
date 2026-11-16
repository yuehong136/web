import { useTranslation } from 'react-i18next'
import { MoreVertical, ShieldMinus, ShieldPlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { TenantRole, type TeamMember } from '@/types/team'

interface TeamMemberActionsMenuProps {
  member: TeamMember
  canChangeRole: boolean
  canRemove: boolean
  onChangeRole?: (
    userId: string,
    nickname: string,
    currentRole: TenantRole,
  ) => void
  onRemove?: (userId: string, nickname: string) => void
}

/** Role and membership actions shared by the member card and list row. */
export const TeamMemberActionsMenu = ({
  member,
  canChangeRole,
  canRemove,
  onChangeRole,
  onRemove,
}: TeamMemberActionsMenuProps) => {
  const { t } = useTranslation()
  const changeRole = () =>
    onChangeRole?.(member.user_id, member.nickname, member.role)

  return (
    <ActionMenu>
      <ActionMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('settings.team.memberActions', {
            name: member.nickname,
          })}
          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreVertical className="size-icon-sm" />
        </Button>
      </ActionMenuTrigger>
      <ActionMenuContent align="end">
        {canChangeRole && member.role === TenantRole.Normal && onChangeRole && (
          <ActionMenuItem onSelect={changeRole}>
            <ShieldPlus className="size-icon-sm" />
            {t('settings.team.makeAdmin')}
          </ActionMenuItem>
        )}
        {canChangeRole && member.role === TenantRole.Admin && onChangeRole && (
          <ActionMenuItem onSelect={changeRole}>
            <ShieldMinus className="size-icon-sm" />
            {t('settings.team.removeAdmin')}
          </ActionMenuItem>
        )}
        {canRemove && onRemove && (
          <ActionMenuItem
            danger
            onSelect={() => onRemove(member.user_id, member.nickname)}
          >
            <Trash2 className="size-icon-sm" />
            {member.role === TenantRole.Invite
              ? t('settings.team.revokeInvite')
              : t('settings.team.removeMember')}
          </ActionMenuItem>
        )}
      </ActionMenuContent>
    </ActionMenu>
  )
}
