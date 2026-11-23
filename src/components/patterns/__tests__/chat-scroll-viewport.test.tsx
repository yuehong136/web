import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { CHAT_ANCHOR_SPACE_VAR } from '@/hooks/use-chat-scroll-follow'
import { setAppearance } from '@/themes/appearance'
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

/**
 * A small layout model of the scroll container: `contentHeight` is the
 * messages, the anchor space comes from the CSS variable the hook sets, and
 * each question sits at a fixed offset in the content.
 */
const CLIENT_HEIGHT = 400
const QUESTION_HEIGHT = 40
let root: Root
let host: HTMLDivElement
let contentHeight = 0
let scrollTop = 0
let questions: { id: string; top: number }[] = []
let behaviors: (ScrollBehavior | undefined)[] = []

const log = () => host.querySelector<HTMLDivElement>('[role="log"]')!
const jumpButton = () =>
  host.querySelector<HTMLButtonElement>('[data-chat-jump-to-latest]')
const space = () =>
  Number.parseFloat(
    host
      ?.querySelector<HTMLElement>('[role="log"]')
      ?.style.getPropertyValue(CHAT_ANCHOR_SPACE_VAR) ?? '',
  ) || 0
// Like a browser: never less than the viewport.
const scrollHeight = () => Math.max(CLIENT_HEIGHT, contentHeight + space())
const clamp = (top: number) =>
  Math.min(Math.max(0, top), Math.max(0, scrollHeight() - CLIENT_HEIGHT))
/** Where the newest question is in the viewport, in px from its top. */
const questionInView = () => questions.at(-1)!.top - scrollTop

const render = async ({ pending = false } = {}) => {
  await act(async () =>
    root.render(
      <ChatScrollViewport
        anchorKey={questions.at(-1)?.id ?? null}
        pending={pending}
      >
        {questions.map((question) => (
          <p key={question.id} data-turn-id={question.id}>
            {question.id}
          </p>
        ))}
      </ChatScrollViewport>,
    ),
  )
}

const resize = async (height: number) => {
  contentHeight = height
  await act(async () => TestResizeObserver.notify())
}

const userScrollTo = async (top: number) => {
  scrollTop = clamp(top)
  await act(async () => log().dispatchEvent(new Event('scroll')))
}

/** History of `height` px whose last question has an answer below it. */
const loadHistory = async (height: number) => {
  questions = [{ id: 'q1', top: height - 300 }]
  contentHeight = height
  await render()
  await resize(height)
}

/** Sends a question at the end of the content; its reply is pending. */
const send = async (id: string) => {
  questions = [...questions, { id, top: contentHeight }]
  contentHeight += QUESTION_HEIGHT
  await render({ pending: true })
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('ResizeObserver', TestResizeObserver)
  await setProductLanguage('zh-CN')
  contentHeight = 0
  scrollTop = 0
  questions = []
  behaviors = []
  Object.defineProperties(HTMLElement.prototype, {
    scrollTop: {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = clamp(value)
      },
    },
    scrollHeight: { configurable: true, get: scrollHeight },
    clientHeight: { configurable: true, get: () => CLIENT_HEIGHT },
    scrollTo: {
      configurable: true,
      value(this: HTMLElement, options: ScrollToOptions) {
        behaviors.push(options.behavior)
        scrollTop = clamp(options.top ?? scrollTop)
        this.dispatchEvent(new Event('scroll'))
        this.dispatchEvent(new Event('scrollend'))
      },
    },
    getBoundingClientRect: {
      configurable: true,
      value(this: HTMLElement) {
        const question = questions.find(
          (item) => item.id === this.dataset.turnId,
        )
        const isContent =
          this.parentElement?.getAttribute('role') === 'log' &&
          !this.hasAttribute('data-chat-anchor-space')
        const [top, height] = question
          ? [question.top - scrollTop, QUESTION_HEIGHT]
          : isContent
            ? [-scrollTop, contentHeight]
            : [0, CLIENT_HEIGHT]
        return DOMRect.fromRect({ x: 0, y: top, width: 600, height })
      },
    },
  })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  for (const property of [
    'scrollTop',
    'scrollHeight',
    'clientHeight',
    'scrollTo',
    'getBoundingClientRect',
  ]) {
    Reflect.deleteProperty(HTMLElement.prototype, property)
  }
  vi.unstubAllGlobals()
})

describe('loaded conversations', () => {
  it('open at the latest message and follow it', async () => {
    await loadHistory(1000)

    expect(scrollTop).toBe(600)
    expect(log().getAttribute('aria-live')).toBe('polite')
    expect(jumpButton()).toBeNull()

    await resize(1200)
    expect(scrollTop).toBe(800)
  })

  it('switch to another conversation at its latest message', async () => {
    await loadHistory(1000)
    await userScrollTo(100)

    questions = [{ id: 'other', top: 1700 }]
    contentHeight = 2000
    await render()

    expect(scrollTop).toBe(1600)
    expect(space()).toBe(0)
    expect(jumpButton()).toBeNull()
  })
})

describe('a sent question', () => {
  it('is anchored near the top of the view', async () => {
    await loadHistory(1000)
    await send('q2')

    expect(questionInView()).toBe(16)
    expect(behaviors.at(-1)).toBe('smooth')
    // Room below the short answer keeps the question at the top.
    expect(space()).toBe(984 + CLIENT_HEIGHT - 1040)
    expect(jumpButton()).toBeNull()
  })

  it('stays put while its answer streams in, short or long', async () => {
    await loadHistory(1000)
    await send('q2')
    const anchored = scrollTop

    await resize(1200)
    expect(scrollTop).toBe(anchored)
    expect(questionInView()).toBe(16)
    expect(jumpButton()).toBeNull()

    await resize(2400)
    expect(scrollTop).toBe(anchored)
    expect(space()).toBe(0)
    // The answer runs past the view: offer the way down, don't take it.
    expect(jumpButton()?.textContent).toBe('有新内容')
  })

  it('keeps a short answer under its question after streaming ends', async () => {
    await loadHistory(1000)
    await send('q2')
    await resize(1150)
    await render({ pending: false })

    expect(questionInView()).toBe(16)
    expect(space()).toBeGreaterThan(0)
  })

  it('anchors the first question of a new conversation', async () => {
    questions = [{ id: 'q1', top: 24 }]
    contentHeight = 64
    await render({ pending: true })
    await resize(1500)

    expect(scrollTop).toBe(8)
    expect(questionInView()).toBe(16)
  })

  it('keeps a steady space while a short first answer streams in', async () => {
    questions = [{ id: 'q1', top: 24 }]
    contentHeight = 64
    await render({ pending: true })
    for (const height of [120, 180, 240, 300]) await resize(height)

    expect(space()).toBe(8 + CLIENT_HEIGHT - 300)
    expect(questionInView()).toBe(16)
    expect(jumpButton()).toBeNull()
  })

  it('does not move when the reader scrolls up during the answer', async () => {
    await loadHistory(1000)
    await send('q2')
    await resize(2000)
    await userScrollTo(500)
    await resize(2600)

    expect(scrollTop).toBe(500)
    expect(jumpButton()).not.toBeNull()
  })

  it('keeps the jump button hidden while its smooth scroll is on the way', async () => {
    await loadHistory(1000)
    // A browser animates: the first scroll events land part of the way.
    const animate = vi
      .spyOn(HTMLElement.prototype, 'scrollTo')
      .mockImplementation(function (this: HTMLElement, options) {
        const target = clamp((options as ScrollToOptions).top ?? scrollTop)
        scrollTop = Math.round((scrollTop + target) / 2)
        this.dispatchEvent(new Event('scroll'))
        pendingEnd = () => {
          scrollTop = target
          this.dispatchEvent(new Event('scroll'))
          this.dispatchEvent(new Event('scrollend'))
        }
      })
    let pendingEnd = () => {}
    await send('q2')
    // The answer's header appears while the view is still on its way.
    await resize(1300)

    expect(jumpButton()).toBeNull()

    await act(async () => pendingEnd())
    animate.mockRestore()

    expect(questionInView()).toBe(16)
    expect(jumpButton()).toBeNull()
  })

  it('hides the jump button as soon as a question is sent from mid-thread', async () => {
    await loadHistory(1000)
    await send('q2')
    await resize(2400)
    expect(jumpButton()).not.toBeNull()

    vi.spyOn(HTMLElement.prototype, 'scrollTo').mockImplementation(() => {})
    questions = [...questions, { id: 'q3', top: 2400 }]
    contentHeight = 2440
    await render({ pending: true })

    expect(jumpButton()).toBeNull()
  })

  it('jumps instantly when the app setting reduces motion', async () => {
    setAppearance({ motion: 'reduced' })
    try {
      await loadHistory(1000)
      await send('q2')

      expect(behaviors.at(-1)).toBe('auto')
      expect(questionInView()).toBe(16)
    } finally {
      setAppearance({ motion: 'system' })
    }
  })
})

describe('reading earlier messages', () => {
  it('keeps the position when content grows after the reader scrolls up', async () => {
    await loadHistory(1000)
    await userScrollTo(300)

    expect(jumpButton()?.textContent).toBe('回到最新')

    await resize(1500)

    expect(scrollTop).toBe(300)
    expect(jumpButton()?.textContent).toBe('有新内容')
  })

  it('returns to the latest message from the jump button and keeps following', async () => {
    await loadHistory(1000)
    await send('q2')
    await resize(2400)

    await act(async () => jumpButton()!.click())

    expect(scrollTop).toBe(2000)
    expect(jumpButton()).toBeNull()
    expect(document.activeElement).toBe(log())

    await resize(2700)
    expect(scrollTop).toBe(2300)
  })

  it('only follows again once the reader is back near the latest', async () => {
    await loadHistory(1500)
    await userScrollTo(300)
    await userScrollTo(1000)

    expect(jumpButton()).not.toBeNull()

    await userScrollTo(1060)

    expect(jumpButton()).toBeNull()
    await resize(1800)
    expect(scrollTop).toBe(1400)
  })

  it('keeps reading when shrinking content clamps the view to the end', async () => {
    await loadHistory(3000)
    await userScrollTo(1500)

    // A collapsing panel shrinks the content; the browser clamps scrollTop.
    await resize(1200)
    await userScrollTo(1500)
    await resize(1600)

    expect(scrollTop).toBe(800)
    expect(jumpButton()?.textContent).toBe('有新内容')
  })

  it('does not jump while the reader is selecting text', async () => {
    await loadHistory(1000)
    await act(async () =>
      log().dispatchEvent(new Event('pointerdown', { bubbles: true })),
    )
    await resize(1500)

    expect(scrollTop).toBe(600)

    await act(async () => window.dispatchEvent(new Event('pointerup')))
    await resize(1600)

    expect(scrollTop).toBe(1200)
  })
})
