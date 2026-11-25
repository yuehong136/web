import type { TFunction } from 'i18next'
import type {
  GatewayCatalogModel,
  GatewayCatalogModelUpdate,
  GatewayPricing,
} from '@/api/model-gateway'
import { getCurrentLanguage } from '@/locales/i18n'
import { PREFIX } from './utils'

const MILLION = 1_000_000

/**
 * US dollars with as many decimals as the amount needs: "$12.35", "$0.0042",
 * "$0.000007". Costs of single calls are far below a cent.
 */
export function formatCost(usd: number): string {
  const digits = usd !== 0 && Math.abs(usd) < 0.01 ? 6 : usd < 1 ? 4 : 2
  return new Intl.NumberFormat(getCurrentLanguage(), {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  }).format(usd)
}

/** A per-token rate as its price per million tokens: "$0.40". */
export const formatRate = (perToken: number): string =>
  formatCost(perToken * MILLION)

/** "$0.40 / $1.20": input and output per million tokens, or `null` unpriced. */
export function priceSummary(pricing: GatewayPricing | null | undefined) {
  if (!pricing) return null
  return `${formatRate(pricing.input_cost_per_token)} / ${formatRate(pricing.output_cost_per_token)}`
}

/** "128K context", from LiteLLM's listing of the model. */
export function contextSummary(
  t: TFunction,
  model: Pick<GatewayCatalogModel, 'max_input_tokens'>,
): string | null {
  if (!model.max_input_tokens) return null
  return t(`${PREFIX}.models.contextWindow`, {
    value: new Intl.NumberFormat(getCurrentLanguage(), {
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(model.max_input_tokens),
  })
}

/** The operator's price as typed: US dollars per million tokens. */
export interface PriceDraft {
  input: string
  output: string
  cacheRead: string
}

const draftValue = (perToken: number | null | undefined): string =>
  perToken === null || perToken === undefined
    ? ''
    : String(Number((perToken * MILLION).toFixed(6)))

export const priceDraftOf = (model: GatewayCatalogModel): PriceDraft => ({
  input: draftValue(model.custom_pricing?.input_cost_per_token),
  output: draftValue(model.custom_pricing?.output_cost_per_token),
  cacheRead: draftValue(model.custom_pricing?.cache_read_input_token_cost),
})

/**
 * A price per million tokens as an exact per-token decimal string, shifting
 * the decimal point instead of dividing. `''` is "not set"; anything that is
 * not a plain non-negative decimal with at most six places is `undefined`.
 */
export function perTokenOf(perMillion: string): string | null | undefined {
  const text = perMillion.trim()
  if (text === '') return null
  const match = /^(\d{1,6})(?:\.(\d{1,6}))?$/.exec(text)
  if (!match) return undefined
  // Six places to the left: the last six whole digits join the fraction.
  const padded = match[1].padStart(7, '0')
  const whole = String(Number(padded.slice(0, -6)))
  const fraction = (padded.slice(-6) + (match[2] ?? '')).replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole
}

type PriceUpdate = Pick<
  GatewayCatalogModelUpdate,
  | 'input_cost_per_token'
  | 'output_cost_per_token'
  | 'cache_read_input_token_cost'
>

/**
 * The price fields to send for a draft: all three together, because the
 * server reads them as one price. `null` when the draft is invalid — a bad
 * number, or an output or cache rate without an input rate.
 */
export function parsePriceDraft(draft: PriceDraft): PriceUpdate | null {
  const input = perTokenOf(draft.input)
  const output = perTokenOf(draft.output)
  const cacheRead = perTokenOf(draft.cacheRead)
  if (input === undefined || output === undefined || cacheRead === undefined)
    return null
  if (input === null && (output !== null || cacheRead !== null)) return null
  return {
    input_cost_per_token: input,
    output_cost_per_token: output,
    cache_read_input_token_cost: cacheRead,
  }
}

export const samePriceDraft = (a: PriceDraft, b: PriceDraft) =>
  a.input.trim() === b.input.trim() &&
  a.output.trim() === b.output.trim() &&
  a.cacheRead.trim() === b.cacheRead.trim()
