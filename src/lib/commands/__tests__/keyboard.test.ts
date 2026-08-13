// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { getKeyboardCommand, isEditableKeyboardTarget } from '../keyboard'
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
})
