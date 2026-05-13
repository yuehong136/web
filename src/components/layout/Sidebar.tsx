import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Settings,
  User,
  Bell,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Check,
  PanelLeftClose,
  Languages,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { useUIStore, useAuthStore, useHomeStore } from '@/stores'
import { Theme, setTheme as setAppTheme, getTheme } from '@/themes'
import { supportedLocales, type ProductLocale } from '@/locales/i18n'
import { SidebarConversations } from './SidebarConversations'
import { navItems } from './sidebar-config'
import { SidebarTooltip } from './sidebar-tooltip'

interface SidebarProps {
  className?: string
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  allowCollapse?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  className,
  collapsed = false,
  onCollapsedChange,
  allowCollapse = true,
}) => {
  const { t } = useTranslation()
  const location = useLocation()
  const notifications = useUIStore((state) => state.notifications)
  const language = useUIStore((state) => state.language)
  const setLanguage = useUIStore((state) => state.setLanguage)
  const { user, isAuthenticated, logout } = useAuthStore()

  // 首页状态（用于显示应用对话历史）
  const {
    selectedApps,
    selectedConversationId,
    selectConversation,
    startNewConversation,
  } = useHomeStore()
  const isHomePage = location.pathname === '/' || location.pathname === '/home'

  // 内部折叠状态（如果没有外部控制）
  const [internalCollapsed, setInternalCollapsed] = React.useState(false)
  const resolvedCollapsed = onCollapsedChange ? collapsed : internalCollapsed
  const isCollapsed = allowCollapse ? resolvedCollapsed : false
  const setCollapsed = onCollapsedChange || setInternalCollapsed

  // 使用新的主题系统
  const [currentTheme, setCurrentTheme] = React.useState<Theme>(getTheme())

  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [showThemeMenu, setShowThemeMenu] = React.useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = React.useState(false)
  const [showNotifications, setShowNotifications] = React.useState(false)

  const unreadCount = notifications.length
  const currentLocale =
    supportedLocales.find((locale) => locale.code === language) ??
    supportedLocales[0]

  const handleThemeChange = (newTheme: Theme) => {
    setAppTheme(newTheme)
    setCurrentTheme(newTheme)
    setShowThemeMenu(false)
  }

  const handleLanguageChange = (nextLanguage: ProductLocale) => {
    setLanguage(nextLanguage)
    setShowLanguageMenu(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      setShowUserMenu(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const ThemeIcon = () => {
    switch (currentTheme) {
      case Theme.LIGHT:
        return <Sun className="h-5 w-5" />
      case Theme.DARK:
        return <Moon className="h-5 w-5" />
      case Theme.SYSTEM:
        return <Monitor className="h-5 w-5" />
      default:
        return <Monitor className="h-5 w-5" />
    }
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col rounded-none bg-components-sidebar-bg',
        // 使用 will-change 优化动画性能
        'transition-[width] duration-300 ease-out will-change-[width]',
        isCollapsed ? 'w-16' : 'w-56',
        className,
      )}
    >
      {/* Logo区域 - 固定高度(预留2行文字空间)避免展开/收起时跳动 */}
      <div
        className={cn(
          'pb-space-md pt-space-sm transition-[padding] duration-300',
          isCollapsed ? 'px-space-xs' : 'px-space-sm',
        )}
      >
        <div
          className={cn(
            'flex h-12 items-center',
            isCollapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <div
            className={cn(
              'flex min-w-0 cursor-pointer items-center',
              isCollapsed ? 'h-10 w-10 justify-center gap-0' : 'gap-3',
            )}
            onClick={
              allowCollapse && isCollapsed
                ? () => setCollapsed(false)
                : undefined
            }
            title={
              allowCollapse && isCollapsed
                ? t('layout.sidebar.expand', '展开侧边栏')
                : undefined
            }
            aria-label={t('layout.sidebar.expand', '展开侧边栏')}
          >
            {/* Logo - 固定尺寸，位置不变 */}
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'var(--color-components-gradient-primary)' }}
            >
              <span className="text-sm font-bold text-text-inverted">MR</span>
            </div>
            {/* 文字区域 - 支持换行，最多2行 */}
            <span
              className={cn(
                'text-base font-semibold leading-tight text-text-primary',
                'transition-[opacity,transform] duration-300 ease-out',
                isCollapsed
                  ? 'pointer-events-none w-0 translate-x-[-10px] overflow-hidden opacity-0'
                  : 'line-clamp-2 w-auto max-w-[120px] translate-x-0 break-words opacity-100 delay-100',
              )}
            >
              {t('layout.brandName', 'AI平台')}
            </span>
          </div>
          {/* 折叠按钮 */}
          {allowCollapse && !isCollapsed ? (
            <button
              onClick={() => setCollapsed(!isCollapsed)}
              className={cn(
                'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
                'text-components-icon-button-text hover:bg-components-icon-button-bg-hover hover:text-components-icon-button-text-hover',
                'transition-[opacity,transform] duration-200',
                'scale-100 opacity-100 delay-150',
              )}
              title={
                isCollapsed
                  ? t('layout.sidebar.expand', '展开侧边栏')
                  : t('layout.sidebar.collapse', '收起侧边栏')
              }
              aria-label={
                isCollapsed
                  ? t('layout.sidebar.expand', '展开侧边栏')
                  : t('layout.sidebar.collapse', '收起侧边栏')
              }
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="py-space-sm">
        <div
          className={cn(
            'space-y-space-2xs transition-[padding] duration-300',
            isCollapsed ? 'px-space-xs' : 'px-space-sm',
          )}
        >
          {navItems.map((item, index) => {
            const Icon = item.icon
            const title = t(item.titleKey, item.title)
            const isActive =
              item.href === ROUTES.AI_TOOLS
                ? location.pathname.startsWith(ROUTES.AI_TOOLS) ||
                  location.pathname.startsWith('/tools')
                : item.href === ROUTES.HOME
                  ? location.pathname === ROUTES.HOME ||
                    location.pathname === '/'
                  : item.href === ROUTES.AGENTS
                    ? location.pathname.startsWith(ROUTES.AGENTS) ||
                      location.pathname.startsWith('/agent')
                    : location.pathname.startsWith(item.href) ||
                      item.children?.some((child) =>
                        location.pathname.startsWith(child.href),
                      )

            return (
              <div key={item.href} className="space-y-1">
                <SidebarTooltip content={title} enabled={isCollapsed}>
                  <NavLink
                    to={item.href}
                    className={cn(
                      'group relative flex items-center rounded-xl',
                      'transition-all duration-200 ease-out',
                      isCollapsed
                        ? 'justify-center p-2.5'
                        : 'gap-3 px-3 py-2.5',
                      isActive
                        ? 'shadow-elevation-low bg-components-sidebar-item-bg-active text-components-sidebar-item-text-active'
                        : 'text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-text-primary',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                        isActive
                          ? 'text-components-sidebar-item-text-active'
                          : '',
                      )}
                    />
                    <span
                      className={cn(
                        'whitespace-nowrap text-sm font-medium',
                        'transition-all duration-300 ease-out',
                        isCollapsed
                          ? 'pointer-events-none w-0 translate-x-[-10px] opacity-0'
                          : 'w-auto translate-x-0 opacity-100',
                      )}
                      style={{
                        transitionDelay: isCollapsed
                          ? '0ms'
                          : `${50 + index * 20}ms`,
                      }}
                    >
                      {title}
                    </span>
                  </NavLink>
                </SidebarTooltip>

                {!isCollapsed && item.children?.length ? (
                  <div className="ml-11 space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon
                      const childTitle = child.titleKey
                        ? t(child.titleKey, child.title)
                        : child.title
                      const childActive = location.pathname.startsWith(
                        child.href,
                      )

                      return (
                        <NavLink
                          key={child.href}
                          to={child.href}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors',
                            childActive
                              ? 'bg-components-sidebar-item-bg-active text-components-sidebar-item-text-active'
                              : 'text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover',
                          )}
                        >
                          {ChildIcon ? (
                            <ChildIcon className="h-3.5 w-3.5" />
                          ) : null}
                          <span>{childTitle}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </nav>

      {/* 首页应用对话历史 - 条件渲染，使用 flex-1 充分利用空间 */}
      {isHomePage && selectedApps.length > 0 ? (
        <SidebarConversations
          appId={selectedApps[0]?.id}
          appName={selectedApps[0]?.name}
          currentConversationId={selectedConversationId}
          onSelectConversation={(conversationId) =>
            selectConversation(conversationId)
          }
          onCreateNew={startNewConversation}
          isCollapsed={isCollapsed}
        />
      ) : (
        /* 中间空白区域 - 将底部推到最下面（仅在非首页或无选中应用时显示） */
        <div className="flex-1" />
      )}

      {/* 底部功能区域 */}
      <div
        className={cn(
          'm-space-sm space-y-space-2xs rounded-radius-xl p-space-xs bg-background-subtle',
          'transition-[margin,padding] duration-300',
          isCollapsed && 'mx-space-xs',
        )}
      >
        {/* 通知按钮 */}
        <div className="relative">
          <SidebarTooltip
            content={t('layout.sidebar.notifications', '通知')}
            enabled={isCollapsed}
          >
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowThemeMenu(false)
                setShowLanguageMenu(false)
                setShowUserMenu(false)
              }}
              className={cn(
                'flex w-full items-center rounded-xl transition-all duration-200',
                isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                'text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-text-primary',
              )}
            >
              <Bell className="h-5 w-5 flex-shrink-0" />
              <span
                className={cn(
                  'whitespace-nowrap text-sm',
                  'transition-all duration-300 ease-out',
                  isCollapsed
                    ? 'pointer-events-none w-0 translate-x-[-10px] opacity-0'
                    : 'w-auto translate-x-0 opacity-100 delay-[250ms]',
                )}
              >
                {t('layout.sidebar.notifications', '通知')}
              </span>
              {unreadCount > 0 && (
                <span
                  className={cn(
                    'min-w-[18px] rounded-full bg-state-error text-center text-xs text-text-inverted',
                    isCollapsed
                      ? 'absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center'
                      : 'ml-auto px-1.5 py-0.5',
                  )}
                >
                  {isCollapsed ? '•' : unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </SidebarTooltip>

          {showNotifications && (
            <div
              className={cn(
                'absolute bottom-full z-50 mb-2 rounded-xl border border-border-default bg-components-dropdown-bg py-2 shadow-lg',
                isCollapsed ? 'left-full ml-2 w-80' : 'left-0 right-0 w-80',
              )}
            >
              <div className="border-b border-border-subtle px-4 py-2">
                <h3 className="font-medium text-text-primary">
                  {t('layout.sidebar.notifications', '通知')}
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-text-muted">
                    {t('layout.sidebar.noNotifications', '暂无通知')}
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="border-b border-border-subtle px-4 py-3 last:border-b-0 hover:bg-components-dropdown-item-bg-hover"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'mt-2 h-2 w-2 rounded-full',
                            notification.type === 'error'
                              ? 'bg-state-error'
                              : notification.type === 'warning'
                                ? 'bg-state-warning'
                                : notification.type === 'success'
                                  ? 'bg-state-success'
                                  : 'bg-text-accent',
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text-primary">
                            {notification.title}
                          </p>
                          <p className="mt-1 text-sm text-text-secondary">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            {new Date(
                              notification.timestamp,
                            ).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 主题切换 */}
        <div className="relative">
          <SidebarTooltip
            content={t('layout.sidebar.theme', '主题')}
            enabled={isCollapsed}
          >
            <button
              onClick={() => {
                setShowThemeMenu(!showThemeMenu)
                setShowLanguageMenu(false)
                setShowNotifications(false)
                setShowUserMenu(false)
              }}
              className={cn(
                'flex w-full items-center rounded-xl transition-all duration-200',
                isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                'text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-text-primary',
              )}
            >
              <ThemeIcon />
              <span
                className={cn(
                  'whitespace-nowrap text-sm',
                  'transition-all duration-300 ease-out',
                  isCollapsed
                    ? 'pointer-events-none w-0 translate-x-[-10px] opacity-0'
                    : 'w-auto translate-x-0 opacity-100 delay-[270ms]',
                )}
              >
                {t('layout.sidebar.theme', '主题')}
              </span>
            </button>
          </SidebarTooltip>

          {showThemeMenu && (
            <div
              className={cn(
                'absolute bottom-full z-50 mb-2 rounded-xl border border-border-default bg-components-dropdown-bg py-1 shadow-lg',
                isCollapsed ? 'left-full ml-2 w-36' : 'left-0 w-36',
              )}
            >
              <button
                onClick={() => handleThemeChange(Theme.LIGHT)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-components-dropdown-item-text transition-colors hover:bg-components-dropdown-item-bg-hover',
                  currentTheme === Theme.LIGHT &&
                    'bg-components-dropdown-item-bg-hover',
                )}
              >
                <Sun className="h-4 w-4" />
                {t('layout.sidebar.lightTheme', '浅色主题')}
                {currentTheme === Theme.LIGHT && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => handleThemeChange(Theme.DARK)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-components-dropdown-item-text transition-colors hover:bg-components-dropdown-item-bg-hover',
                  currentTheme === Theme.DARK &&
                    'bg-components-dropdown-item-bg-hover',
                )}
              >
                <Moon className="h-4 w-4" />
                {t('layout.sidebar.darkTheme', '深色主题')}
                {currentTheme === Theme.DARK && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => handleThemeChange(Theme.SYSTEM)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-components-dropdown-item-text transition-colors hover:bg-components-dropdown-item-bg-hover',
                  currentTheme === Theme.SYSTEM &&
                    'bg-components-dropdown-item-bg-hover',
                )}
              >
                <Monitor className="h-4 w-4" />
                {t('layout.sidebar.systemTheme', '跟随系统')}
                {currentTheme === Theme.SYSTEM && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* 语言切换 */}
        <div className="relative">
          <SidebarTooltip
            content={t('layout.sidebar.language', '语言')}
            enabled={isCollapsed}
          >
            <button
              onClick={() => {
                setShowLanguageMenu(!showLanguageMenu)
                setShowThemeMenu(false)
                setShowNotifications(false)
                setShowUserMenu(false)
              }}
              className={cn(
                'flex w-full items-center rounded-xl transition-all duration-200',
                isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                'text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-text-primary',
              )}
            >
              <Languages className="h-5 w-5 flex-shrink-0" />
              <span
                className={cn(
                  'whitespace-nowrap text-sm',
                  'transition-all duration-300 ease-out',
                  isCollapsed
                    ? 'pointer-events-none w-0 translate-x-[-10px] opacity-0'
                    : 'w-auto translate-x-0 opacity-100 delay-[280ms]',
                )}
              >
                {currentLocale.nativeLabel}
              </span>
            </button>
          </SidebarTooltip>

          {showLanguageMenu && (
            <div
              className={cn(
                'absolute bottom-full z-50 mb-2 rounded-xl border border-border-default bg-components-dropdown-bg py-1 shadow-lg',
                isCollapsed ? 'left-full ml-2 w-44' : 'left-0 w-44',
              )}
            >
              {supportedLocales.map((locale) => (
                <button
                  key={locale.code}
                  onClick={() => handleLanguageChange(locale.code)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-components-dropdown-item-text transition-colors hover:bg-components-dropdown-item-bg-hover',
                    language === locale.code &&
                      'bg-components-dropdown-item-bg-hover',
                  )}
                >
                  <span>{locale.nativeLabel}</span>
                  {language === locale.code && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 用户信息 */}
        {isAuthenticated ? (
          <div className="relative">
            <SidebarTooltip
              content={
                user?.nickname ||
                user?.username ||
                t('layout.sidebar.user', '用户')
              }
              enabled={isCollapsed}
            >
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu)
                  setShowThemeMenu(false)
                  setShowLanguageMenu(false)
                  setShowNotifications(false)
                }}
                className={cn(
                  'flex w-full items-center rounded-xl transition-all duration-200',
                  isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                  'text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-text-primary',
                )}
              >
                {/* 头像：优先显示用户上传的头像，没有则显示首字母 */}
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="avatar"
                    className="h-6 w-6 flex-shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: 'var(--color-components-gradient-secondary)',
                    }}
                  >
                    <span className="text-xs font-bold text-text-inverted">
                      {user?.nickname?.[0] || user?.username?.[0] || 'U'}
                    </span>
                  </div>
                )}
                <span
                  className={cn(
                    'truncate whitespace-nowrap text-sm',
                    'transition-all duration-300 ease-out',
                    isCollapsed
                      ? 'pointer-events-none w-0 translate-x-[-10px] opacity-0'
                      : 'w-auto translate-x-0 opacity-100 delay-[290ms]',
                  )}
                >
                  {user?.nickname ||
                    user?.username ||
                    t('layout.sidebar.user', '用户')}
                </span>
              </button>
            </SidebarTooltip>

            {showUserMenu && (
              <div
                className={cn(
                  'absolute bottom-full z-50 mb-2 rounded-xl border border-border-default bg-components-dropdown-bg py-1 shadow-lg',
                  isCollapsed ? 'left-full ml-2 w-48' : 'left-0 right-0',
                )}
              >
                <div className="border-b border-border-subtle px-3 py-2">
                  <p className="text-sm font-medium text-text-primary">
                    {user?.nickname || user?.username}
                  </p>
                  <p className="text-xs text-text-secondary">{user?.email}</p>
                </div>

                <NavLink
                  to="/settings/profile"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-components-dropdown-item-text hover:bg-components-dropdown-item-bg-hover"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="h-4 w-4" />
                  {t('layout.sidebar.profile', '个人资料')}
                </NavLink>

                <NavLink
                  to="/settings"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-components-dropdown-item-text hover:bg-components-dropdown-item-bg-hover"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  {t('layout.sidebar.settings', '设置')}
                </NavLink>

                <div className="mt-1 border-t border-border-subtle pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-secondary transition-colors duration-150 hover:bg-state-error-subtle hover:text-text-error"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('layout.sidebar.logout', '退出登录')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <SidebarTooltip
            content={t('layout.sidebar.login', '登录')}
            enabled={isCollapsed}
          >
            <NavLink
              to="/auth/login"
              className={cn(
                'flex items-center rounded-xl transition-all duration-200',
                isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                'text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-text-primary',
              )}
            >
              <User className="h-5 w-5 flex-shrink-0" />
              <span
                className={cn(
                  'whitespace-nowrap text-sm',
                  'transition-all duration-300 ease-out',
                  isCollapsed
                    ? 'pointer-events-none w-0 translate-x-[-10px] opacity-0'
                    : 'w-auto translate-x-0 opacity-100 delay-[290ms]',
                )}
              >
                {t('layout.sidebar.login', '登录')}
              </span>
            </NavLink>
          </SidebarTooltip>
        )}

        {/* 版本信息 */}
        <div
          className={cn(
            'overflow-hidden pt-2 text-center',
            'transition-all duration-300 ease-out',
            isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100 delay-[350ms]',
          )}
        >
          <p className="whitespace-nowrap text-xs text-text-muted">v0.9.8</p>
        </div>
      </div>

      {/* 点击外部关闭菜单的处理 */}
      {(showUserMenu ||
        showThemeMenu ||
        showLanguageMenu ||
        showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false)
            setShowThemeMenu(false)
            setShowLanguageMenu(false)
            setShowNotifications(false)
          }}
        />
      )}
    </aside>
  )
}
