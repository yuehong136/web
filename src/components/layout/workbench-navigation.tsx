import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Settings, Rocket } from 'lucide-react'
import { ROUTES } from '@/constants'
import { useHomeStore } from '@/stores/home'
import type { ContextRailGroup } from '@/components/patterns/context-rail'
import { SidebarConversations } from '@/components/layout/SidebarConversations'
import { navItems } from '@/components/layout/sidebar-config'
import { Button } from '@/components/ui/button'

export type WorkbenchSection =
  | 'home'
  | 'explore'
  | 'knowledge'
  | 'agents'
  | 'tools'
  | 'settings'
export interface SecondaryNavigation {
  section: WorkbenchSection
  title: string
  groups: ContextRailGroup[]
  backLink?: { href: string; label: string }
  content?: React.ReactNode
  contentOnly?: boolean
  /** Route context displayed alongside the navigation toggle in the top bar. */
  header?: React.ReactNode
}

const NavigationContext = React.createContext<{
  definition: SecondaryNavigation | null
  register: React.Dispatch<React.SetStateAction<SecondaryNavigation | null>>
} | null>(null)
const NavigationRegistrationContext = React.createContext<React.Dispatch<
  React.SetStateAction<SecondaryNavigation | null>
> | null>(null)

export const WorkbenchNavigationProvider = ({
  children,
}: React.PropsWithChildren) => {
  const [definition, register] = React.useState<SecondaryNavigation | null>(
    null,
  )
  const value = React.useMemo(() => ({ definition, register }), [definition])
  return (
    <NavigationContext.Provider value={value}>
      <NavigationRegistrationContext.Provider value={register}>
        {children}
      </NavigationRegistrationContext.Provider>
    </NavigationContext.Provider>
  )
}

export const useWorkbenchNavigation = () => React.useContext(NavigationContext)

/** Route containers supply their navigation; the workbench owns its presentation. */
export const useRegisterSecondaryNavigation = (
  definition: SecondaryNavigation | null,
) => {
  const register = React.useContext(NavigationRegistrationContext)
  React.useEffect(() => {
    if (!register || !definition) return
    register(definition)
    return () =>
      register((current) => (current === definition ? null : current))
  }, [definition, register])
  return Boolean(register)
}

/** Existing feature containers contribute their panel without a second sidebar. */
export const ManagedSecondaryNavigation = ({
  section,
  title,
  children,
  fallbackClassName,
}: React.PropsWithChildren<{
  section: WorkbenchSection
  title: string
  fallbackClassName: string
}>) => {
  const definition = React.useMemo(
    () => ({
      section,
      title,
      groups: [],
      content: children,
      contentOnly: true,
    }),
    [section, title, children],
  )
  const managed = useRegisterSecondaryNavigation(definition)
  return managed ? null : <div className={fallbackClassName}>{children}</div>
}

export const getWorkbenchSection = (pathname: string): WorkbenchSection => {
  if (pathname === '/settings' || pathname.startsWith('/settings/'))
    return 'settings'
  if (
    pathname.startsWith('/knowledge') ||
    pathname.startsWith('/memory') ||
    pathname.startsWith('/skills')
  )
    return 'knowledge'
  if (
    pathname.startsWith('/agents') ||
    pathname.startsWith('/agent') ||
    pathname.startsWith('/studio')
  )
    return 'agents'
  if (pathname.startsWith('/explore') || pathname.startsWith('/search'))
    return 'explore'
  if (
    pathname.startsWith('/ai-tools') ||
    pathname.startsWith('/tools') ||
    pathname.startsWith('/mcp')
  )
    return 'tools'
  return 'home'
}

const HomeConversations = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const app = useHomeStore((state) => state.selectedApps[0])
  const conversationId = useHomeStore((state) => state.selectedConversationId)
  const selectConversation = useHomeStore((state) => state.selectConversation)
  const startNewConversation = useHomeStore(
    (state) => state.startNewConversation,
  )
  if (!app)
    return (
      <div className="flex flex-col gap-space-sm px-space-base py-space-lg">
        <p className="text-sm text-text-secondary">
          {t('layout.sidebar.chooseAppForConversations')}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.EXPLORE}>{t('layout.sidebar.browseApps')}</Link>
        </Button>
      </div>
    )
  return (
    <SidebarConversations
      appId={app.id}
      appName={app.name}
      currentConversationId={conversationId}
      isCollapsed={false}
      onSelectConversation={(id) => {
        selectConversation(id)
        navigate(ROUTES.HOME)
      }}
      onCreateNew={() => {
        startNewConversation()
        navigate(ROUTES.HOME)
      }}
    />
  )
}

export const useDefaultSecondaryNavigation = () => {
  const { t } = useTranslation()
  return React.useMemo(() => {
    const sections: Record<WorkbenchSection, SecondaryNavigation> = {
      home: {
        section: 'home',
        title: t('layout.nav.home'),
        groups: [],
        content: <HomeConversations />,
      },
      explore: {
        section: 'explore',
        title: t('layout.nav.explore'),
        groups: [],
      },
      knowledge: {
        section: 'knowledge',
        title: t('layout.nav.knowledge'),
        groups: [],
      },
      agents: { section: 'agents', title: t('layout.nav.agents'), groups: [] },
      tools: { section: 'tools', title: t('layout.nav.tools'), groups: [] },
      settings: {
        section: 'settings',
        title: t('settings.title'),
        groups: [
          {
            items: [
              {
                title: t('settings.nav.profile'),
                href: ROUTES.SETTINGS_PROFILE,
                icon: Settings,
              },
            ],
          },
        ],
      },
    }
    for (const item of navItems) {
      if (item.href === ROUTES.HOME) continue
      const section = sections[getWorkbenchSection(item.href)]
      if (!section.groups.length) section.groups.push({ items: [] })
      section.groups[0].items.push({
        title: t(item.titleKey),
        href: item.href,
        icon: item.icon,
      })
    }
    sections.tools.groups[0].items.push({
      title: t('mcp.servers.playgroundTitle'),
      href: '/mcp-chat',
      icon: Rocket,
    })
    return sections
  }, [t])
}
