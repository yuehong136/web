import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Badge, badgeLook } from '../badge'

let root: Root
let host: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('p')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

const badge = () => host.querySelector<HTMLElement>('[data-slot="badge"]')!

it('renders an inline span, so it can sit inside a paragraph', async () => {
  await act(async () => root.render(<Badge>Draft</Badge>))
  expect(badge().tagName).toBe('SPAN')
  expect(badge().dataset.tone).toBe('neutral')
  expect(badge().className).toContain('bg-fill-muted')
})

it('combines a semantic tone with soft, outline and solid variants', async () => {
  await act(async () => root.render(<Badge tone="ai">Generated</Badge>))
  expect(badge().className).toContain('bg-ai-soft')
  expect(badge().className).toContain('text-ai-fg')
  await act(async () =>
    root.render(
      <Badge tone="danger" variant="outline">
        Failed
      </Badge>,
    ),
  )
  expect(badge().className).toContain('border-danger-line')
  await act(async () =>
    root.render(
      <Badge tone="accent" variant="solid">
        New
      </Badge>,
    ),
  )
  expect(badge().className).toContain('bg-accent-solid')
})

it('tints categories with an identity colour instead of a hue name', async () => {
  await act(async () => root.render(<Badge identity={7}>Task</Badge>))
  expect(badge().className).toContain('bg-avatar-7-bg')
  expect(badge().dataset.tone).toBeUndefined()
})

it('maps the old colour names for existing status maps', () => {
  expect(badgeLook('destructive')).toEqual({ tone: 'danger' })
  expect(badgeLook('secondary')).toEqual({})
  expect(badgeLook('blue')).toEqual({ identity: 6 })
  expect(badgeLook(undefined)).toEqual({})
})
