import type React from 'react'
import {
  BookOpen,
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
  title: string
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
    title: '首页',
    titleKey: 'layout.nav.home',
    href: ROUTES.HOME,
    icon: Home,
  },
  {
    title: '探索',
    titleKey: 'layout.nav.explore',
    href: ROUTES.EXPLORE,
    icon: Compass,
  },
  {
    title: '搜索',
    titleKey: 'layout.nav.search',
    href: ROUTES.SEARCH,
    icon: Search,
  },
  {
    title: '知识库',
    titleKey: 'layout.nav.knowledge',
    href: ROUTES.KNOWLEDGE,
    icon: BookOpen,
  },
  {
    title: '记忆库',
    titleKey: 'layout.nav.memory',
    href: ROUTES.MEMORY,
    icon: HardDrive,
  },
  {
    title: '智能体',
    titleKey: 'layout.nav.agents',
    href: ROUTES.AGENTS,
    icon: Workflow,
  },
  {
    title: '工作室',
    titleKey: 'layout.nav.studio',
    href: ROUTES.STUDIO,
    icon: Briefcase,
  },
  {
    title: '工具箱',
    titleKey: 'layout.nav.tools',
    href: ROUTES.AI_TOOLS,
    icon: Wrench,
  },
  {
    title: 'MCP',
    titleKey: 'layout.nav.mcp',
    href: ROUTES.MCP_SERVERS,
    icon: Server,
  },
]
