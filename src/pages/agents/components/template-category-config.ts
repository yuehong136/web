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
  /** Category colour: an avatar tint pair, so both themes stay AA. */
  tone: string
  isRecommended?: boolean
  isAll?: boolean
}

export const ALL_CATEGORY_KEY = 'all'
export const RECOMMENDED_KEY = 'recommended'
export const OTHER_KEY = 'other'

// Static class strings so Tailwind sees every tint.
export const CATEGORY_ORDER: TemplateCategory[] = [
  {
    key: ALL_CATEGORY_KEY,
    icon: LayoutGrid,
    tone: 'bg-background-subtle text-text-secondary',
    isAll: true,
  },
  {
    key: RECOMMENDED_KEY,
    icon: Sparkles,
    tone: 'bg-components-avatar-2-bg text-components-avatar-2-text',
    isRecommended: true,
  },
  {
    key: 'agent',
    icon: Bot,
    tone: 'bg-components-avatar-7-bg text-components-avatar-7-text',
  },
  {
    key: 'customersupport',
    icon: MessageCircle,
    tone: 'bg-components-avatar-6-bg text-components-avatar-6-text',
  },
  {
    key: 'marketing',
    icon: Megaphone,
    tone: 'bg-components-avatar-8-bg text-components-avatar-8-text',
  },
  {
    key: 'consumerapp',
    icon: Box,
    tone: 'bg-components-avatar-5-bg text-components-avatar-5-text',
  },
  {
    key: 'pipeline',
    icon: Database,
    tone: 'bg-components-avatar-4-bg text-components-avatar-4-text',
  },
  {
    key: OTHER_KEY,
    icon: MoreHorizontal,
    tone: 'bg-components-avatar-3-bg text-components-avatar-3-text',
  },
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
