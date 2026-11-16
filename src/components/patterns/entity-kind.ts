import {
  BookOpen,
  Bot,
  Layers,
  MessageSquare,
  Plug,
  Search,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/** What an avatar stands for; drives the fallback glyph and the corner badge. */
export type EntityKind =
  | 'chat'
  | 'agent'
  | 'knowledge'
  | 'search'
  | 'memory'
  | 'skill'
  | 'workflow'
  | 'mcp'
  | 'team'

export const ENTITY_KIND_ICON: Record<EntityKind, LucideIcon> = {
  chat: MessageSquare,
  agent: Bot,
  knowledge: BookOpen,
  search: Search,
  memory: Layers,
  skill: Zap,
  workflow: Workflow,
  mcp: Plug,
  team: Users,
}

/**
 * Zero-based avatar tone per kind (tomato, amber, olive, green, teal, blue,
 * violet, pink), so a kind keeps one color wherever it is shown by kind.
 */
export const ENTITY_KIND_TONE: Record<EntityKind, number> = {
  chat: 5,
  agent: 6,
  knowledge: 4,
  search: 1,
  memory: 7,
  skill: 3,
  workflow: 6,
  mcp: 0,
  team: 2,
}
