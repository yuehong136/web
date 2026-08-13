import type React from 'react'
import {
  Bot,
  Brain,
  BriefcaseBusiness,
  Compass,
  Database,
  Home,
  Search,
  Server,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { ROUTES } from '@/constants'
import { DesktopActivity } from '@/stores/ui'

export interface DesktopNavigationItem {
  labelKey: string
  fallbackLabel: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export const desktopNavigationItems: Record<
  DesktopActivity,
  DesktopNavigationItem[]
> = {
  [DesktopActivity.WORK]: [
    {
      labelKey: 'layout.nav.home',
      fallbackLabel: 'Home',
      href: ROUTES.HOME,
      icon: Home,
    },
  ],
  [DesktopActivity.DISCOVER]: [
    {
      labelKey: 'layout.nav.explore',
      fallbackLabel: 'Explore',
      href: ROUTES.EXPLORE,
      icon: Compass,
    },
    {
      labelKey: 'layout.nav.search',
      fallbackLabel: 'Search',
      href: ROUTES.SEARCH,
      icon: Search,
    },
  ],
  [DesktopActivity.KNOWLEDGE]: [
    {
      labelKey: 'layout.nav.knowledge',
      fallbackLabel: 'Knowledge',
      href: ROUTES.KNOWLEDGE,
      icon: Database,
    },
    {
      labelKey: 'layout.nav.memory',
      fallbackLabel: 'Memory',
      href: ROUTES.MEMORY,
      icon: Brain,
    },
  ],
  [DesktopActivity.BUILD]: [
    {
      labelKey: 'layout.nav.agents',
      fallbackLabel: 'Agents',
      href: ROUTES.AGENTS,
      icon: Bot,
    },
    {
      labelKey: 'layout.nav.studio',
      fallbackLabel: 'Studio',
      href: ROUTES.STUDIO,
      icon: BriefcaseBusiness,
    },
  ],
  [DesktopActivity.TOOLS]: [
    {
      labelKey: 'layout.nav.tools',
      fallbackLabel: 'Tools',
      href: ROUTES.AI_TOOLS,
      icon: Wrench,
    },
    {
      labelKey: 'layout.nav.mcp',
      fallbackLabel: 'MCP',
      href: ROUTES.MCP_SERVERS,
      icon: Server,
    },
  ],
}

export const desktopActivityIcons: Record<
  DesktopActivity,
  React.ComponentType<{ className?: string }>
> = {
  [DesktopActivity.WORK]: Sparkles,
  [DesktopActivity.DISCOVER]: Compass,
  [DesktopActivity.KNOWLEDGE]: Database,
  [DesktopActivity.BUILD]: Bot,
  [DesktopActivity.TOOLS]: Wrench,
}
