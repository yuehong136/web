import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ChatComposer, type ComposerState } from '../chat-composer'
import { stubChatDOM } from './chat-dom'
import { setProductLanguage } from '@/locales/i18n'

let root: Root
let host: HTMLDivElement
const send = vi.fn()
const stop = vi.fn()
const change = vi.fn()
const render = (state: ComposerState = { kind: 'ready' }, value = 'draft') =>
  act(async () =>
    root.render(
      <ChatComposer
        value={value}
        onChange={change}
        onSubmit={send}
        state={state}
        placeholder="Message"
      />,
    ),
  )
const key = (options: KeyboardEventInit = {}) =>
  act(async () => {
    host.querySelector('textarea')!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        ...options,
      }),
    )
  })
beforeEach(async () => {
  stubChatDOM()
  await setProductLanguage('en-US')
  send.mockReset()
  stop.mockReset()
  change.mockReset()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('submits a normal Enter exactly once and leaves modified Enter to the editor', async () => {
  await render()
  for (const options of [
    { shiftKey: true },
    { ctrlKey: true },
    { altKey: true },
    { metaKey: true },
  ])
    await key(options)
  expect(send).not.toHaveBeenCalled()
  await key()
  expect(send).toHaveBeenCalledExactlyOnceWith('draft')
})

it('IME candidate confirmation, keyCode 229 and Process never submit or clear a draft', async () => {
  await render()
  const input = host.querySelector('textarea')!
  await act(async () =>
    input.dispatchEvent(
      new CompositionEvent('compositionstart', { bubbles: true }),
    ),
  )
  await key()
  await act(async () =>
    host
      .querySelector<HTMLButtonElement>('button[aria-label="Submit"]')!
      .click(),
  )
  expect(send).not.toHaveBeenCalled()
  await act(async () =>
    input.dispatchEvent(
      new CompositionEvent('compositionend', { bubbles: true }),
    ),
  )
  await key({ isComposing: true })
  await key({ keyCode: 229 })
  await key({ key: 'Process' })
  expect(send).not.toHaveBeenCalled()
  expect(input.value).toBe('draft')
  await key()
  expect(send).toHaveBeenCalledTimes(1)
})

it('a prepared or empty request cannot submit; running keeps the next draft editable and offers local stop', async () => {
  await render({ kind: 'blocked' })
  await key()
  expect(host.querySelector('textarea')!.disabled).toBe(false)
  expect(
    host.querySelector<HTMLButtonElement>('button[aria-label="Submit"]')!
      .disabled,
  ).toBe(true)
  await render({ kind: 'ready' }, '   ')
  await key()
  expect(send).not.toHaveBeenCalled()
  await render({ kind: 'running', stop }, 'next draft')
  await key()
  expect(host.querySelector('textarea')!.value).toBe('next draft')
  expect(host.querySelector('textarea')!.disabled).toBe(false)
  expect(host.querySelector('button[aria-label="Submit"]')).toBeNull()
  await act(async () =>
    host
      .querySelector<HTMLButtonElement>('button[aria-label="Stop receiving"]')!
      .click(),
  )
  expect(stop).toHaveBeenCalledOnce()
  expect(send).not.toHaveBeenCalled()
})

it('language changes retain the editor, focus and the user draft', async () => {
  await render({ kind: 'ready' }, '用户未提交的草稿')
  const input = host.querySelector('textarea')!
  input.focus()
  input.setSelectionRange(2, 4)
  await act(async () => {
    await setProductLanguage('zh-CN')
  })
  expect(host.querySelector('textarea')).toBe(input)
  expect(document.activeElement).toBe(input)
  expect(input.value).toBe('用户未提交的草稿')
  expect(input.selectionStart).toBe(2)
  expect(input.selectionEnd).toBe(4)
  expect(send).not.toHaveBeenCalled()
})
