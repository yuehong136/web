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

export interface TemplateCategory {
  /** Normalised `canvas_type`; also the `agents.templatesPage.categories` key. */
  key: string
  icon: LucideIcon
  isRecommended?: boolean
  isAll?: boolean
}

export const ALL_CATEGORY_KEY = 'all'
export const RECOMMENDED_KEY = 'recommended'
export const OTHER_KEY = 'other'

export const CATEGORY_ORDER: TemplateCategory[] = [
  { key: ALL_CATEGORY_KEY, icon: LayoutGrid, isAll: true },
  { key: RECOMMENDED_KEY, icon: Sparkles, isRecommended: true },
  { key: 'agent', icon: Bot },
  { key: 'customersupport', icon: MessageCircle },
  { key: 'marketing', icon: Megaphone },
  { key: 'consumerapp', icon: Box },
  { key: 'pipeline', icon: Database },
  { key: OTHER_KEY, icon: MoreHorizontal },
]

const CATEGORY_LOOKUP: Record<string, TemplateCategory> = Object.fromEntries(
  CATEGORY_ORDER.map((item) => [item.key, item]),
)

export function normalizeCategoryKey(canvasType: unknown): string {
  if (canvasType == null) return OTHER_KEY
  const raw = String(canvasType)
    .toLowerCase()
    .replace(/[_\s-]/g, '')
  if (!raw) return OTHER_KEY
  if (CATEGORY_LOOKUP[raw]) return raw
  return OTHER_KEY
}

export function getCategory(key: string): TemplateCategory {
  return CATEGORY_LOOKUP[key] || CATEGORY_LOOKUP[OTHER_KEY]
}

/** i18n key of a category label. */
export const categoryLabelKey = (key: string) =>
  `agents.templatesPage.categories.${getCategory(key).key}`
