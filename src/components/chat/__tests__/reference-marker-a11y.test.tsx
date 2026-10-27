import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import {
  ReferenceMarker,
  createReferenceMarkerComponent,
} from '../ReferenceMarker'

const chunk: ReferenceChunk = {
  id: 'chunk-0',
  content: '<p>HarnessX 在五个基准上评测。</p>',
  document_id: 'doc-1',
  document_name: 'harness.pdf',
  dataset_id: 'kb-1',
}

let root: Root
let container: HTMLDivElement

// Radix restores focus in a timeout after the content unmounts.
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
const trigger = () => container.querySelector<HTMLButtonElement>('sup > button')
const popover = () => document.querySelector<HTMLElement>('[role="dialog"]')

beforeEach(async () => {
  await setProductLanguage('zh-CN')
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('ReferenceMarker accessibility', () => {
  it('is a native button named after the citation number and document', async () => {
    await act(async () =>
      root.render(<ReferenceMarker index={0} chunk={chunk} />),
    )

    const button = trigger()!
    // 原生 button：Tab 可聚焦，Enter / Space 由浏览器转成点击
    expect(button.type).toBe('button')
    expect(button.tabIndex).toBe(0)
    expect(button.textContent).toBe('1')
    expect(button.getAttribute('aria-label')).toBe('引用 1：harness.pdf')
  })

  it('falls back to the unknown document name and localizes to English', async () => {
    await act(async () =>
      root.render(
        <ReferenceMarker
          index={2}
          chunk={{ ...chunk, document_name: '', reference_index: 3 }}
        />,
      ),
    )
    expect(trigger()!.getAttribute('aria-label')).toBe('引用 3：未知文档')

    await act(async () => setProductLanguage('en-US'))
    expect(trigger()!.getAttribute('aria-label')).toBe(
      'Citation 3: Unknown document',
    )
    await act(async () => trigger()!.click())
    // 原文入口是链接，复制与详情是按钮
    const actions = [...popover()!.querySelectorAll('button, a')].map(
      (element) =>
        `${element.tagName.toLowerCase()}:${element.textContent?.trim()}`,
    )
    expect(actions).toEqual([
      'button:Copy',
      'a:Open document',
      'button:Details',
    ])
  })

  it('opens a named popover and returns focus to the marker on Escape', async () => {
    const onCopy = vi.fn()
    await act(async () =>
      root.render(<ReferenceMarker index={0} chunk={chunk} onCopy={onCopy} />),
    )
    const button = trigger()!
    button.focus()
    await act(async () => button.click())
    await settle()

    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(popover()?.getAttribute('aria-label')).toBe('引用 1：harness.pdf')
    expect(popover()?.contains(document.activeElement)).toBe(true)
    expect(popover()?.textContent).toContain('HarnessX 在五个基准上评测。')

    const copy = [...popover()!.querySelectorAll('button')].find(
      (element) => element.textContent?.trim() === '复制',
    )!
    expect(copy.type).toBe('button')
    await act(async () => copy.click())
    expect(onCopy).toHaveBeenCalledWith('HarnessX 在五个基准上评测。')

    await act(async () => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
    })
    await settle()

    expect(popover()).toBeNull()
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button)
  })

  it('keeps an unresolved citation as plain superscript text', async () => {
    const Sup = createReferenceMarkerComponent([chunk])
    await act(async () => root.render(<Sup>{'4'}</Sup>))

    const sup = container.querySelector('sup')!
    expect(sup.textContent).toBe('5')
    expect(sup.querySelector('button')).toBeNull()
    expect(container.querySelector('[aria-haspopup]')).toBeNull()
  })
})
