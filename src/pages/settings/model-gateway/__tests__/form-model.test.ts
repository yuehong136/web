import { describe, expect, it } from 'vitest'
import {
  PUBLIC_NAME_PATTERN,
  limitDraftOf,
  parseExpiry,
  parseLimits,
  parsePositiveInteger,
  parseQuota,
  quotaDraftOf,
  suggestPublicName,
  toLocalInputValue,
} from '../form-model'

describe('limit parsing', () => {
  it('reads an empty field as unlimited and a positive integer as itself', () => {
    expect(parsePositiveInteger('')).toBeNull()
    expect(parsePositiveInteger('   ')).toBeNull()
    expect(parsePositiveInteger(' 60 ')).toBe(60)
  })

  it.each(['0', '-1', '1.5', '1e3', 'abc', '007', '2000000001'])(
    'rejects %s',
    (value) => {
      expect(parsePositiveInteger(value)).toBeUndefined()
    },
  )

  it('builds the three limits, or nothing when any field is invalid', () => {
    expect(parseLimits({ rpm: '60', tpm: '', parallel: '4' })).toEqual({
      rpm_limit: 60,
      tpm_limit: null,
      max_parallel_requests: 4,
    })
    expect(parseLimits({ rpm: '60', tpm: 'many', parallel: '' })).toBeNull()
  })

  it('round-trips stored limits through the draft', () => {
    const limits = { rpm_limit: 60, tpm_limit: null, max_parallel_requests: 4 }
    expect(parseLimits(limitDraftOf(limits))).toEqual(limits)
  })
})

describe('quota parsing', () => {
  it('sends the quota and its period together, or both as null', () => {
    expect(parseQuota({ tokens: '', period: 'none' })).toEqual({
      token_quota: null,
      quota_period: null,
    })
    // A stale amount is ignored once the period is "none".
    expect(parseQuota({ tokens: '500', period: 'none' })).toEqual({
      token_quota: null,
      quota_period: null,
    })
    expect(parseQuota({ tokens: '5000000', period: 'month' })).toEqual({
      token_quota: 5_000_000,
      quota_period: 'month',
    })
  })

  it('requires a positive amount once a period is chosen', () => {
    expect(parseQuota({ tokens: '', period: 'day' })).toBeNull()
    expect(parseQuota({ tokens: '0', period: 'day' })).toBeNull()
  })

  it('accepts quotas above the rate-limit ceiling', () => {
    expect(parseQuota({ tokens: '50000000000', period: 'month' })).toEqual({
      token_quota: 50_000_000_000,
      quota_period: 'month',
    })
  })

  it('shows a stored quota only when both parts exist', () => {
    expect(quotaDraftOf(1000, 'day')).toEqual({ tokens: '1000', period: 'day' })
    expect(quotaDraftOf(null, null)).toEqual({ tokens: '', period: 'none' })
  })
})

describe('public names', () => {
  it('suggests a valid public name from a registered model name', () => {
    expect(suggestPublicName('qwen-plus___VLLM')).toBe('qwen-plus')
    expect(suggestPublicName('Qwen/Qwen2.5 72B Instruct')).toBe(
      'Qwen/Qwen2.5-72B-Instruct',
    )
    expect(suggestPublicName('  -local model')).toBe('local-model')
    expect(
      PUBLIC_NAME_PATTERN.test(suggestPublicName('bge-m3___OpenAI-API')),
    ).toBe(true)
  })

  it.each(['chat-default', 'org/model:v1', 'a', 'gpt-6.1@prod'])(
    'accepts %s',
    (name) => expect(PUBLIC_NAME_PATTERN.test(name)).toBe(true),
  )

  it.each(['', '-leading', 'has space', '中文', 'a'.repeat(129)])(
    'rejects %s',
    (name) => expect(PUBLIC_NAME_PATTERN.test(name)).toBe(false),
  )
})

describe('expiry', () => {
  const now = Date.parse('2026-11-15T10:00:00Z')

  it('reads an empty value as "never expires"', () => {
    expect(parseExpiry('', now)).toBeNull()
  })

  it('accepts only instants in the future', () => {
    expect(parseExpiry('2026-11-14T10:00', now)).toBeUndefined()
    expect(parseExpiry('not a date', now)).toBeUndefined()
    const parsed = parseExpiry('2027-01-01T00:00', now)
    expect(parsed).toBe(new Date('2027-01-01T00:00').toISOString())
  })

  it('round-trips an instant through the local input value', () => {
    const iso = new Date('2027-03-04T05:06').toISOString()
    expect(toLocalInputValue(iso)).toBe('2027-03-04T05:06')
    expect(toLocalInputValue(null)).toBe('')
    expect(toLocalInputValue('garbage')).toBe('')
  })
})
