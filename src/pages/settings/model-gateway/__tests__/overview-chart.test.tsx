// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GatewayOverview } from '@/api/model-gateway'
import { sparklinePath } from '../components/overview/kpi-card'
import {
  RequestsChart,
  niceCeiling,
} from '../components/overview/requests-chart'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key} ${JSON.stringify(values)}` : key,
  }),
}))

const overview = {
  bucket: 'day',
  window: {
    start: '2026-11-24T00:00:00Z',
    end: '2026-11-27T00:00:00Z',
    days: 7,
  },
  totals: { requests: 150, errors: 12 },
  series: [
    {
      start: '2026-11-24T00:00:00Z',
      requests: 40,
      errors: 0,
      total_tokens: 9000,
      spend: 0.12,
    },
    {
      start: '2026-11-25T00:00:00Z',
      requests: 100,
      errors: 10,
      total_tokens: 52000,
      spend: 1.5,
    },
    {
      start: '2026-11-26T00:00:00Z',
      requests: 10,
      errors: 2,
      total_tokens: 800,
      spend: 0.01,
    },
  ],
} as unknown as GatewayOverview

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

describe('gateway overview chart', () => {
  it('scales to a round ceiling', () => {
    expect([0, 7, 10, 13, 180, 1070].map(niceCeiling)).toEqual([
      0, 8, 10, 15, 200, 1200,
    ])
  })

  it('draws no trend for a flat or single-point series', () => {
    expect(sparklinePath([0, 0, 0])).toBeNull()
    expect(sparklinePath([5])).toBeNull()
    expect(sparklinePath([0, 10])).toBe('M0.00 27.00 L100.00 1.00')
  })

  it('shows every number of the bucket the keyboard moves to', async () => {
    await act(async () => root.render(<RequestsChart overview={overview} />))
    const slider = container.querySelector<HTMLInputElement>(
      'input[type="range"]',
    )!
    const tip = () =>
      container.querySelector('[data-testid="gateway-chart-tip"]')
    const values = () =>
      [...(tip()?.querySelectorAll('dd') ?? [])].map((node) => node.textContent)
    expect(tip()).toBeNull()

    // Focus starts on the latest bucket.
    await act(async () => slider.focus())
    expect(values()).toEqual(['10', '8', '2 · 20%', '800', '$0.01'])

    await act(async () => {
      const setValue = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!
      setValue.call(slider, '1')
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(values().slice(0, 4)).toEqual(['100', '90', '10 · 10%', '52,000'])

    await act(async () => slider.blur())
    expect(tip()).toBeNull()
  })
})
