import { readFileSync } from 'node:fs'
import { act } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ResourceCard, ResourceGrid } from '../resource-card'
import { ResourceList, ResourceRow } from '../resource-row'
import { ENTER_LIMIT } from '../resource-presence'
import { click, mount } from './collection-test-utils'

const stylesheet = readFileSync(
  'src/components/patterns/resource-presence.css',
  'utf8',
)
let view: ReturnType<typeof mount>
const onOpen = vi.fn()
beforeEach(() => {
  vi.useFakeTimers()
  onOpen.mockReset()
  view = mount()
})
afterEach(async () => {
  await view.unmount()
  vi.useRealTimers()
})

const names = (count: number, from = 0) =>
  Array.from({ length: count }, (_, index) => `Item ${from + index}`)
const grid = (items: string[]) =>
  view.render(
    <ResourceGrid label="Apps">
      {items.map((name) => (
        <ResourceCard key={name} name={name} onOpen={() => onOpen(name)} />
      ))}
    </ResourceGrid>,
  )
const list = (items: string[]) =>
  view.render(
    <ResourceList label="Apps">
      {items.map((name) => (
        <ResourceRow key={name} name={name} onOpen={() => onOpen(name)} />
      ))}
    </ResourceList>,
  )
const items = () => [...view.container.querySelectorAll('li')]
const phases = () =>
  items().map((item) => item.getAttribute('data-resource-motion'))
const settle = () => act(async () => vi.advanceTimersByTime(1000))
const open = (item: Element) =>
  click(item.querySelector('button[data-slot="resource-name"]')!)

it('staggers the first load by position, leaves the far tail still and settles', async () => {
  await grid(names(ENTER_LIMIT + 2))
  const rendered = items()
  expect(rendered).toHaveLength(ENTER_LIMIT + 2)
  expect(phases().slice(0, ENTER_LIMIT)).toEqual(
    Array(ENTER_LIMIT).fill('stagger'),
  )
  // Far below the fold: no animation at all.
  expect(phases().slice(ENTER_LIMIT)).toEqual([null, null])
  // The stagger comes from the stylesheet; items carry no inline styles.
  expect(view.container.querySelector('li[style]')).toBeNull()

  // Entering cards are already clickable.
  await open(rendered[1])
  expect(onOpen).toHaveBeenCalledExactlyOnceWith('Item 1')

  await settle()
  expect(phases().every((phase) => phase === null)).toBe(true)
  expect(items()).toHaveLength(ENTER_LIMIT + 2)
})

it('fades in an added row alone and fades out a removed one before it leaves', async () => {
  await list(['a', 'b', 'c'])
  await settle()

  await list(['a', 'b', 'c', 'd'])
  expect(phases()).toEqual([null, null, null, 'enter'])
  await settle()

  await list(['a', 'c', 'd'])
  const leaving = items()[1]
  expect(items().map((item) => item.textContent)).toEqual(['a', 'b', 'c', 'd'])
  expect(leaving.getAttribute('data-resource-motion')).toBe('exit')
  expect(leaving.hasAttribute('inert')).toBe(true)
  // The rows that stay remain usable while the other one fades.
  await open(items()[2])
  expect(onOpen).toHaveBeenCalledExactlyOnceWith('c')

  await settle()
  expect(items().map((item) => item.textContent)).toEqual(['a', 'c', 'd'])
  expect(phases()).toEqual([null, null, null])
})

it('swaps pages and large filter changes without motion', async () => {
  await grid(names(10))
  await settle()

  // Next page: nothing in common with the current one.
  await grid(names(10, 10))
  expect(items().map((item) => item.textContent)).toEqual(names(10, 10))
  expect(phases().every((phase) => phase === null)).toBe(true)

  // A filter that drops most items: they go at once, nothing animates.
  await grid(['Item 12', 'Item 15'])
  expect(items().map((item) => item.textContent)).toEqual([
    'Item 12',
    'Item 15',
  ])
  expect(phases()).toEqual([null, null])
})

it('keeps the rise and stagger out of reduced motion', () => {
  const css = stylesheet.replace(/\/\*[\s\S]*?\*\//g, '')
  const noPreference = '@media (prefers-reduced-motion: no-preference)'
  const start = css.indexOf(noPreference)
  expect(start).toBeGreaterThan(-1)
  let depth = 0
  let end = css.indexOf('{', start)
  do {
    if (css[end] === '{') depth += 1
    if (css[end] === '}') depth -= 1
    end += 1
  } while (depth > 0)
  const motionBlock = css.slice(start, end)
  const reducedRules = css.slice(0, start) + css.slice(end)
  const keyframes = (name: string) =>
    css.match(new RegExp(`@keyframes ${name} \\{[^@]*`))?.[0] ?? ''
  const usedOutside = [...reducedRules.matchAll(/animation:\s*([\w-]+)/g)].map(
    ([, name]) => name,
  )

  expect(motionBlock).toContain('animation-name: resource-enter')
  // Twelve stagger steps, the rest sharing the last one.
  expect(motionBlock.match(/:nth-child\(\d+\)/g)).toHaveLength(11)
  expect(motionBlock).toMatch(
    /:nth-child\(n \+ 13\)\s*\{\s*animation-delay: 288ms/,
  )
  expect(keyframes('resource-enter')).toContain('translate')
  expect(usedOutside).toEqual(['resource-fade-in', 'resource-fade-out'])
  for (const name of usedOutside)
    expect(keyframes(name)).not.toMatch(/translate|scale|transform|rotate/)
  expect(reducedRules).not.toMatch(/nth-child|animation-delay:\s*[1-9]/)
})
