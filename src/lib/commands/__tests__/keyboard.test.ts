// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getCommandShortcutKeys,
  getKeyboardCommand,
  isEditableKeyboardTarget,
  isShortcutAllowedInEditable,
} from '../keyboard'
import { ProductCommandId } from '../types'

const keyboard = (key: string, overrides: Partial<KeyboardEvent> = {}) => ({
  key,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  isComposing: false,
  ...overrides,
})

describe('desktop command shortcuts', () => {
  it('maps the fixed cross-platform shortcut set', () => {
    expect(getKeyboardCommand(keyboard('k', { metaKey: true }))).toBe(
      ProductCommandId.OPEN_PALETTE,
    )
    expect(getKeyboardCommand(keyboard('n', { ctrlKey: true }))).toBe(
      ProductCommandId.NEW_CONVERSATION,
    )
    expect(getKeyboardCommand(keyboard('[', { metaKey: true }))).toBe(
      ProductCommandId.NAVIGATE_BACK,
    )
    expect(getKeyboardCommand(keyboard('ArrowRight', { altKey: true }))).toBe(
      ProductCommandId.NAVIGATE_FORWARD,
    )
  })

  it('ignores shortcuts while an IME composition is active', () => {
    expect(
      getKeyboardCommand(keyboard('n', { metaKey: true, isComposing: true })),
    ).toBeUndefined()
  })

  it('recognizes editable keyboard targets', () => {
    expect(isEditableKeyboardTarget(document.createElement('input'))).toBe(true)
    expect(isEditableKeyboardTarget(document.createElement('textarea'))).toBe(
      true,
    )
    const editable = document.createElement('div')
    editable.contentEditable = 'true'
    document.body.append(editable)
    expect(isEditableKeyboardTarget(editable)).toBe(true)
    expect(isEditableKeyboardTarget(document.createElement('button'))).toBe(
      false,
    )
  })

  it('lets only the palette shortcut through while typing', () => {
    expect(isShortcutAllowedInEditable(ProductCommandId.OPEN_PALETTE)).toBe(
      true,
    )
    // Starting a new chat from inside the composer is the common case.
    expect(isShortcutAllowedInEditable(ProductCommandId.NEW_CONVERSATION)).toBe(
      true,
    )
    expect(
      getKeyboardCommand(keyboard('O', { ctrlKey: true, shiftKey: true })),
    ).toBe(ProductCommandId.NEW_CONVERSATION)
    expect(isShortcutAllowedInEditable(ProductCommandId.TOGGLE_SIDEBAR)).toBe(
      false,
    )
  })

  describe('key caps', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('labels the modifier per platform and omits unbound commands', () => {
      vi.stubGlobal('navigator', { platform: 'Win32', userAgent: '' })
      expect(getCommandShortcutKeys(ProductCommandId.OPEN_PALETTE)).toEqual([
        'Ctrl',
        'K',
      ])
      vi.stubGlobal('navigator', { platform: 'MacIntel', userAgent: '' })
      // Browsers keep ⌘/Ctrl+N for a window: the Web shows ⌘/Ctrl+Shift+O,
      // the desktop app its menu accelerator.
      expect(getCommandShortcutKeys(ProductCommandId.NEW_CONVERSATION)).toEqual(
        ['⌘', 'Shift', 'O'],
      )
      document.documentElement.dataset.clientRuntime = 'desktop'
      try {
        expect(
          getCommandShortcutKeys(ProductCommandId.NEW_CONVERSATION),
        ).toEqual(['⌘', 'N'])
      } finally {
        delete document.documentElement.dataset.clientRuntime
      }
      expect(
        getCommandShortcutKeys(ProductCommandId.NAVIGATE_HOME),
      ).toBeUndefined()
    })
  })
})
