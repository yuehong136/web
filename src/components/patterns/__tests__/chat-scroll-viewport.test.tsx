import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { ChatScrollViewport } from '../chat/chat-scroll-viewport'

class TestResizeObserver {
  static instances = new Set<TestResizeObserver>()
  constructor(private callback: ResizeObserverCallback) {
    TestResizeObserver.instances.add(this)
  }
  observe = () => undefined
  unobserve = () => undefined
  disconnect = () => {
    TestResizeObserver.instances.delete(this)
  }
  static notify() {
    for (const observer of TestResizeObserver.instances) {
      observer.callback([], observer as unknown as ResizeObserver)
    }
  }
}

const CLIENT_HEIGHT = 400
let root: Root
let host: HTMLDivElement
let contentHeight = 0
let scrollTop = 0

const log = () => host.querySelector<HTMLDivElement>('[role="log"]')!
const jumpButton = () => host.querySelector<HTMLButtonElement>('button')

const render = async (followKey: string) => {
  await act(async () =>
    root.render(
      <ChatScrollViewport followKey={followKey}>
        <p>messages</p>
      </ChatScrollViewport>,
    ),
  )
}

const grow = async (height: number) => {
  contentHeight = height
  await act(async () => TestResizeObserver.notify())
}

const userScrollTo = async (top: number) => {
  scrollTop = top
  await act(async () => log().dispatchEvent(new Event('scroll')))
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('ResizeObserver', TestResizeObserver)
  await setProductLanguage('zh-CN')
  contentHeight = 0
  scrollTop = 0
  Object.defineProperties(HTMLElement.prototype, {
    scrollTop: {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value
      },
    },
    scrollHeight: { configurable: true, get: () => contentHeight },
    clientHeight: { configurable: true, get: () => CLIENT_HEIGHT },
    scrollTo: {
      configurable: true,
      value(options: ScrollToOptions) {
        scrollTop = options.top ?? scrollTop
      },
    },
  })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await render('user-1')
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  for (const property of [
    'scrollTop',
    'scrollHeight',
    'clientHeight',
    'scrollTo',
  ]) {
    Reflect.deleteProperty(HTMLElement.prototype, property)
  }
  vi.unstubAllGlobals()
})

it('follows growing content while the reader stays at the latest message', async () => {
  await grow(1000)

  expect(scrollTop).toBe(1000)
  expect(log().getAttribute('aria-live')).toBe('polite')
  expect(jumpButton()).toBeNull()
})

it('keeps the reading position when content grows after the reader scrolls up', async () => {
  await grow(1000)
  await userScrollTo(300)

  expect(jumpButton()?.textContent).toBe('回到底部')

  await grow(1500)

  expect(scrollTop).toBe(300)
  expect(jumpButton()?.textContent).toBe('有新内容')
})

it('returns to the latest message from the jump button and keeps following', async () => {
  await grow(1000)
  await userScrollTo(300)
  await grow(1500)

  await act(async () => jumpButton()!.click())

  expect(scrollTop).toBe(1500)
  expect(jumpButton()).toBeNull()
  expect(document.activeElement).toBe(log())

  await grow(1800)
  expect(scrollTop).toBe(1800)
})

it('only re-enters follow mode once the reader is back near the bottom', async () => {
  await grow(1500)
  await userScrollTo(300)
  await userScrollTo(1000)

  expect(jumpButton()).not.toBeNull()

  await userScrollTo(1060)

  expect(jumpButton()).toBeNull()
})

it('re-attaches to the latest message when a new user message is sent', async () => {
  await grow(1000)
  await userScrollTo(200)

  await render('user-2')

  expect(scrollTop).toBe(1000)
  expect(jumpButton()).toBeNull()
})

it('keeps reading when shrinking content clamps the view to the bottom', async () => {
  await grow(3000)
  await userScrollTo(1500)

  // A collapsing panel shrinks the content; the browser clamps scrollTop up.
  await grow(1200)
  await userScrollTo(contentHeight - CLIENT_HEIGHT)
  await grow(1600)

  expect(scrollTop).toBe(800)
  expect(jumpButton()?.textContent).toBe('有新内容')
})
