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
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: Array<{
    title: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
  }>
}

export const navItems: NavItem[] = [
  {
    title: '首页',
    href: ROUTES.HOME,
    icon: Home,
  },
  {
    title: '探索',
    href: ROUTES.EXPLORE,
    icon: Compass,
  },
  {
    title: '搜索',
    href: ROUTES.SEARCH,
    icon: Search,
  },
  {
    title: '知识库',
    href: ROUTES.KNOWLEDGE,
    icon: BookOpen,
  },
  {
    title: '记忆库',
    href: ROUTES.MEMORY,
    icon: HardDrive,
  },
  {
    title: '智能体',
    href: ROUTES.AGENTS,
    icon: Workflow,
  },
  {
    title: '工作室',
    href: ROUTES.STUDIO,
    icon: Briefcase,
  },
  {
    title: '工具箱',
    href: ROUTES.AI_TOOLS,
    icon: Wrench,
  },
  {
    title: 'MCP',
    href: ROUTES.MCP_SERVERS,
    icon: Server,
  },
]
