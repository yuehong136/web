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
    if (key === 'k') return ProductCommandId.OPEN_PALETTE
    if (key === 'n') return ProductCommandId.NEW_CONVERSATION
    if (key === 'b') return ProductCommandId.TOGGLE_SIDEBAR
    if (key === ',') return ProductCommandId.NAVIGATE_SETTINGS
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
