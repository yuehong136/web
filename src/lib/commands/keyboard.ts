import { ProductCommandId } from './types'

export const isEditableKeyboardTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  if (
    target.isContentEditable ||
    target.contentEditable === 'true' ||
    target.closest('[contenteditable]:not([contenteditable="false"])')
  ) {
    return true
  }

  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** ⌘/Ctrl + key shortcuts, shared by the key handler and the key caps. */
const modifierShortcuts: Partial<Record<ProductCommandId, string>> = {
  [ProductCommandId.OPEN_PALETTE]: 'k',
  [ProductCommandId.NEW_CONVERSATION]: 'n',
  [ProductCommandId.TOGGLE_SIDEBAR]: 'b',
  [ProductCommandId.NAVIGATE_SETTINGS]: ',',
}

/**
 * ⌘/Ctrl + Shift + key shortcuts. Browsers keep ⌘/Ctrl+N for a new window,
 * so on the Web a new conversation is ⌘/Ctrl+Shift+O, as in ChatGPT; the
 * desktop app keeps ⌘/Ctrl+N (its menu accelerator) and both work there.
 */
const shiftModifierShortcuts: Partial<Record<ProductCommandId, string>> = {
  [ProductCommandId.NEW_CONVERSATION]: 'o',
}

const isDesktopRuntime = () =>
  typeof document !== 'undefined' &&
  document.documentElement.dataset.clientRuntime === 'desktop'

/**
 * Commands that still run while typing in a field. Opening the palette is
 * the way out of an input, and a new conversation is what the composer
 * starts from; editors that bind the same keys handle the event first and
 * mark it default-prevented.
 */
const editableShortcuts = new Set<ProductCommandId>([
  ProductCommandId.OPEN_PALETTE,
  ProductCommandId.NEW_CONVERSATION,
])

export const isShortcutAllowedInEditable = (id: ProductCommandId) =>
  editableShortcuts.has(id)

export const getKeyboardCommand = (
  event: Pick<
    KeyboardEvent,
    'altKey' | 'ctrlKey' | 'isComposing' | 'key' | 'metaKey' | 'shiftKey'
  >,
): ProductCommandId | undefined => {
  if (event.isComposing) return undefined

  const key = event.key.toLowerCase()
  const commandModifier = event.metaKey || event.ctrlKey

  if (commandModifier && !event.altKey && !event.shiftKey) {
    const match = Object.entries(modifierShortcuts).find(
      ([, shortcut]) => shortcut === key,
    )
    if (match) return match[0] as ProductCommandId
  }

  if (commandModifier && event.shiftKey && !event.altKey) {
    const match = Object.entries(shiftModifierShortcuts).find(
      ([, shortcut]) => shortcut === key,
    )
    if (match) return match[0] as ProductCommandId
  }

  if (event.metaKey && !event.ctrlKey && !event.altKey) {
    if (key === '[') return ProductCommandId.NAVIGATE_BACK
    if (key === ']') return ProductCommandId.NAVIGATE_FORWARD
  }

  if (event.altKey && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
    if (key === 'arrowleft') return ProductCommandId.NAVIGATE_BACK
    if (key === 'arrowright') return ProductCommandId.NAVIGATE_FORWARD
  }

  return undefined
}

/** Apple keyboards label the command modifier ⌘; everything else Ctrl. */
export const isApplePlatform = () => {
  if (typeof navigator === 'undefined') return false
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent
  return /mac|iphone|ipad|ipod/i.test(platform)
}

/** Key caps for a command's shortcut on this platform, e.g. `['Ctrl', 'K']`. */
export const getCommandShortcutKeys = (
  id: ProductCommandId,
): string[] | undefined => {
  const modifier = isApplePlatform() ? '⌘' : 'Ctrl'
  const shifted = shiftModifierShortcuts[id]
  // The Web shows the chord the browser lets through; the desktop app its own.
  if (shifted && !isDesktopRuntime())
    return [modifier, 'Shift', shifted.toUpperCase()]
  const key = modifierShortcuts[id]
  return key ? [modifier, key.toUpperCase()] : undefined
}
