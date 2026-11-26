// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { GatewayOverview } from '@/api/model-gateway'
import { ChartTooltipCard } from '@/components/charts'
import { RequestsChart, chartRows } from '../components/overview/requests-chart'

const overview = {
  bucket: 'day',
  window: {
    start: '2026-11-24T00:00:00Z',
    end: '2026-11-27T00:00:00Z',
    days: 7,
  },
  totals: { requests: 150, errors: 12 },
  series: [
    { start: '2026-11-24T00:00:00Z', requests: 40, errors: 0 },
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
  it('splits each bucket into succeeded and failed calls that stack to its requests', () => {
    const rows = chartRows(overview)

    expect(
      rows.map((row) => [row.requests, row.succeeded, row.errors]),
    ).toEqual([
      [40, 40, 0],
      [100, 90, 10],
      [10, 8, 2],
    ])
    // A bucket the server sent without usage has no token or spend figure, not a zero.
    expect([rows[0].tokens, rows[0].spend]).toEqual([undefined, undefined])
    expect([rows[1].tokens, rows[1].spend]).toEqual([52000, 1.5])
    expect(rows[1].title).toContain(rows[1].label)
  })

  it('keeps every bucket readable without the drawing', async () => {
    await act(async () => root.render(<RequestsChart overview={overview} />))

    const cells = [...container.querySelectorAll('table td')].map(
      (cell) => cell.textContent ?? '',
    )
    expect(cells).toHaveLength(3)
    expect(cells[1]).toContain('100')
    expect(cells[1]).toContain('10')
  })

  it('lists the figures of a point with their series colours', async () => {
    await act(async () =>
      root.render(
        <ChartTooltipCard
          title="11/25"
          rows={[
            { label: 'Requests', value: '100', strong: true },
            { label: 'Failed', value: '10 · 10%', color: 'rgb(1, 2, 3)' },
          ]}
        />,
      ),
    )

    const card = container.querySelector('[data-testid="chart-tooltip"]')!
    expect(card.textContent).toContain('11/25')
    expect(
      [...card.querySelectorAll('dd')].map((node) => node.textContent),
    ).toEqual(['100', '10 · 10%'])
    expect(
      card.querySelector<HTMLElement>('dt span')?.style.backgroundColor,
    ).toBe('rgb(1, 2, 3)')
  })
})
