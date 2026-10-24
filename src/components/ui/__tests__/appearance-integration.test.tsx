import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ScopedTheme, setAppearance, DEFAULT_APPEARANCE } from '@/themes'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { setProductLanguage } from '@/locales/i18n'

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal('matchMedia', () =>
    Object.assign(new EventTarget(), { matches: false }),
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  setAppearance(DEFAULT_APPEARANCE)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('keeps a mounted popup and draft inside its complete source scope while the preset changes', async () => {
  function Surface({ preset }: { preset: 'paper' | 'ocean' }) {
    const [draft, setDraft] = useState('next question')
    return (
      <ScopedTheme
        theme="dark"
        preset={preset}
        density="compact"
        textScale={1.25}
        motion="reduced"
      >
        <Input
          aria-label="Draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Popover open>
          <PopoverTrigger>Source</PopoverTrigger>
          <PopoverContent>
            <span data-scope-probe>Evidence</span>
          </PopoverContent>
        </Popover>
      </ScopedTheme>
    )
  }
  await act(async () => root.render(<Surface preset="paper" />))
  const input = container.querySelector('input')
  const popup = container.querySelector('[data-scope-probe]')
  expect(popup).not.toBeNull()
  expect(popup?.closest('[data-preset]')?.getAttribute('data-preset')).toBe(
    'paper',
  )
  await act(async () => root.render(<Surface preset="ocean" />))
  expect(container.querySelector('input')).toBe(input)
  expect(input?.value).toBe('next question')
  expect(container.querySelector('[data-scope-probe]')).toBe(popup)
  const scope = popup?.closest('[data-preset]')
  expect(scope?.getAttribute('data-preset')).toBe('ocean')
  expect(scope?.getAttribute('data-theme')).toBe('dark')
  expect(scope?.getAttribute('data-density')).toBe('compact')
  expect(scope?.getAttribute('data-text-scale')).toBe('1.25')
  expect(scope?.getAttribute('data-motion')).toBe('reduced')
})

it('associates validation with its field and preserves native required semantics', async () => {
  await act(async () =>
    root.render(
      <Input
        label="Name"
        required
        error="Name is required"
        aria-describedby="external-hint"
      />,
    ),
  )
  const input = container.querySelector('input')!
  expect(input.required).toBe(true)
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(container.querySelector('label')?.htmlFor).toBe(input.id)
  const hints = input.getAttribute('aria-describedby')!.split(' ')
  expect(hints).toContain('external-hint')
  expect(document.getElementById(hints[1])?.textContent).toContain(
    'Name is required',
  )
})

it('keeps legacy modals in their full origin scope with unique names and localized close actions', async () => {
  await setProductLanguage('en-US')
  try {
    await act(async () =>
      root.render(
        <ScopedTheme
          preset="ocean"
          theme="dark"
          density="compact"
          textScale={1.25}
        >
          {['First panel', 'Second panel'].map((title) => (
            <Modal key={title} open onClose={() => undefined} title={title}>
              <p>{title}</p>
            </Modal>
          ))}
        </ScopedTheme>,
      ),
    )
    const dialogs = [...container.querySelectorAll('[role="dialog"]')]
    expect(dialogs).toHaveLength(2)
    const ids = dialogs.map((dialog) => dialog.getAttribute('aria-labelledby'))
    expect(new Set(ids).size).toBe(2)
    dialogs.forEach((dialog, index) => {
      expect(document.getElementById(ids[index]!)?.textContent).toBe(
        index ? 'Second panel' : 'First panel',
      )
      expect(dialog.closest('[data-preset]')?.getAttribute('data-preset')).toBe(
        'ocean',
      )
      expect(
        dialog.closest('[data-density]')?.getAttribute('data-density'),
      ).toBe('compact')
      expect(dialog.querySelector('button')?.textContent).toBe('Close')
    })
  } finally {
    await act(async () => {
      await setProductLanguage('zh-CN')
    })
  }
})
