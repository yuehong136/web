import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  BRAND_GLYPH_GIVE_INTERVAL_MS,
  BrandGlyph,
  useBrandGlyphRunState,
  type BrandGlyphProps,
} from '../brand-glyph'

let host: HTMLDivElement
let root: Root
const animate = vi.fn()

beforeEach(() => {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  animate.mockClear()
  Object.defineProperty(SVGElement.prototype, 'animate', {
    configurable: true,
    value: animate,
  })
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.useRealTimers()
  Reflect.deleteProperty(SVGElement.prototype, 'animate')
})

const glyph = () => host.querySelector<SVGSVGElement>('[data-brand-glyph]')!
const cores = () => [...glyph().querySelectorAll('.brand-glyph-core')]

it('is decorative unless labelled, and paints the core with the AI gradient', async () => {
  await act(async () => root.render(<BrandGlyph />))
  expect(glyph().getAttribute('aria-hidden')).toBe('true')
  expect(glyph().getAttribute('role')).toBeNull()
  const gradient = glyph().querySelector('linearGradient')!
  expect(cores()[0].getAttribute('fill')).toBe(`url(#${gradient.id})`)

  await act(async () => root.render(<BrandGlyph paint="mono" label="Cairvo" />))
  expect(glyph().getAttribute('role')).toBe('img')
  expect(glyph().getAttribute('aria-label')).toBe('Cairvo')
  expect(glyph().querySelector('linearGradient')).toBeNull()
  expect(cores()[0].getAttribute('fill')).toBe('currentColor')
})

it('finishes by laying the gradient core over a resting one that it fades into', async () => {
  await act(async () => root.render(<BrandGlyph state="done" />))
  expect(glyph().dataset.state).toBe('done')
  const [rest, fade] = cores()
  expect(rest.getAttribute('fill')).toBe('currentColor')
  expect(fade.classList.contains('brand-glyph-fade')).toBe(true)
})

it('loops while streaming without chunk events', async () => {
  await act(async () => root.render(<BrandGlyph state="streaming" />))
  expect(cores()[0].classList.contains('brand-glyph-loop')).toBe(true)
  await act(async () => root.render(<BrandGlyph state="streaming" pulse={1} />))
  expect(cores()[0].classList.contains('brand-glyph-loop')).toBe(false)
})

it('nudges the core as chunks arrive, at most once per interval', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
  const stream = (pulse: number, props: BrandGlyphProps = {}) =>
    act(async () =>
      root.render(<BrandGlyph state="streaming" pulse={pulse} {...props} />),
    )
  await stream(1)
  expect(animate).toHaveBeenCalledTimes(1)
  await stream(2)
  await stream(3)
  expect(animate).toHaveBeenCalledTimes(1)
  await act(async () => vi.advanceTimersByTime(BRAND_GLYPH_GIVE_INTERVAL_MS))
  expect(animate).toHaveBeenCalledTimes(2)
  await act(async () => vi.advanceTimersByTime(BRAND_GLYPH_GIVE_INTERVAL_MS))
  await stream(4)
  expect(animate).toHaveBeenCalledTimes(3)
  await act(async () => root.render(<BrandGlyph state="done" pulse={5} />))
  await act(async () => vi.advanceTimersByTime(BRAND_GLYPH_GIVE_INTERVAL_MS))
  expect(animate).toHaveBeenCalledTimes(3)
})

function RunState({ running, output }: { running: boolean; output: boolean }) {
  return <span data-run-state={useBrandGlyphRunState(running, output)} />
}

it('plays done only for an answer it saw running', async () => {
  const state = () =>
    host.querySelector('[data-run-state]')!.getAttribute('data-run-state')
  const show = (running: boolean, output: boolean) =>
    act(async () => root.render(<RunState running={running} output={output} />))
  await show(false, true)
  expect(state()).toBe('idle')
  await show(true, false)
  expect(state()).toBe('thinking')
  await show(true, true)
  expect(state()).toBe('streaming')
  await show(false, true)
  expect(state()).toBe('done')
})
