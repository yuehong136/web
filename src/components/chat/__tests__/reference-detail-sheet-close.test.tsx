import { act, StrictMode, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { ReferenceDetailSheet } from '../ReferenceDetailSheet'

const chunk: ReferenceChunk = {
  id: 'chunk-0',
  content: 'HarnessX 在五个基准上评测。',
  document_id: 'doc-1',
  document_name: 'harness.html',
  dataset_id: 'kb-1',
}

let root: Root
let container: HTMLDivElement

const sheet = () => document.querySelector<HTMLElement>('[role="dialog"]')

function OpenSheet() {
  const [open, setOpen] = useState(true)
  return (
    <ReferenceDetailSheet open={open} onOpenChange={setOpen} chunk={chunk} />
  )
}

beforeEach(async () => {
  await setProductLanguage('zh-CN')
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('ReferenceDetailSheet close button', () => {
  it('has one close button, in the sticky header, and it closes the sheet', async () => {
    await act(async () =>
      root.render(
        <StrictMode>
          <OpenSheet />
        </StrictMode>,
      ),
    )

    // The built-in close button sat under the sticky header, out of reach.
    const closeButtons = Array.from(
      sheet()!.querySelectorAll<HTMLButtonElement>('button'),
    ).filter(
      (button) =>
        button.getAttribute('aria-label') === '关闭' ||
        button.textContent?.trim() === 'Close',
    )
    expect(closeButtons).toHaveLength(1)
    const header = sheet()!.querySelector('h2')!.closest('[role="dialog"] > *')
    expect(header?.contains(closeButtons[0])).toBe(true)

    await act(async () => closeButtons[0].click())

    expect(sheet()).toBeNull()
  })
})
