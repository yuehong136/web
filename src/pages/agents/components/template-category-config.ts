import {
  Bot,
  Box,
  Database,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export type CategoryTone = 'info' | 'success' | 'warning' | 'purple' | 'neutral'

export interface TemplateCategory {
  key: string
  label: string
  icon: LucideIcon
  tone: CategoryTone
  isRecommended?: boolean
  isAll?: boolean
}

export const ALL_CATEGORY_KEY = 'all'
export const RECOMMENDED_KEY = 'recommended'
export const OTHER_KEY = 'other'

export const CATEGORY_ORDER: TemplateCategory[] = [
  { key: ALL_CATEGORY_KEY, label: '全部模板', icon: LayoutGrid, tone: 'neutral', isAll: true },
  { key: RECOMMENDED_KEY, label: '精选推荐', icon: Sparkles, tone: 'purple', isRecommended: true },
  { key: 'agent', label: 'Agent 通用', icon: Bot, tone: 'info' },
  { key: 'customersupport', label: '客户支持', icon: MessageCircle, tone: 'success' },
  { key: 'marketing', label: '营销', icon: Megaphone, tone: 'warning' },
  { key: 'consumerapp', label: '消费者应用', icon: Box, tone: 'info' },
  { key: 'pipeline', label: 'Pipeline 流水线', icon: Database, tone: 'warning' },
  { key: OTHER_KEY, label: '其他', icon: MoreHorizontal, tone: 'neutral' },
]

const CATEGORY_LOOKUP: Record<string, TemplateCategory> = CATEGORY_ORDER.reduce(
  (acc, item) => {
    acc[item.key] = item
    return acc
  },
  {} as Record<string, TemplateCategory>,
)

export function normalizeCategoryKey(canvasType: unknown): string {
  if (canvasType == null) return OTHER_KEY
  const raw = String(canvasType).toLowerCase().replace(/[_\s-]/g, '')
  if (!raw) return OTHER_KEY
  if (CATEGORY_LOOKUP[raw]) return raw
  return OTHER_KEY
}

export function getCategory(key: string): TemplateCategory {
  return CATEGORY_LOOKUP[key] || CATEGORY_LOOKUP[OTHER_KEY]
}

const TONE_CLASSES: Record<CategoryTone, { bg: string; text: string }> = {
  info: { bg: 'bg-state-info-subtle', text: 'text-state-info' },
  success: { bg: 'bg-state-success-subtle', text: 'text-state-success' },
  warning: { bg: 'bg-state-warning-subtle', text: 'text-state-warning' },
  purple: {
    bg: 'bg-components-avatar-gradient-purple-from/15',
    text: 'text-components-badge-purple-text',
  },
  neutral: { bg: 'bg-background-subtle', text: 'text-text-secondary' },
}

export function getToneClasses(tone: CategoryTone) {
  return TONE_CLASSES[tone]
}
