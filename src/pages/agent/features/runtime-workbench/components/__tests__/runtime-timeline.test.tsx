import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { RuntimeTimeline, type RuntimeTimelineItem } from '../runtime-timeline'

let root: Root
let host: HTMLDivElement
const items: RuntimeTimelineItem[] = [
  {
    key: 'begin',
    title: 'Begin',
    status: 'success',
    icon: <span />,
  },
  {
    key: 'agent',
    title: 'Agent',
    description: 'Running',
    status: 'loading',
    blink: true,
    icon: <span />,
    content: <p>Inputs and outputs</p>,
  },
]

function Harness() {
  const [expanded, setExpanded] = useState<string[]>([])
  return (
    <RuntimeTimeline
      items={items}
      expandedKeys={expanded}
      onExpand={setExpanded}
      line="dashed"
    />
  )
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await act(async () => root.render(<Harness />))
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('lists steps with their status, connecting line and running pulse', () => {
  const steps = [...host.querySelectorAll('li')]
  expect(steps.map((step) => step.dataset.status)).toEqual([
    'success',
    'loading',
  ])
  expect(host.querySelector('ol')?.dataset.line).toBe('dashed')
  expect(host.querySelectorAll('.runtime-timeline-line')).toHaveLength(1)
  expect(steps[1].querySelector('[data-blink]')).not.toBeNull()
})

it('expands only steps with details, from their title', async () => {
  // A step without details has no toggle.
  expect(host.querySelectorAll('button')).toHaveLength(1)
  const toggle = host.querySelector('button')!
  expect(toggle.getAttribute('aria-expanded')).toBe('false')
  expect(host.textContent).not.toContain('Inputs and outputs')
  await act(async () => toggle.click())
  expect(toggle.getAttribute('aria-expanded')).toBe('true')
  expect(
    document.getElementById(toggle.getAttribute('aria-controls')!)?.textContent,
  ).toBe('Inputs and outputs')
  await act(async () => toggle.click())
  expect(host.textContent).not.toContain('Inputs and outputs')
})
