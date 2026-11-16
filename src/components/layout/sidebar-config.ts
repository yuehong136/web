import type React from 'react'
import {
  BookOpen,
  Library,
  Briefcase,
  Compass,
  HardDrive,
  Home,
  Search,
  Server,
  Workflow,
  Wrench,
} from 'lucide-react'
import { ROUTES } from '@/constants'

export interface NavItem {
  /** Label key under `layout.nav`; the label itself lives in the catalogs. */
  titleKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: Array<{
    title: string
    titleKey?: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
  }>
}

export const navItems: NavItem[] = [
  {
    titleKey: 'layout.nav.home',
    href: ROUTES.HOME,
    icon: Home,
  },
  {
    titleKey: 'layout.nav.explore',
    href: ROUTES.EXPLORE,
    icon: Compass,
  },
  {
    titleKey: 'layout.nav.search',
    href: ROUTES.SEARCH,
    icon: Search,
  },
  {
    titleKey: 'layout.nav.knowledge',
    href: ROUTES.KNOWLEDGE,
    icon: BookOpen,
  },
  {
    titleKey: 'layout.nav.skills',
    href: ROUTES.SKILLS,
    icon: Library,
  },
  {
    titleKey: 'layout.nav.memory',
    href: ROUTES.MEMORY,
    icon: HardDrive,
  },
  {
    titleKey: 'layout.nav.agents',
    href: ROUTES.AGENTS,
    icon: Workflow,
  },
  {
    titleKey: 'layout.nav.studio',
    href: ROUTES.STUDIO,
    icon: Briefcase,
  },
  {
    titleKey: 'layout.nav.tools',
    href: ROUTES.AUTO_FILL,
    icon: Wrench,
  },
  {
    titleKey: 'layout.nav.mcp',
    href: ROUTES.MCP_SERVERS,
    icon: Server,
  },
]
