import { beforeAll, expect, it } from 'vitest'
import type { GatewayCatalogModel } from '@/api/model-gateway'
import { setProductLanguage } from '@/locales/i18n'
import {
  formatCost,
  formatRate,
  parsePriceDraft,
  perTokenOf,
  priceDraftOf,
  priceSummary,
} from '../pricing'

beforeAll(() => setProductLanguage('en-US'))

it('shows a cost with the decimals its size needs', () => {
  expect(formatCost(12.345)).toBe('$12.35')
  expect(formatCost(0.4)).toBe('$0.40')
  expect(formatCost(0.0042)).toBe('$0.0042')
  expect(formatCost(0.000007)).toBe('$0.000007')
  expect(formatCost(0)).toBe('$0.00')
})

it('shows per-token rates as prices per million tokens', () => {
  expect(formatRate(4e-7)).toBe('$0.40')
  expect(
    priceSummary({
      source: 'litellm',
      input_cost_per_token: 2.5e-6,
      output_cost_per_token: 1e-5,
      cache_read_input_token_cost: null,
      tiered: false,
    }),
  ).toBe('$2.50 / $10.00')
  expect(priceSummary(null)).toBe(null)
})

it('turns a price per million into an exact per-token decimal', () => {
  expect(perTokenOf('1')).toBe('0.000001')
  expect(perTokenOf('0.4')).toBe('0.0000004')
  expect(perTokenOf('2.50')).toBe('0.0000025')
  expect(perTokenOf('250000')).toBe('0.25')
  expect(perTokenOf('0.000001')).toBe('0.000000000001')
  expect(perTokenOf('0')).toBe('0')
  expect(perTokenOf('  ')).toBe(null)
  for (const bad of ['-1', '1e3', 'abc', '1.0000001', '1.', '.5', '1250000'])
    expect(perTokenOf(bad)).toBe(undefined)
})

it('sends the three rates as one price and rejects a price without an input rate', () => {
  expect(
    parsePriceDraft({ input: '0.4', output: '1.2', cacheRead: '' }),
  ).toEqual({
    input_cost_per_token: '0.0000004',
    output_cost_per_token: '0.0000012',
    cache_read_input_token_cost: null,
  })
  expect(parsePriceDraft({ input: '', output: '', cacheRead: '' })).toEqual({
    input_cost_per_token: null,
    output_cost_per_token: null,
    cache_read_input_token_cost: null,
  })
  expect(parsePriceDraft({ input: '', output: '1.2', cacheRead: '' })).toBe(
    null,
  )
  expect(parsePriceDraft({ input: 'x', output: '', cacheRead: '' })).toBe(null)
})

it('reads the saved price back as the per-million figures that were typed', () => {
  const model = {
    custom_pricing: {
      input_cost_per_token: 4e-7,
      output_cost_per_token: 1.2e-6,
      cache_read_input_token_cost: null,
    },
  } as GatewayCatalogModel
  expect(priceDraftOf(model)).toEqual({
    input: '0.4',
    output: '1.2',
    cacheRead: '',
  })
  expect(priceDraftOf({} as GatewayCatalogModel)).toEqual({
    input: '',
    output: '',
    cacheRead: '',
  })
})
