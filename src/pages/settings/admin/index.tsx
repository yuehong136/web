import React, { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  UserPlus,
  Search,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageToolbar } from '@/components/patterns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/stores'
import { toast } from '@/lib/toast'
import { adminAPI, getAdminToken, setAdminToken } from '@/api/admin'
import { StatsBar } from './components/stats-bar'
import { UserTable } from './components/user-table'
import { CreateUserDialog } from './components/create-user-dialog'
import { ChangePasswordDialog } from './components/change-password-dialog'
import {
  useFetchAdminUsers,
  useCreateAdminUser,
  useDeleteAdminUser,
  useUpdateUserActivate,
  useUpdateUserPassword,
  useGrantAdmin,
} from './hooks/use-admin-users'
import { UserStatusFilter } from './types'
import type { AdminUser, CreateUserParams } from './types'

// ─── Filter Select ────────────────────────────────────────────────────────────

const FilterSelect: React.FC<{
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}> = memo(({ value, onChange, options }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-surface-secondary hover:bg-surface-tertiary h-10 w-36 rounded-radius-lg border-border-default px-space-base text-sm text-text-secondary">
        <SelectValue placeholder="请选择" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})
FilterSelect.displayName = 'FilterSelect'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const TableSkeleton: React.FC = () => (
  <div className="bg-surface-secondary animate-pulse overflow-hidden rounded-radius-lg border border-border-subtle">
    <div className="bg-surface-tertiary h-11" />
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-space-base border-t border-border-subtle px-space-md py-space-base"
      >
        <div className="bg-surface-tertiary h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="bg-surface-tertiary h-3.5 w-32 rounded-radius-lg" />
          <div className="bg-surface-tertiary h-3 w-48 rounded-radius-lg" />
        </div>
        <div className="bg-surface-tertiary h-5 w-14 rounded-full" />
        <div className="bg-surface-tertiary h-3.5 w-24 rounded-radius-lg" />
      </div>
    ))}
  </div>
)

// ─── Admin Login Form ─────────────────────────────────────────────────────────

interface AdminLoginFormProps {
  onSuccess: () => void
}

const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!email || !password) {
        setError('请填写邮箱和密码')
        return
      }
      setLoading(true)
      setError('')
      try {
        const { token } = await adminAPI.login(email, password)
        setAdminToken(token)
        onSuccess()
      } catch (err: any) {
        setError(err?.message || '登录失败，请检查管理员凭据')
      } finally {
        setLoading(false)
      }
    },
    [email, password, onSuccess],
  )

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-space-xl">
      <div className="w-full max-w-lg">
        <div className="rounded-radius-xl border border-border-subtle bg-background-surface p-space-2xl shadow-elevation-medium">
          <div className="mb-space-xl flex flex-col items-center gap-space-sm">
            <div className="bg-surface-accent/10 flex h-14 w-14 items-center justify-center rounded-2xl">
              <Lock className="h-7 w-7 text-text-accent" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary">
                管理员验证
              </h2>
              <p className="mt-space-xs text-sm text-text-tertiary">
                此功能需要管理员权限，请输入管理员凭据
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-space-lg">
            <div className="space-y-space-xs">
              <label className="text-sm font-medium text-text-secondary">
                管理员邮箱
              </label>
              <Input
                type="email"
                inputSize="sm"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
              />
            </div>
            <div className="space-y-space-xs">
              <label className="text-sm font-medium text-text-secondary">
                密码
              </label>
              <Input
                type={showPwd ? 'text' : 'password'}
                inputSize="sm"
                placeholder="管理员密码"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="text-text-tertiary transition-colors hover:text-text-secondary"
                  >
                    {showPwd ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            </div>
            {error && (
              <p className="rounded-radius-lg bg-status-error-subtle px-space-sm py-space-xs text-sm text-text-error">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="mt-space-sm h-10 w-full"
              disabled={loading}
            >
              {loading ? (
                '验证中...'
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  进入管理后台
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Users Panel ──────────────────────────────────────────────────────────────

const UsersPanel: React.FC<{
  currentUserEmail?: string
  onLogout: () => void
}> = ({ currentUserEmail, onLogout }) => {
  const { t } = useTranslation()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(UserStatusFilter.ALL)
  const [createOpen, setCreateOpen] = useState(false)
  const [changePassUser, setChangePassUser] = useState<AdminUser | null>(null)

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

  // If token expired/invalid, go back to login
  const isAuthError = error && (error as any)?.message?.includes('401')

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const kw = keyword.toLowerCase()
      const matchKw =
        !kw ||
        u.email.toLowerCase().includes(kw) ||
        u.nickname.toLowerCase().includes(kw)
      const matchStatus =
        statusFilter === UserStatusFilter.ALL ||
        (statusFilter === UserStatusFilter.ACTIVE ? u.is_active : !u.is_active)
      return matchKw && matchStatus
    })
  }, [users, keyword, statusFilter])

  const handleCreate = useCallback(
    async (data: CreateUserParams) => {
      try {
        await createUser.mutateAsync(data)
        setCreateOpen(false)
        toast.success('用户创建成功')
      } catch {
        toast.error('创建失败')
      }
    },
    [createUser],
  )

  const handleDelete = useCallback(
    async (user: AdminUser) => {
      if (
        !confirm(
          `确定要删除用户「${user.nickname || user.email}」吗？此操作不可恢复。`,
        )
      )
        return
      try {
        await deleteUser.mutateAsync(user.email)
        toast.success('用户已删除')
      } catch {
        toast.error('删除失败')
      }
    },
    [deleteUser],
  )

  const handleToggleStatus = useCallback(
    async (user: AdminUser) => {
      try {
        await updateActivate.mutateAsync({
          username: user.email,
          activate: !user.is_active,
        })
        toast.success(`用户已${user.is_active ? '停用' : '启用'}`)
      } catch {
        toast.error('操作失败')
      }
    },
    [updateActivate],
  )

  const handleGrantAdmin = useCallback(
    async (user: AdminUser) => {
      try {
        await grantAdmin.mutateAsync(user.email)
        toast.success(`已授予「${user.nickname || user.email}」管理员权限`)
      } catch {
        toast.error('操作失败')
      }
    },
    [grantAdmin],
  )

  const handleChangePassword = useCallback(
    (user: AdminUser) => setChangePassUser(user),
    [],
  )

  const handlePasswordSubmit = useCallback(
    async (username: string, newPassword: string) => {
      try {
        await updatePassword.mutateAsync({ username, newPassword })
        setChangePassUser(null)
        toast.success('密码修改成功')
      } catch {
        toast.error('修改失败')
      }
    },
    [updatePassword],
  )

  if (isAuthError) {
    onLogout()
    return null
  }

  return (
    <div className="space-y-space-xl">
      {/* Stats */}
      {!isLoading && users.length > 0 && <StatsBar users={users} />}

      {/* Toolbar */}
      <PageToolbar
        wrap
        surface="plain"
        className="rounded-radius-xl border border-border-subtle bg-background-surface p-space-sm"
        left={
          <div className="flex w-full flex-wrap items-center gap-space-sm">
            <div className="max-w-md min-w-0 flex-1 basis-60">
              <Input
                inputSize="sm"
                placeholder="搜索邮箱或昵称..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-text-tertiary" />}
                className="bg-surface-secondary h-10"
              />
            </div>
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: UserStatusFilter.ALL, label: '所有状态' },
                { value: UserStatusFilter.ACTIVE, label: '活跃' },
                { value: UserStatusFilter.INACTIVE, label: '已停用' },
              ]}
            />
            {keyword || statusFilter !== UserStatusFilter.ALL ? (
              <span className="text-xs text-text-tertiary">
                共 {filteredUsers.length} 条结果
              </span>
            ) : null}
          </div>
        }
        right={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="h-10 px-space-sm"
              title={t('settings.admin.actions.exitAdministration')}
              aria-label={t('settings.admin.actions.exitAdministration')}
            >
              <LogOut className="size-icon-sm" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-10 px-space-sm"
              aria-label={t('common.refresh')}
            >
              <RefreshCw
                className={`size-icon-sm ${isRefetching ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="h-10 px-space-md"
            >
              <UserPlus className="size-icon-sm" />
              {t('settings.admin.actions.createUser')}
            </Button>
          </>
        }
      />

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <UserTable
          users={filteredUsers}
          currentUserEmail={currentUserEmail}
          onChangePassword={handleChangePassword}
          onToggleStatus={handleToggleStatus}
          onGrantAdmin={handleGrantAdmin}
          onDelete={handleDelete}
        />
      )}

      {/* Dialogs */}
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
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore()
  const [isAdminAuthed, setIsAdminAuthed] = useState(() => !!getAdminToken())

  // Verify token on mount
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

  return (
    <div className="min-h-full bg-components-settings-content-bg p-space-xl">
      <div className="mx-auto max-w-6xl">
        {isAdminAuthed ? (
          <UsersPanel
            currentUserEmail={currentUser?.email}
            onLogout={handleLogout}
          />
        ) : (
          <AdminLoginForm onSuccess={() => setIsAdminAuthed(true)} />
        )}
      </div>
    </div>
  )
}

export default memo(AdminUsersPage)
export { AdminUsersPage }
