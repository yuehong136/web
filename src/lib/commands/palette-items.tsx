import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Monitor,
  Moon,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/constants'
import { navItems } from '@/components/layout/sidebar-config'
import { setTheme, Theme } from '@/themes'
import { getCommandShortcutKeys } from './keyboard'
import { ProductCommandId, type ProductCommand } from './types'

/** Result groups, in display order. */
export const PALETTE_GROUPS = [
  'conversations',
  'knowledge',
  'apps',
  'navigation',
  'commands',
] as const
export type PaletteGroup = (typeof PALETTE_GROUPS)[number]

/** What the scope switch narrows to; `commands` covers navigation too. */
export const PALETTE_SCOPES = [
  'all',
  'conversations',
  'knowledge',
  'apps',
  'commands',
] as const
export type PaletteScope = (typeof PALETTE_SCOPES)[number]

export const groupInScope = (group: PaletteGroup, scope: PaletteScope) =>
  scope === 'all' ||
  group === scope ||
  (scope === 'commands' && group === 'navigation')

export interface PaletteItem {
  /** Unique cmdk value; command items keep their command id in it. */
  value: string
  group: PaletteGroup
  title: string
  subtitle?: string
  /** Trailing note such as a relative time. */
  meta?: string
  keys?: readonly string[]
  icon: React.ReactNode
  /** Extra text that matches the query without being shown. */
  keywords?: string
  disabled?: boolean
  run: () => void
}

const normalize = (value: string) => value.trim().toLocaleLowerCase()

/** Every whitespace-separated term of the query appears in the text. */
export const matchesQuery = (text: string, query: string) => {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  const haystack = normalize(text)
  return terms.every((term) => haystack.includes(term))
}

/** Marks the first occurrence of the whole query, case-insensitively. */
export const highlightMatch = (text: string, query: string) => {
  const needle = normalize(query)
  const index = needle ? text.toLocaleLowerCase().indexOf(needle) : -1
  if (index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-transparent font-semibold text-text-accent">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  )
}

const icon = (Icon: LucideIcon) => (
  <Icon className="size-icon-sm text-text-tertiary" aria-hidden="true" />
)

const commandIcons: Partial<Record<ProductCommandId, LucideIcon>> = {
  [ProductCommandId.NEW_CONVERSATION]: Plus,
  [ProductCommandId.TOGGLE_SIDEBAR]: PanelLeft,
  [ProductCommandId.NAVIGATE_HOME]: Home,
  [ProductCommandId.NAVIGATE_SEARCH]: Search,
  [ProductCommandId.NAVIGATE_SETTINGS]: Settings,
  [ProductCommandId.NAVIGATE_BACK]: ArrowLeft,
  [ProductCommandId.NAVIGATE_FORWARD]: ArrowRight,
}

const navigationCommands = new Set<ProductCommandId>([
  ProductCommandId.NAVIGATE_HOME,
  ProductCommandId.NAVIGATE_SEARCH,
  ProductCommandId.NAVIGATE_SETTINGS,
])

/** Registry commands are already covered by `NAVIGATE_*`. */
const commandRoutes = new Set<string>([ROUTES.HOME, ROUTES.SEARCH])

/**
 * Registered product commands, the workspace destinations and the theme
 * switch, filtered by the query. Data-backed results live in
 * `palette-entity-items`.
 */
export const usePaletteCommandItems = ({
  commands,
  query,
  onExecute,
  onClose,
}: {
  commands: ProductCommand[]
  query: string
  onExecute: (command: ProductCommand) => void
  onClose: () => void
}): PaletteItem[] => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return React.useMemo(() => {
    const registered = commands
      .filter((command) => command.id !== ProductCommandId.OPEN_PALETTE)
      .map<PaletteItem>((command) => ({
        value: `command ${command.id}`,
        group: navigationCommands.has(command.id) ? 'navigation' : 'commands',
        title: t(command.titleKey, command.fallbackTitle),
        keys: getCommandShortcutKeys(command.id),
        icon: icon(commandIcons[command.id] ?? ArrowRight),
        keywords: command.id,
        disabled: command.isEnabled?.() === false,
        run: () => onExecute(command),
      }))
    const destinations = navItems
      .filter((item) => !commandRoutes.has(item.href))
      .map<PaletteItem>((item) => ({
        value: `navigation ${item.href}`,
        group: 'navigation',
        title: t('desktop.commands.goTo', { name: t(item.titleKey) }),
        icon: icon(item.icon as LucideIcon),
        keywords: item.href,
        run: () => {
          navigate(item.href)
          onClose()
        },
      }))
    const themes = (
      [
        [Theme.LIGHT, Sun, 'desktop.commands.themeLight'],
        [Theme.DARK, Moon, 'desktop.commands.themeDark'],
        [Theme.SYSTEM, Monitor, 'desktop.commands.themeSystem'],
      ] as const
    ).map<PaletteItem>(([theme, Icon, key]) => ({
      value: `theme ${theme}`,
      group: 'commands',
      title: t(key),
      icon: icon(Icon),
      keywords: `theme ${theme}`,
      run: () => {
        setTheme(theme)
        onClose()
      },
    }))
    return [...registered, ...destinations, ...themes].filter((item) =>
      matchesQuery(`${item.title} ${item.keywords ?? ''}`, query),
    )
  }, [commands, navigate, onClose, onExecute, query, t])
}
