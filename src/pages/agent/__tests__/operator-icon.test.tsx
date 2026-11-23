import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Operator } from '@/pages/agent/constant'
import OperatorIcon, { OperatorTile } from '../operator-icon'
import { LucideIconMap } from '../operator-icon.constants'

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

it('draws every operator with a Lucide glyph, never an icon-font symbol', async () => {
  const missing: string[] = []
  for (const operator of Object.values(Operator)) {
    if (!LucideIconMap[operator]) continue
    await act(async () => root.render(<OperatorIcon name={operator} />))
    const svg = host.querySelector('svg')
    if (!svg?.classList.contains('lucide') || host.querySelector('use'))
      missing.push(operator)
  }
  expect(missing).toEqual([])
})

it('no longer renders A2UI and Note blank', async () => {
  for (const operator of [Operator.A2UI, Operator.Note]) {
    await act(async () => root.render(<OperatorTile name={operator} />))
    const tile = host.querySelector('[data-slot="operator-tile"]')!
    expect(tile.querySelector('svg.lucide'), operator).not.toBeNull()
  }
})
