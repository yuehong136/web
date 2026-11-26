// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { GatewayOverview } from '@/api/model-gateway'
import { ChartCard, ChartTooltipCard } from '@/components/charts'
import { setProductLanguage } from '@/locales/i18n'
import { UsageCharts, usageRows } from '../components/overview/usage-charts'

const overview = {
  bucket: 'day',
  window: {
    start: '2026-11-24T00:00:00Z',
    end: '2026-11-27T00:00:00Z',
    days: 7,
  },
  totals: {
    requests: 150,
    errors: 12,
    prompt_tokens: 40000,
    completion_tokens: 12800,
    total_tokens: 52800,
    spend: 1.51,
    duration_p50_ms: 820,
    duration_p95_ms: 2400,
  },
  series_models: [
    { model_id: 'm1', name: 'qwen-flash', provider: 'Tongyi-Qianwen' },
    { model_id: 'other', name: null, provider: null },
  ],
  series: [
    // A bucket from a server that predates the splits: one token figure, nothing else.
    { start: '2026-11-24T00:00:00Z', requests: 40, errors: 0 },
    {
      start: '2026-11-25T00:00:00Z',
      requests: 100,
      errors: 10,
      total_tokens: 52000,
      prompt_tokens: 40000,
      completion_tokens: 12000,
      spend: 1.5,
      models: {
        m1: { requests: 70, total_tokens: 40000, spend: 1.2 },
        other: { requests: 30, total_tokens: 12000, spend: 0.3 },
      },
      latency: { p50_ms: 800, p95_ms: 2400, first_token_p50_ms: 310 },
    },
    {
      start: '2026-11-26T00:00:00Z',
      requests: 10,
      errors: 10,
      total_tokens: 800,
      prompt_tokens: 0,
      completion_tokens: 800,
      spend: 0.01,
      models: { m1: { requests: 10, total_tokens: 800, spend: 0.01 } },
      latency: null,
    },
  ],
} as unknown as GatewayOverview

let container: HTMLDivElement
let root: Root

beforeEach(async () => {
  ;(
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true
  await setProductLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

describe('gateway overview charts', () => {
  it('reads each bucket as stacks: calls by outcome, tokens by direction, calls and spend by model', () => {
    const rows = usageRows(overview)

    expect(
      rows.map((row) => [row.requests, row.succeeded, row.errors]),
    ).toEqual([
      [40, 40, 0],
      [100, 90, 10],
      [10, 0, 10],
    ])
    expect([rows[1].prompt, rows[1].completion, rows[1].tokens]).toEqual([
      40000, 12000, 52000,
    ])
    // Per-model figures follow series_models: the named model first, the remainder after it.
    expect([rows[1].requests_0, rows[1].requests_1]).toEqual([70, 30])
    expect([rows[1].spend_0, rows[1].spend_1]).toEqual([1.2, 0.3])
    // A model absent from a bucket is a zero bar, and an old bucket has no split at all.
    expect([rows[2].requests_0, rows[2].requests_1]).toEqual([10, 0])
    expect([rows[0].requests_0, rows[0].prompt]).toEqual([0, 0])
    expect(rows[1].title).toContain(rows[1].label)
  })

  it('leaves a bucket without answered calls out of the latency lines', () => {
    const rows = usageRows(overview)

    expect([rows[1].p50, rows[1].p95, rows[1].firstToken]).toEqual([
      800, 2400, 310,
    ])
    expect([rows[2].p50, rows[2].p95, rows[2].firstToken]).toEqual([
      null,
      null,
      null,
    ])
  })

  it('gives every question its own card with the total of the window', async () => {
    await act(async () => root.render(<UsageCharts overview={overview} />))

    const cards = [...container.querySelectorAll('h3')].map((heading) => [
      heading.textContent,
      heading.parentElement?.querySelector('p span')?.textContent,
    ])
    expect(cards).toEqual([
      ['Requests', '150'],
      ['Token usage', '52.8K'],
      ['Spend by model', '$1.51'],
      ['Model calls', '1'],
      ['Response time', '820 ms'],
    ])
    // Sums can be bars or lines; percentiles do not add up and stay lines.
    expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(4)
    // The requests chart still reads without its drawing.
    expect(container.querySelectorAll('table td')).toHaveLength(3)
  })

  it('shows why a card has no chart instead of an empty plot', async () => {
    await act(async () =>
      root.render(
        <ChartCard title="Spend" total="$0" empty="No priced calls">
          <svg data-testid="plot" />
        </ChartCard>,
      ),
    )

    expect(container.textContent).toContain('No priced calls')
    expect(container.querySelector('[data-testid="plot"]')).toBeNull()
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
