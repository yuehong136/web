import { useTranslation } from 'react-i18next'
import { MoreHorizontal, ShieldMinus, ShieldPlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
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

/** Role and membership actions for a member row or card. */
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
  const roleItem =
    canChangeRole && onChangeRole
      ? member.role === TenantRole.Normal
        ? { icon: ShieldPlus, label: t('settings.team.makeAdmin') }
        : member.role === TenantRole.Admin
          ? { icon: ShieldMinus, label: t('settings.team.removeAdmin') }
          : null
      : null

  return (
    <ActionMenu>
      <ActionMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('settings.team.memberActions', {
            name: member.nickname,
          })}
        >
          <MoreHorizontal className="size-icon-sm" aria-hidden="true" />
        </Button>
      </ActionMenuTrigger>
      <ActionMenuContent align="end">
        {roleItem ? (
          <ActionMenuItem onSelect={changeRole}>
            <roleItem.icon className="size-icon-sm" aria-hidden="true" />
            {roleItem.label}
          </ActionMenuItem>
        ) : null}
        {roleItem && canRemove && onRemove ? <ActionMenuSeparator /> : null}
        {canRemove && onRemove ? (
          <ActionMenuItem
            danger
            onSelect={() => onRemove(member.user_id, member.nickname)}
          >
            <Trash2 className="size-icon-sm" aria-hidden="true" />
            {member.role === TenantRole.Invite
              ? t('settings.team.revokeInvite')
              : t('settings.team.removeMember')}
          </ActionMenuItem>
        ) : null}
      </ActionMenuContent>
    </ActionMenu>
  )
}
