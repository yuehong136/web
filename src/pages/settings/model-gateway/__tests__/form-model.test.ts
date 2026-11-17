import { describe, expect, it } from 'vitest'
import {
  ALIAS_PATTERN,
  expiryDraftOf,
  hasLimits,
  limitDraftOf,
  parseExpiry,
  parseExpiryDraft,
  parseLimits,
  parsePositiveInteger,
  parseQuota,
  presetExpiry,
  quotaDraftOf,
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
  it('sends no quota for an empty amount, whatever the period', () => {
    expect(parseQuota({ tokens: '', period: 'month' })).toEqual({
      token_quota: null,
      quota_period: null,
    })
    expect(parseQuota({ tokens: '  ', period: 'day' })).toEqual({
      token_quota: null,
      quota_period: null,
    })
  })

  it('sends a positive amount together with its period', () => {
    expect(parseQuota({ tokens: '5000000', period: 'month' })).toEqual({
      token_quota: 5_000_000,
      quota_period: 'month',
    })
  })

  it('rejects an amount that is not a positive integer', () => {
    expect(parseQuota({ tokens: '0', period: 'day' })).toBeNull()
    expect(parseQuota({ tokens: '1.5', period: 'day' })).toBeNull()
  })

  it('accepts quotas above the rate-limit ceiling', () => {
    expect(parseQuota({ tokens: '50000000000', period: 'month' })).toEqual({
      token_quota: 50_000_000_000,
      quota_period: 'month',
    })
  })

  it('shows a stored quota only when both parts exist', () => {
    expect(quotaDraftOf(1000, 'day')).toEqual({ tokens: '1000', period: 'day' })
    expect(quotaDraftOf(null, null)).toEqual({ tokens: '', period: 'month' })
  })

  it('knows whether any limit or quota is set', () => {
    const none = { rpm: '', tpm: '', parallel: '' }
    expect(hasLimits(none, { tokens: '', period: 'month' })).toBe(false)
    expect(hasLimits({ ...none, tpm: '10' }, quotaDraftOf(null, null))).toBe(
      true,
    )
    expect(hasLimits(none, { tokens: '100', period: 'day' })).toBe(true)
  })
})

describe('aliases', () => {
  it.each(['chat-default', 'org/model:v1', 'a', 'gpt-6.1@prod'])(
    'accepts %s',
    (name) => expect(ALIAS_PATTERN.test(name)).toBe(true),
  )

  it.each(['', '-leading', 'has space', '中文', 'a'.repeat(129)])(
    'rejects %s',
    (name) => expect(ALIAS_PATTERN.test(name)).toBe(false),
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

describe('expiry presets', () => {
  const now = new Date(2026, 10, 17, 10, 30).getTime()

  it('ends a preset at the end of that local day', () => {
    const at = presetExpiry(30, now)
    expect([at.getFullYear(), at.getMonth(), at.getDate()]).toEqual([
      2026, 11, 17,
    ])
    expect([at.getHours(), at.getMinutes()]).toEqual([23, 59])
  })

  it('sends null for never, an instant for a preset, nothing for a bad custom value', () => {
    expect(parseExpiryDraft({ preset: 'never', custom: '' }, now)).toBeNull()
    expect(parseExpiryDraft({ preset: '90', custom: '' }, now)).toBe(
      presetExpiry(90, now).toISOString(),
    )
    expect(
      parseExpiryDraft({ preset: 'custom', custom: '' }, now),
    ).toBeUndefined()
    expect(
      parseExpiryDraft({ preset: 'custom', custom: '2026-11-01T00:00' }, now),
    ).toBeUndefined()
  })

  it('opens a stored expiry as a custom time and none as never', () => {
    const iso = new Date(2027, 1, 15, 23, 59).toISOString()
    expect(expiryDraftOf(iso)).toEqual({
      preset: 'custom',
      custom: '2027-02-15T23:59',
    })
    expect(expiryDraftOf(null)).toEqual({ preset: 'never', custom: '' })
  })
})
