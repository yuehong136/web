import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LogOut, RefreshCw, Search, UserPlus } from 'lucide-react'
import { adminAPI, getAdminToken, setAdminToken } from '@/api/admin'
import { SettingsTemplate } from '@/components/page-templates/settings-template'
import { InlineStats } from '@/components/patterns/inline-stats'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { SettingSection } from '@/components/patterns/setting-row'
import { SETTINGS_CARD } from '@/pages/settings/components/settings-card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores'
import { AdminLoginForm } from './components/admin-login-form'
import { ChangePasswordDialog } from './components/change-password-dialog'
import { CreateUserDialog } from './components/create-user-dialog'
import { UserTable } from './components/user-table'
import {
  useCreateAdminUser,
  useDeleteAdminUser,
  useFetchAdminUsers,
  useGrantAdmin,
  useUpdateUserActivate,
  useUpdateUserPassword,
} from './hooks/use-admin-users'
import { UserStatusFilter } from './types'
import type { AdminUser, CreateUserParams } from './types'

const UsersPanel: React.FC<{
  currentUserEmail?: string
  onLogout: () => void
}> = ({ currentUserEmail, onLogout }) => {
  const { t } = useTranslation()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>(
    UserStatusFilter.ALL,
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [changePassUser, setChangePassUser] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState<{
    user: AdminUser
    returnFocus: HTMLElement | null
  } | null>(null)

  const {
    data: users = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useFetchAdminUsers()
  const createUser = useCreateAdminUser()
  const deleteUser = useDeleteAdminUser()
  const updateActivate = useUpdateUserActivate()
  const updatePassword = useUpdateUserPassword()
  const grantAdmin = useGrantAdmin()

  // An expired or invalid admin token sends the page back to sign-in.
  const isAuthError = Boolean(
    error && (error as { message?: string }).message?.includes('401'),
  )
  useEffect(() => {
    if (isAuthError) onLogout()
  }, [isAuthError, onLogout])

  const filteredUsers = useMemo(() => {
    const needle = keyword.trim().toLowerCase()
    return users.filter((user) => {
      const matchesKeyword =
        !needle ||
        user.email.toLowerCase().includes(needle) ||
        user.nickname.toLowerCase().includes(needle)
      const matchesStatus =
        statusFilter === UserStatusFilter.ALL ||
        (statusFilter === UserStatusFilter.ACTIVE
          ? user.is_active
          : !user.is_active)
      return matchesKeyword && matchesStatus
    })
  }, [users, keyword, statusFilter])
  const active = users.filter((user) => user.is_active).length

  const handleCreate = useCallback(
    async (data: CreateUserParams) => {
      try {
        await createUser.mutateAsync(data)
        setCreateOpen(false)
        toast.success(t('settings.admin.messages.created'))
      } catch {
        toast.error(t('settings.admin.messages.createFailed'))
      }
    },
    [createUser, t],
  )
  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteUser.mutateAsync(deleting.user.email)
      toast.success(t('settings.admin.messages.deleted'))
      setDeleting(null)
    } catch {
      toast.error(t('settings.admin.messages.deleteFailed'))
    }
  }
  const handleToggleStatus = useCallback(
    async (user: AdminUser) => {
      try {
        await updateActivate.mutateAsync({
          username: user.email,
          activate: !user.is_active,
        })
        toast.success(
          t(
            user.is_active
              ? 'settings.admin.messages.deactivated'
              : 'settings.admin.messages.activated',
          ),
        )
      } catch {
        toast.error(t('settings.admin.messages.actionFailed'))
      }
    },
    [updateActivate, t],
  )
  const handleGrantAdmin = useCallback(
    async (user: AdminUser) => {
      try {
        await grantAdmin.mutateAsync(user.email)
        toast.success(
          t('settings.admin.messages.granted', {
            name: user.nickname || user.email,
          }),
        )
      } catch {
        toast.error(t('settings.admin.messages.actionFailed'))
      }
    },
    [grantAdmin, t],
  )
  const handlePasswordSubmit = useCallback(
    async (username: string, newPassword: string) => {
      try {
        await updatePassword.mutateAsync({ username, newPassword })
        setChangePassUser(null)
        toast.success(t('settings.admin.messages.passwordChanged'))
      } catch {
        toast.error(t('settings.admin.messages.passwordFailed'))
      }
    },
    [updatePassword, t],
  )

  if (isAuthError) return null

  const filtered =
    Boolean(keyword.trim()) || statusFilter !== UserStatusFilter.ALL
  let list
  if (isLoading)
    list = (
      <PageLoadingState
        compact
        title={t('common.loading')}
        description={null}
      />
    )
  else if (error)
    list = (
      <PageErrorState
        compact
        titleAs="h3"
        title={t('settings.admin.users.loadFailed')}
        description={null}
        retryLabel={t('common.retry')}
        onRetry={() => void refetch()}
      />
    )
  else if (filteredUsers.length === 0)
    list = (
      <PageEmptyState
        compact
        title={t(
          filtered
            ? 'settings.admin.users.noMatch'
            : 'settings.admin.users.empty',
        )}
        description={
          filtered
            ? null
            : t('settings.admin.users.emptyHint', {
                action: t('settings.admin.actions.createUser'),
              })
        }
      />
    )
  else
    list = (
      <UserTable
        users={filteredUsers}
        currentUserEmail={currentUserEmail}
        onChangePassword={setChangePassUser}
        onToggleStatus={(user) => void handleToggleStatus(user)}
        onGrantAdmin={(user) => void handleGrantAdmin(user)}
        onDelete={(user, returnFocus) => setDeleting({ user, returnFocus })}
      />
    )

  return (
    <>
      <SettingsTemplate
        width="wide"
        description={t('settings.admin.users.description')}
        actions={
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('common.refresh')}
              disabled={isRefetching}
              onClick={() => void refetch()}
            >
              <RefreshCw
                className={cn(
                  'size-icon-sm',
                  isRefetching && 'animate-spin motion-reduce:animate-none',
                )}
                aria-hidden="true"
              />
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LogOut className="size-icon-sm" aria-hidden="true" />}
              onClick={onLogout}
            >
              {t('settings.admin.actions.exitAdministration')}
            </Button>
          </>
        }
      >
        <SettingSection
          className={SETTINGS_CARD}
          title={t('settings.admin.users.title')}
          actions={
            <Button
              size="sm"
              leftIcon={
                <UserPlus className="size-icon-sm" aria-hidden="true" />
              }
              onClick={() => setCreateOpen(true)}
            >
              {t('settings.admin.actions.createUser')}
            </Button>
          }
        >
          <div className="flex flex-col gap-space-sm pb-space-sm">
            {users.length ? (
              <InlineStats
                items={[
                  {
                    key: 'total',
                    label: t('settings.admin.users.total'),
                    value: users.length,
                  },
                  {
                    key: 'active',
                    label: t('settings.admin.users.active'),
                    value: active,
                    tone: active ? 'success' : 'default',
                  },
                  {
                    key: 'inactive',
                    label: t('settings.admin.users.inactive'),
                    value: users.length - active,
                  },
                ]}
              />
            ) : null}
            <div className="flex flex-wrap items-center gap-space-sm">
              <Input
                type="search"
                inputSize="sm"
                className="w-full sm:w-64"
                aria-label={t('settings.admin.users.search')}
                placeholder={t('settings.admin.users.search')}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                leftIcon={
                  <Search className="size-icon-sm" aria-hidden="true" />
                }
              />
              <SegmentedControl
                aria-label={t('settings.admin.users.statusFilter')}
                size="sm"
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={[
                  {
                    value: UserStatusFilter.ALL,
                    label: t('settings.admin.users.all'),
                  },
                  {
                    value: UserStatusFilter.ACTIVE,
                    label: t('settings.admin.users.active'),
                  },
                  {
                    value: UserStatusFilter.INACTIVE,
                    label: t('settings.admin.users.inactive'),
                  },
                ]}
              />
            </div>
          </div>
          {list}
        </SettingSection>
      </SettingsTemplate>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isLoading={createUser.isPending}
      />
      <ChangePasswordDialog
        open={!!changePassUser}
        onOpenChange={(open) => !open && setChangePassUser(null)}
        user={changePassUser}
        onSubmit={handlePasswordSubmit}
        isLoading={updatePassword.isPending}
      />
      <ConfirmDialog
        variant="destructive"
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !deleteUser.isPending) setDeleting(null)
        }}
        title={t('settings.admin.users.deleteTitle')}
        description={t('settings.admin.users.deleteDescription', {
          name: deleting?.user.nickname || deleting?.user.email || '',
        })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('settings.admin.users.delete')}
        pending={deleteUser.isPending}
        returnFocus={deleting?.returnFocus}
        onConfirm={() => void confirmDelete()}
      />
    </>
  )
}

const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore()
  const [isAdminAuthed, setIsAdminAuthed] = useState(() => !!getAdminToken())

  // Verify a stored admin token once; a rejected one returns to sign-in.
  useEffect(() => {
    if (!getAdminToken()) return
    adminAPI.verify().catch(() => {
      setAdminToken(null)
      setIsAdminAuthed(false)
    })
  }, [])

  const handleLogout = useCallback(() => {
    setAdminToken(null)
    setIsAdminAuthed(false)
  }, [])

  return isAdminAuthed ? (
    <UsersPanel currentUserEmail={currentUser?.email} onLogout={handleLogout} />
  ) : (
    <AdminLoginForm onSuccess={() => setIsAdminAuthed(true)} />
  )
}

export default React.memo(AdminUsersPage)
export { AdminUsersPage }
