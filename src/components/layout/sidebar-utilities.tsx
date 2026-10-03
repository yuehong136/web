import * as React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Users,
  ChevronDown,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Settings,
  Sun,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NavigationTooltip } from '@/components/ui/navigation-tooltip'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuLabel,
  ActionMenuRadioGroup,
  ActionMenuRadioItem,
  ActionMenuSeparator,
  ActionMenuSub,
  ActionMenuSubContent,
  ActionMenuSubTrigger,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { useAuthStore, useUIStore } from '@/stores'
import { getTheme, setTheme, subscribeTheme, Theme } from '@/themes'
import { supportedLocales, type ProductLocale } from '@/locales/i18n'
import { cn } from '@/lib/utils'
import { usePendingTeamInvitations } from '@/hooks/use-pending-team-invitations'
import { useTeamStore } from '@/stores/team'

/** Shared account and appearance controls for global and settings navigation. */
export const SidebarUtilities = ({
  collapsed = false,
}: {
  collapsed?: boolean
}) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { pendingCount } = usePendingTeamInvitations()
  const setActiveTab = useTeamStore((state) => state.setActiveTab)
  const user = useAuthStore((state) => state.user)
  const authenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)
  const language = useUIStore((state) => state.language)
  const setLanguage = useUIStore((state) => state.setLanguage)
  const theme = React.useSyncExternalStore(
    subscribeTheme,
    getTheme,
    () => Theme.SYSTEM,
  )
  const name = user?.nickname || user?.username || t('layout.sidebar.user')
  const pendingLabel = t('layout.invitations.pending', { count: pendingCount })
  const pendingDescriptionId = React.useId()
  const origin = location.pathname.startsWith('/settings')
    ? '/home'
    : location.pathname
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div
      className={cn('flex items-center gap-space-xs', collapsed && 'flex-col')}
    >
      <ActionMenu>
        <NavigationTooltip
          content={pendingCount > 0 ? `${name} · ${pendingLabel}` : name}
          enabled={collapsed}
        >
          <ActionMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('layout.sidebar.accountMenu', { name })}
              aria-describedby={
                pendingCount > 0 ? pendingDescriptionId : undefined
              }
              className={cn(
                'min-w-0 flex-1 justify-start px-space-xs text-text-secondary',
                collapsed && 'w-full justify-center',
              )}
            >
              <span className="relative shrink-0">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user?.avatar} alt="" />
                  <AvatarFallback className="bg-background-subtle text-xs font-medium text-text-primary">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {pendingCount > 0 && (
                  <>
                    <span
                      aria-hidden
                      data-pending-invitations={pendingCount}
                      className="absolute -top-0.5 -right-0.5 size-1.5 rounded-radius-full bg-text-secondary ring-2 ring-components-sidebar-bg"
                    />
                    <span id={pendingDescriptionId} className="sr-only">
                      {pendingLabel}
                    </span>
                  </>
                )}
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate text-left">
                    {name}
                  </span>
                  <ChevronDown className="size-icon-sm shrink-0" />
                </>
              )}
            </Button>
          </ActionMenuTrigger>
        </NavigationTooltip>
        <ActionMenuContent side="top" align="start" className="w-56">
          <ActionMenuLabel className="flex items-center gap-space-sm px-space-sm py-space-sm">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={user?.avatar} alt="" />
              <AvatarFallback className="bg-background-subtle text-sm font-medium">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{name}</p>
              {user?.email && (
                <p className="truncate text-xs font-normal text-text-secondary">
                  {user.email}
                </p>
              )}
            </div>
          </ActionMenuLabel>
          <ActionMenuSeparator />
          {authenticated ? (
            <>
              <ActionMenuItem asChild>
                <NavLink to="/settings" state={{ returnTo: origin }}>
                  <Settings className="size-icon-sm" />
                  {t('layout.sidebar.settings')}
                </NavLink>
              </ActionMenuItem>
            </>
          ) : (
            <ActionMenuItem asChild>
              <NavLink to="/auth/login">
                <User className="size-icon-sm" />
                {t('layout.sidebar.login')}
              </NavLink>
            </ActionMenuItem>
          )}
          {authenticated && pendingCount > 0 && (
            <ActionMenuItem
              onSelect={() => {
                setActiveTab('joined-teams')
                navigate('/settings/team', { state: { returnTo: origin } })
              }}
            >
              <Users className="size-icon-sm" />
              <span className="flex-1">{t('layout.invitations.title')}</span>
              <span className="rounded-radius-sm bg-background-subtle px-space-xs text-xs text-text-secondary tabular-nums">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            </ActionMenuItem>
          )}
          <ActionMenuSub>
            <ActionMenuSubTrigger>
              <Palette className="size-icon-sm" />
              {t('layout.sidebar.preferences')}
            </ActionMenuSubTrigger>
            <ActionMenuSubContent
              sideOffset={6}
              collisionPadding={8}
              className="w-52"
            >
              <ActionMenuLabel className="px-space-sm py-space-xs text-xs text-text-secondary">
                {t('layout.sidebar.theme')}
              </ActionMenuLabel>
              <ActionMenuRadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as Theme)}
              >
                <ActionMenuRadioItem value={Theme.LIGHT}>
                  <Sun className="size-icon-sm" />
                  {t('layout.sidebar.lightTheme')}
                </ActionMenuRadioItem>
                <ActionMenuRadioItem value={Theme.DARK}>
                  <Moon className="size-icon-sm" />
                  {t('layout.sidebar.darkTheme')}
                </ActionMenuRadioItem>
                <ActionMenuRadioItem value={Theme.SYSTEM}>
                  <Monitor className="size-icon-sm" />
                  {t('layout.sidebar.systemTheme')}
                </ActionMenuRadioItem>
              </ActionMenuRadioGroup>
              <ActionMenuSeparator />
              <ActionMenuLabel className="px-space-sm py-space-xs text-xs text-text-secondary">
                {t('layout.sidebar.language')}
              </ActionMenuLabel>
              <ActionMenuRadioGroup
                value={language}
                onValueChange={(value) => setLanguage(value as ProductLocale)}
              >
                {supportedLocales.map((locale) => (
                  <ActionMenuRadioItem key={locale.code} value={locale.code}>
                    {locale.nativeLabel}
                  </ActionMenuRadioItem>
                ))}
              </ActionMenuRadioGroup>
            </ActionMenuSubContent>
          </ActionMenuSub>
          {authenticated && (
            <>
              <ActionMenuSeparator />
              <ActionMenuItem danger onSelect={() => void handleLogout()}>
                <LogOut className="size-icon-sm" />
                {t('layout.sidebar.logout')}
              </ActionMenuItem>
            </>
          )}
        </ActionMenuContent>
      </ActionMenu>
    </div>
  )
}
