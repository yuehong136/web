import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Watermark } from '../watermark'

let root: Root
let host: HTMLDivElement
const layer = () => host.querySelector<HTMLElement>('[data-watermark]')!
/** The SVG tile drawn by the mask, decoded. */
const tile = () =>
  decodeURIComponent(
    layer().style.maskImage.replace(/^url\("data:image\/svg\+xml,|"\)$/g, ''),
  )

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await act(async () =>
    root.render(
      <Watermark content={['a&b@example.test', '2026/11/17']}>
        <p>Document</p>
      </Watermark>,
    ),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('repeats each line over the content without catching the pointer', () => {
  expect(host.textContent).toBe('Document')
  expect(tile()).toContain('a&amp;b@example.test')
  expect(tile()).toContain('2026/11/17')
  expect(tile()).toContain('rotate(-22')
  expect(layer().className).toContain('pointer-events-none')
  expect(layer().getAttribute('aria-hidden')).toBe('true')
  // The text colour comes from the theme, not a fixed value.
  expect(layer().style.backgroundColor).toBe('var(--color-text-primary)')
})

it('puts the layer back when it is removed or restyled', async () => {
  const node = layer()
  const style = node.getAttribute('style')
  await act(async () => {
    node.setAttribute('style', 'display: none')
    await Promise.resolve()
  })
  expect(layer().getAttribute('style')).toBe(style)
  await act(async () => {
    node.remove()
    await Promise.resolve()
  })
  expect(layer()).toBe(node)
})

it('draws nothing without content', async () => {
  await act(async () =>
    root.render(
      <Watermark content={['', '']}>
        <p>Document</p>
      </Watermark>,
    ),
  )
  expect(host.querySelector('[data-watermark]')).toBeNull()
})
