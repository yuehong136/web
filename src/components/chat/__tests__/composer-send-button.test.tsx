import { readFileSync } from 'node:fs'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  ComposerSendButton,
  type ComposerSendButtonProps,
} from '../composer-send-button'
import { splitMotionRules } from '@/themes/__tests__/motion-css-test-utils'

const stylesheet = readFileSync(
  'src/components/chat/composer-send-button.css',
  'utf8',
)
let root: Root
let host: HTMLDivElement
const onSend = vi.fn()
const onStop = vi.fn()
const render = (props: Partial<ComposerSendButtonProps> = {}) =>
  act(async () =>
    root.render(
      <ComposerSendButton
        running={false}
        canSend
        onSend={onSend}
        onStop={onStop}
        sendLabel="Send"
        stopLabel="Stop"
        {...props}
      />,
    ),
  )
const button = () => host.querySelector('button')!
const click = (detail = 1) =>
  act(async () => {
    button().dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, detail }),
    )
  })

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  onSend.mockReset()
  onStop.mockReset()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('stays one button whose name, state and action follow the reply', async () => {
  await render()
  const element = button()
  expect(element.getAttribute('aria-label')).toBe('Send')
  expect(element.getAttribute('title')).toBe('Send')
  expect(element.dataset.state).toBe('send')
  await click()
  expect(onSend).toHaveBeenCalledOnce()

  await render({ running: true, canSend: false })
  expect(button()).toBe(element)
  expect(host.querySelectorAll('button')).toHaveLength(1)
  expect(element.getAttribute('aria-label')).toBe('Stop')
  expect(element.dataset.state).toBe('stop')
  expect(element.disabled).toBe(false)
  // Both glyphs share the button; neither adds to its accessible name.
  expect(
    [...element.querySelectorAll('svg')].map((icon) => [
      icon.dataset.icon,
      icon.getAttribute('aria-hidden'),
    ]),
  ).toEqual([
    ['send', 'true'],
    ['stop', 'true'],
  ])
  await click()
  expect(onStop).toHaveBeenCalledOnce()
  expect(onSend).toHaveBeenCalledOnce()
})

it('keeps focus through the morph, even when send is not available yet', async () => {
  await render({ canSend: false })
  expect(button().disabled).toBe(true)

  await render({ running: true })
  const element = button()
  await act(async () => element.focus())
  expect(document.activeElement).toBe(element)

  // The reply ends with an empty draft: send is unavailable but keeps focus.
  await render({ running: false, canSend: false })
  expect(button()).toBe(element)
  expect(document.activeElement).toBe(element)
  expect(element.getAttribute('aria-label')).toBe('Send')
  expect(element.getAttribute('aria-disabled')).toBe('true')
  expect(element.disabled).toBe(false)
  await click()
  expect(onSend).not.toHaveBeenCalled()

  // Once focus leaves it is natively disabled again, out of the tab order.
  await act(async () => element.blur())
  expect(element.disabled).toBe(true)
})

it('ignores the second click of a double-click that started the reply', async () => {
  await render()
  await click(1)
  await render({ running: true })
  await click(2)
  expect(onStop).not.toHaveBeenCalled()
  await click(1)
  expect(onStop).toHaveBeenCalledOnce()
  // Keyboard activation reports no click count.
  await click(0)
  expect(onStop).toHaveBeenCalledTimes(2)
})

it('animates only opacity when motion is reduced', () => {
  const css = stylesheet.replace(/\/\*[\s\S]*?\*\//g, '')
  const { motionRules: motionBlock, otherRules: reducedRules } =
    splitMotionRules(css)
  expect(motionBlock).toMatch(/scale:\s*0\.6/)
  expect(reducedRules).toMatch(/transition:\s*opacity 160ms/)
  expect(reducedRules).not.toMatch(/scale|translate|transform|rotate/)
})
