import React, { memo, useCallback } from 'react'
import {
  MoreHorizontal,
  KeyRound,
  Trash2,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Users,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { AdminUser } from '../types'

// ─── Avatar ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { from: '#8b5cf6', to: '#6366f1' },
  { from: '#0ea5e9', to: '#06b6d4' },
  { from: '#10b981', to: '#14b8a6' },
  { from: '#f59e0b', to: '#f97316' },
  { from: '#f43f5e', to: '#ec4899' },
]

const UserAvatar: React.FC<{ user: AdminUser }> = memo(({ user }) => {
  const initial = (user.nickname || user.email)[0].toUpperCase()
  const color = AVATAR_COLORS[initial.charCodeAt(0) % AVATAR_COLORS.length]
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0"
      style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
    >
      <span className="text-sm font-semibold text-white">{initial}</span>
    </div>
  )
})
UserAvatar.displayName = 'UserAvatar'

// ─── Status Pill ─────────────────────────────────────────────────────────────

const StatusPill: React.FC<{ active: boolean | null }> = memo(({ active }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
      active
        ? 'bg-state-success-subtle text-text-success'
        : 'bg-background-subtle text-text-tertiary'
    )}
  >
    <span
      className={cn(
        'h-1.5 w-1.5 rounded-full',
        active ? 'bg-text-success' : 'bg-text-tertiary'
      )}
    />
    {active ? '活跃' : '停用'}
  </span>
))
StatusPill.displayName = 'StatusPill'

// ─── Relative Time ────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Row Actions ─────────────────────────────────────────────────────────────

interface RowActionsProps {
  user: AdminUser
  currentUserEmail?: string
  onChangePassword: (user: AdminUser) => void
  onToggleStatus: (user: AdminUser) => void
  onGrantAdmin: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
}

const RowActions: React.FC<RowActionsProps> = memo(({
  user,
  currentUserEmail,
  onChangePassword,
  onToggleStatus,
  onGrantAdmin,
  onDelete,
}) => {
  const isSelf = user.email === currentUserEmail
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-background-subtle hover:text-text-primary">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="right">
        <DropdownMenuItem onClick={() => onChangePassword(user)}>
          <KeyRound className="mr-2 h-3.5 w-3.5" />
          修改密码
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleStatus(user)} disabled={isSelf}>
          {user.is_active
            ? <><ToggleLeft className="mr-2 h-3.5 w-3.5" />停用账号</>
            : <><ToggleRight className="mr-2 h-3.5 w-3.5" />启用账号</>
          }
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onGrantAdmin(user)} disabled={isSelf}>
          <ShieldCheck className="mr-2 h-3.5 w-3.5" />
          授予管理员
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(user)}
          disabled={isSelf}
          className="text-text-error hover:!text-text-error focus:!text-text-error"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          删除用户
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
RowActions.displayName = 'RowActions'

// ─── Main Table ───────────────────────────────────────────────────────────────

interface UserTableProps {
  users: AdminUser[]
  currentUserEmail?: string
  onChangePassword: (user: AdminUser) => void
  onToggleStatus: (user: AdminUser) => void
  onGrantAdmin: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
}

export const UserTable: React.FC<UserTableProps> = memo(({
  users,
  currentUserEmail,
  onChangePassword,
  onToggleStatus,
  onGrantAdmin,
  onDelete,
}) => {
  const handleChangePassword = useCallback((user: AdminUser) => onChangePassword(user), [onChangePassword])
  const handleToggleStatus = useCallback((user: AdminUser) => onToggleStatus(user), [onToggleStatus])
  const handleGrantAdmin = useCallback((user: AdminUser) => onGrantAdmin(user), [onGrantAdmin])
  const handleDelete = useCallback((user: AdminUser) => onDelete(user), [onDelete])

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-background-subtle py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-background-default">
          <Users className="h-8 w-8 text-text-tertiary" />
        </div>
        <p className="mt-5 text-sm font-medium text-text-secondary">暂无用户数据</p>
        <p className="mt-1.5 text-xs text-text-tertiary">点击「新建用户」添加第一个用户</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl bg-background-surface">
      {/* Table Head */}
      <div className="grid grid-cols-[1fr_100px_140px_44px] items-center gap-space-sm border-b border-border-subtle px-space-md py-space-sm">
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">用户</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">状态</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">创建时间</span>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-border-subtle">
        {users.map(user => (
          <div
            key={user.email}
            className="grid grid-cols-[1fr_100px_140px_44px] items-center gap-space-sm px-space-md py-3 hover:bg-surface-accent/[0.03] transition-colors"
          >
            {/* User info */}
            <div className="flex items-center gap-space-sm min-w-0">
              <UserAvatar user={user} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate flex items-center gap-space-xs">
                  {user.nickname || user.email}
                  {user.email === currentUserEmail && (
                    <span className="inline-flex items-center rounded-full bg-surface-accent/10 px-1.5 text-xs text-text-accent">
                      你
                    </span>
                  )}
                </p>
                {user.nickname && (
                  <p className="text-xs text-text-tertiary truncate">{user.email}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <StatusPill active={user.is_active} />

            {/* Create date */}
            <span className="text-xs text-text-tertiary tabular-nums">
              {formatRelativeTime(user.create_date)}
            </span>

            {/* Actions */}
            <RowActions
              user={user}
              currentUserEmail={currentUserEmail}
              onChangePassword={handleChangePassword}
              onToggleStatus={handleToggleStatus}
              onGrantAdmin={handleGrantAdmin}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>
    </div>
  )
})
UserTable.displayName = 'UserTable'
