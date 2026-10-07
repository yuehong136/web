import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import { setProductLanguage } from '@/locales/i18n'
import { createInitialConfig } from '../../constants'
import { PreviewPane, type PreviewPaneProps } from '../preview-pane'

vi.mock('@/lib/clipboard', () => ({ copyToClipboardWithFeedback: vi.fn() }))
vi.mock('../preview-answer', () => ({
  PreviewAnswer: ({ content }: { content: string }) => <div>{content}</div>,
}))
vi.mock('@/components/chat/ReferenceDetailSheet', () => ({
  ReferenceDetailSheet: () => null,
}))
let container: HTMLDivElement
let root: Root
let props: PreviewPaneProps
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  await setProductLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  props = {
    savedConfig: createInitialConfig({}),
    isDirty: false,
    previewStale: false,
    requiredVariables: false,
    saving: false,
    previewMessages: [],
    inputValue: 'hello',
    setInputValue: vi.fn(),
    isStreaming: false,
    status: 'idle',
    runDetails: null,
    handleSendPreviewMessage: vi.fn(),
    handleStopOutput: vi.fn(),
    handleRetryPreview: vi.fn(),
    handleSaveAndPreview: vi.fn(),
    onReset: vi.fn(),
    focused: false,
    onFocus: vi.fn(),
  }
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.clearAllMocks()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
const render = async () => {
  await act(async () => root.render(<PreviewPane {...props} />))
}
const key = async (options: KeyboardEventInit = {}) => {
  await act(async () =>
    container.querySelector('textarea')!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        ...options,
      }),
    ),
  )
}
describe('Studio test chat composer', () => {
  it('uses shared reply actions and blocks regeneration when the draft changes', async () => {
    props.previewMessages = [
      { id: 'answer-1', role: 'assistant', content: 'Saved reply' },
    ]
    props.status = 'completed'
    await render()
    const regenerate = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Regenerate"]',
    )
    expect(regenerate).not.toBeNull()
    await act(async () => regenerate!.click())
    expect(props.handleRetryPreview).toHaveBeenCalledOnce()
    props.isDirty = true
    await render()
    expect(
      container.querySelector('button[aria-label="Regenerate"]'),
    ).toBeNull()
  })
  it.each(['isDirty', 'previewStale', 'requiredVariables', 'saving'] as const)(
    'blocks sends when %s is true',
    async (flag) => {
      props[flag] = true
      await render()
      await key()
      expect(props.handleSendPreviewMessage).not.toHaveBeenCalled()
      expect(
        (
          container.querySelector(
            '[aria-label="Send message"]',
          ) as HTMLButtonElement
        ).disabled,
      ).toBe(true)
    },
  )
  it('ignores IME Enter and Shift+Enter while allowing a normal Enter', async () => {
    await render()
    await act(async () =>
      container
        .querySelector('textarea')!
        .dispatchEvent(
          new CompositionEvent('compositionstart', { bubbles: true }),
        ),
    )
    await key()
    expect(props.handleSendPreviewMessage).not.toHaveBeenCalled()
    await act(async () =>
      container
        .querySelector('textarea')!
        .dispatchEvent(
          new CompositionEvent('compositionend', { bubbles: true }),
        ),
    )
    await key({ shiftKey: true })
    await key({ isComposing: true })
    expect(props.handleSendPreviewMessage).not.toHaveBeenCalled()
    await key()
    expect(props.handleSendPreviewMessage).toHaveBeenCalledWith('hello')
  })
  it('shows saved configuration semantics and does not display a disabled local max-token value', async () => {
    props.runDetails = {
      model: 'recorded-model',
      overrides: {},
      knowledgeCount: 1,
      elapsedMs: 0,
      status: 'completed',
    }
    await render()
    const button = container.querySelector<HTMLButtonElement>(
      '[aria-label="Run details"]',
    )!
    await act(async () => button.click())
    const sheet = document.querySelector('[role="dialog"]')!
    expect(sheet.textContent).toContain('recorded-model')
    expect(sheet.textContent).toContain('Use model default')
    expect(sheet.textContent).not.toContain('4096')
  })
})

it('copies a reply through the shared accessible action exactly once', async () => {
  props.previewMessages = [
    { id: 'reply-copy', role: 'assistant', content: 'Copy this answer' },
  ]
  await act(async () => root.render(<PreviewPane {...props} />))
  const copy = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Copy"]',
  )!
  await act(async () => copy.click())
  expect(copyToClipboardWithFeedback).toHaveBeenCalledOnce()
  expect(copyToClipboardWithFeedback).toHaveBeenCalledWith(
    'Copy this answer',
    expect.any(String),
    expect.any(String),
  )
})
