import * as React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Bell,
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

/** Shared account and appearance controls for global and settings navigation. */
export const SidebarUtilities = ({
  collapsed = false,
}: {
  collapsed?: boolean
}) => {
  const { t } = useTranslation()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const authenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)
  const notifications = useUIStore((state) => state.notifications)
  const language = useUIStore((state) => state.language)
  const setLanguage = useUIStore((state) => state.setLanguage)
  const theme = React.useSyncExternalStore(
    subscribeTheme,
    getTheme,
    () => Theme.SYSTEM,
  )
  const name = user?.nickname || user?.username || t('layout.sidebar.user')
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
        <NavigationTooltip content={name} enabled={collapsed}>
          <ActionMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('layout.sidebar.accountMenu', { name })}
              className={cn(
                'min-w-0 flex-1 justify-start px-space-xs text-text-secondary',
                collapsed && 'w-full justify-center',
              )}
            >
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={user?.avatar} alt="" />
                <AvatarFallback className="bg-background-subtle text-xs font-medium text-text-primary">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
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
      <ActionMenu>
        <NavigationTooltip content={t('layout.sidebar.notifications')}>
          <ActionMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative shrink-0 text-text-secondary"
              aria-label={t('layout.sidebar.notifications')}
            >
              <Bell className="size-icon-sm" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-radius-full bg-status-error px-space-2xs text-xs text-text-inverted">
                  {notifications.length}
                </span>
              )}
            </Button>
          </ActionMenuTrigger>
        </NavigationTooltip>
        <ActionMenuContent side="top" align="end" className="w-64">
          <ActionMenuLabel className="px-space-sm py-space-xs font-medium">
            {t('layout.sidebar.notifications')}
          </ActionMenuLabel>
          <ActionMenuSeparator />
          {notifications.length ? (
            notifications.map((notice) => (
              <div key={notice.id} className="px-space-sm py-space-sm">
                <p className="text-sm font-medium">{notice.title}</p>
                <p className="mt-space-xs text-xs text-text-secondary">
                  {notice.message}
                </p>
              </div>
            ))
          ) : (
            <p className="px-space-sm py-space-sm text-sm text-text-secondary">
              {t('layout.sidebar.noNotifications')}
            </p>
          )}
        </ActionMenuContent>
      </ActionMenu>
    </div>
  )
}
