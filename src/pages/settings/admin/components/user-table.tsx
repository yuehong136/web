import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  KeyRound,
  MoreHorizontal,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { SettingRow } from '@/components/patterns/setting-row'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getCurrentLanguage } from '@/locales/i18n'
import type { AdminUser } from '../types'

export interface UserActions {
  onChangePassword: (user: AdminUser) => void
  onToggleStatus: (user: AdminUser) => void
  onGrantAdmin: (user: AdminUser) => void
  onDelete: (user: AdminUser, returnFocus: HTMLElement | null) => void
}

const formatDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat(getCurrentLanguage(), {
        dateStyle: 'medium',
      }).format(date)
}

function UserRow({
  user,
  isSelf,
  actions,
}: {
  user: AdminUser
  isSelf: boolean
  actions: UserActions
}) {
  const { t } = useTranslation()
  const trigger = useRef<HTMLButtonElement>(null)
  const name = user.nickname || user.email
  const created = formatDate(user.create_date)
  const description = [
    user.nickname ? user.email : null,
    created ? t('settings.admin.users.createdOn', { date: created }) : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <SettingRow
      leading={
        <EntityAvatar name={name} seed={user.email} size="md" shape="circle" />
      }
      label={
        <span className="flex min-w-0 items-center gap-space-xs">
          <span className="truncate">{name}</span>
          {isSelf ? (
            <Badge variant="secondary">{t('settings.admin.users.you')}</Badge>
          ) : null}
        </span>
      }
      description={description || undefined}
    >
      <span className="inline-flex items-center gap-space-xs text-sm text-text-secondary">
        <span
          aria-hidden="true"
          className={cn(
            'size-1.5 rounded-radius-full',
            user.is_active ? 'bg-status-success' : 'bg-text-tertiary',
          )}
        />
        {t(
          user.is_active
            ? 'settings.admin.users.active'
            : 'settings.admin.users.inactive',
        )}
      </span>
      <ActionMenu>
        <ActionMenuTrigger asChild>
          <Button
            ref={trigger}
            variant="ghost"
            size="icon-sm"
            aria-label={t('settings.admin.users.actions', { name })}
          >
            <MoreHorizontal className="size-icon-sm" aria-hidden="true" />
          </Button>
        </ActionMenuTrigger>
        <ActionMenuContent align="end">
          <ActionMenuItem onSelect={() => actions.onChangePassword(user)}>
            <KeyRound className="size-icon-sm" />
            {t('settings.admin.changePassword.title')}
          </ActionMenuItem>
          <ActionMenuItem
            disabled={isSelf}
            onSelect={() => actions.onToggleStatus(user)}
          >
            {user.is_active ? (
              <ToggleLeft className="size-icon-sm" />
            ) : (
              <ToggleRight className="size-icon-sm" />
            )}
            {t(
              user.is_active
                ? 'settings.admin.users.deactivate'
                : 'settings.admin.users.activate',
            )}
          </ActionMenuItem>
          <ActionMenuItem
            disabled={isSelf}
            onSelect={() => actions.onGrantAdmin(user)}
          >
            <ShieldCheck className="size-icon-sm" />
            {t('settings.admin.users.grantAdmin')}
          </ActionMenuItem>
          <ActionMenuSeparator />
          <ActionMenuItem
            danger
            disabled={isSelf}
            onSelect={() => actions.onDelete(user, trigger.current)}
          >
            <Trash2 className="size-icon-sm" />
            {t('settings.admin.users.delete')}
          </ActionMenuItem>
        </ActionMenuContent>
      </ActionMenu>
    </SettingRow>
  )
}

/** One setting row per user with status and an actions menu. */
export function UserTable({
  users,
  currentUserEmail,
  ...actions
}: UserActions & { users: AdminUser[]; currentUserEmail?: string }) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.email}>
          <UserRow
            user={user}
            isSelf={user.email === currentUserEmail}
            actions={actions}
          />
        </li>
      ))}
    </ul>
  )
}
