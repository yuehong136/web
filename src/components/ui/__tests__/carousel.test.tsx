import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../carousel'

// jsdom has no layout for Embla to measure, so the test owns the scroll limits.
const embla = vi.hoisted(() => {
  const state = { canScrollPrev: false, canScrollNext: true }
  return {
    state,
    api: {
      canScrollPrev: () => state.canScrollPrev,
      canScrollNext: () => state.canScrollNext,
      scrollPrev: vi.fn(),
      scrollNext: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    },
  }
})

vi.mock('embla-carousel-react', () => ({
  default: () => [() => {}, embla.api],
}))

let root: Root
let container: HTMLDivElement

const arrow = (slot: 'previous' | 'next') =>
  container.querySelector<HTMLButtonElement>(`[data-slot="carousel-${slot}"]`)!
// aria-label wins over content; the default icon is an svg without text.
const nameOf = (button: HTMLButtonElement) =>
  button.getAttribute('aria-label') ?? button.textContent

async function render(arrows: ReactNode) {
  await act(async () =>
    root.render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>Fig. 1</CarouselItem>
          <CarouselItem>Fig. 2</CarouselItem>
        </CarouselContent>
        {arrows}
      </Carousel>,
    ),
  )
}

beforeEach(async () => {
  await setProductLanguage('en-US')
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  embla.state.canScrollPrev = false
  embla.state.canScrollNext = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('Carousel arrows', () => {
  it('name the previous and next slide in the product language', async () => {
    await render(
      <>
        <CarouselPrevious />
        <CarouselNext />
      </>,
    )
    expect(nameOf(arrow('previous'))).toBe('Previous slide')
    expect(nameOf(arrow('next'))).toBe('Next slide')
    expect(arrow('next').querySelector('svg')).not.toBeNull()

    await act(async () => setProductLanguage('zh-CN'))
    expect(nameOf(arrow('previous'))).toBe('上一张')
    expect(nameOf(arrow('next'))).toBe('下一张')
  })

  it('keep a caller-supplied aria-label or content', async () => {
    await setProductLanguage('zh-CN')
    await render(
      <>
        <CarouselPrevious aria-label="Earlier figures" />
        <CarouselNext>More figures</CarouselNext>
      </>,
    )
    expect(nameOf(arrow('previous'))).toBe('Earlier figures')
    expect(arrow('next').textContent).toBe('More figures')
    expect(arrow('next').querySelector('svg')).toBeNull()
  })

  it('scroll only where Embla can, by button and by arrow key', async () => {
    await render(
      <>
        <CarouselPrevious />
        <CarouselNext />
      </>,
    )
    expect(arrow('previous').disabled).toBe(true)
    expect(arrow('next').disabled).toBe(false)

    await act(async () => arrow('previous').click())
    await act(async () => arrow('next').click())
    expect(embla.api.scrollPrev).not.toHaveBeenCalled()
    expect(embla.api.scrollNext).toHaveBeenCalledTimes(1)

    const key = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
      cancelable: true,
    })
    await act(async () =>
      container.querySelector('[role="region"]')!.dispatchEvent(key),
    )
    expect(key.defaultPrevented).toBe(true)
    expect(embla.api.scrollPrev).toHaveBeenCalledTimes(1)

    // Embla moved to the last slide: the arrows follow its new limits.
    embla.state.canScrollPrev = true
    embla.state.canScrollNext = false
    const onSelect = embla.api.on.mock.calls.find(
      ([event]) => event === 'select',
    )![1]
    await act(async () => onSelect(embla.api))
    expect(arrow('previous').disabled).toBe(false)
    expect(arrow('next').disabled).toBe(true)
  })
})
