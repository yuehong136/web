import { act, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  ComposerEntrance,
  HomeMotion,
  readComposerOrigin,
  type ComposerOrigin,
} from '../composer-entrance'

let root: Root
let host: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('reads where the welcome composer is and whether the draft has focus', () => {
  expect(readComposerOrigin(null)).toBeNull()
  const frame = document.createElement('div')
  const draft = document.createElement('textarea')
  frame.append(draft)
  host.append(frame)
  expect(readComposerOrigin(frame)).toEqual({ top: 0, focused: false })
  draft.focus()
  expect(readComposerOrigin(frame)).toEqual({ top: 0, focused: true })
})

it('hands focus to the docked composer once, only when the draft had it', async () => {
  const focus = vi.fn()
  const target = createRef<{ focus: () => void }>()
  ;(target as { current: { focus: () => void } }).current = { focus }
  const render = (origin: ComposerOrigin | null) =>
    act(async () =>
      root.render(
        <HomeMotion>
          <ComposerEntrance origin={origin} focusTarget={target}>
            <p>composer</p>
          </ComposerEntrance>
        </HomeMotion>,
      ),
    )
  await render(null)
  expect(focus).not.toHaveBeenCalled()
  expect(host.querySelector('[data-composer-entrance]')?.textContent).toBe(
    'composer',
  )

  const origin = { top: 240, focused: true }
  await render(origin)
  await render(origin)
  expect(focus).toHaveBeenCalledTimes(1)
})

it('leaves focus alone when the draft did not have it', async () => {
  const focus = vi.fn()
  const target = { current: { focus } }
  await act(async () =>
    root.render(
      <ComposerEntrance
        origin={{ top: 240, focused: false }}
        focusTarget={target}
      >
        <p>composer</p>
      </ComposerEntrance>,
    ),
  )
  expect(focus).not.toHaveBeenCalled()
})
