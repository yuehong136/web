export const DESKTOP_COMMAND_INVOKED_CHANNEL =
  'multirag:desktop-command:invoked' as const

export enum DesktopCommandId {
  PALETTE_OPEN = 'palette.open',
  CONVERSATION_NEW = 'conversation.new',
  VIEW_SIDEBAR_TOGGLE = 'view.sidebar.toggle',
  NAVIGATION_HOME = 'navigation.home',
  NAVIGATION_SEARCH = 'navigation.search',
  NAVIGATION_SETTINGS = 'navigation.settings',
  NAVIGATION_BACK = 'navigation.back',
  NAVIGATION_FORWARD = 'navigation.forward',
}

export type DesktopCommandListener = (commandId: DesktopCommandId) => void

export interface DesktopCommandSource {
  subscribe(listener: DesktopCommandListener): () => void
}

export interface DesktopCommandBridge {
  onInvoked(listener: DesktopCommandListener): () => void
}

const DESKTOP_COMMAND_IDS = new Set<string>(Object.values(DesktopCommandId))

export function isDesktopCommandId(value: unknown): value is DesktopCommandId {
  return typeof value === 'string' && DESKTOP_COMMAND_IDS.has(value)
}
