export enum ProductCommandId {
  OPEN_PALETTE = 'palette.open',
  NEW_CONVERSATION = 'conversation.new',
  TOGGLE_SIDEBAR = 'view.sidebar.toggle',
  NAVIGATE_HOME = 'navigation.home',
  NAVIGATE_SEARCH = 'navigation.search',
  NAVIGATE_SETTINGS = 'navigation.settings',
  NAVIGATE_BACK = 'navigation.back',
  NAVIGATE_FORWARD = 'navigation.forward',
}

export enum CommandCategory {
  APPLICATION = 'application',
  CONVERSATION = 'conversation',
  VIEW = 'view',
  NAVIGATION = 'navigation',
}

export enum CommandScope {
  GLOBAL = 'global',
  ROUTE = 'route',
}

export interface CommandContext {
  closePalette: () => void
}

export interface ProductCommand {
  id: ProductCommandId
  titleKey: string
  fallbackTitle: string
  category: CommandCategory
  scope: CommandScope
  shortcut?: string
  isVisible?: () => boolean
  isEnabled?: () => boolean
  run: (context: CommandContext) => void | Promise<void>
}

const productCommandIds = new Set<string>(Object.values(ProductCommandId))

export const isProductCommandId = (value: unknown): value is ProductCommandId =>
  typeof value === 'string' && productCommandIds.has(value)
