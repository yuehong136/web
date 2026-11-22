import { expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import {
  protectMemoryVerification,
  refreshMemoryVerificationFences,
  watchMemoryVerificationFences,
} from '@/hooks/memory-verification-cache'
import { memoryVerificationKeys as keys } from '@/hooks/memory-verification-keys'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import { humanVerificationCurrent } from '@/lib/memory-verification'
import {
  verificationRecord,
  verificationSnapshot,
  verificationSource,
  verificationEntry,
} from './memory-verification-fixture'

it('immediately removes confirmation and human text from current, history, queue and operation caches on permanent source withdrawal', async () => {
  const cache = new QueryClient(),
    record = verificationRecord(),
    keysFor = [
      keys.history('bank', verificationEntry),
      keys.todos('bank'),
      keys.operation('bank', 'original'),
      keys.snapshot('bank', verificationEntry),
    ]
  const values = [
    { records: [record] },
    { items: [record] },
    { status: 'ready', record },
    { ...verificationSnapshot(), current_record: record },
  ]
  keysFor.forEach((key, i) => cache.setQueryData(key, values[i]))
  cache.setQueryData(keys.history('other-bank', verificationEntry), {
    records: [{ ...record, memory_id: 'other-bank' }],
  })
  const unwatch = watchMemoryVerificationFences(cache, 'bank')
  cache.setQueryData(memoryRevisionKeys.source('bank', verificationSource), {
    memory_id: 'bank',
    source_id: verificationSource,
    state: 'forgotten',
    generation: 3,
    source_revision: 1,
    content_sha256: 'c'.repeat(64),
    managed: true,
  })
  for (const key of keysFor) {
    const text = JSON.stringify(cache.getQueryData(key))
    expect(text).not.toContain('Private human verification notes')
    expect(text).not.toContain('javascript:untrustedReference()')
  }
  expect(
    JSON.stringify(
      cache.getQueryData(keys.history('other-bank', verificationEntry)),
    ),
  ).toContain('Private human verification notes')
  const late = protectMemoryVerification(cache, 'bank', {
    status: 'ready',
    record: verificationRecord(),
  })
  expect(late.record.effective_status).toBe('redacted')
  expect(humanVerificationCurrent(late.record)).toBe(false)
  expect(
    protectMemoryVerification(cache, 'bank', verificationSnapshot())
      .entry_content,
  ).toBeNull()
  await refreshMemoryVerificationFences(cache, 'bank')
  unwatch()
  cache.clear()
})
it('keeps a changed binding stale while preserving an attributed historical conclusion, and does not mistake an older cached source for a fresh snapshot change', () => {
  const cache = new QueryClient(),
    record = verificationRecord()
  cache.setQueryData(memoryRevisionKeys.source('bank', verificationSource), {
    memory_id: 'bank',
    state: 'active',
    generation: 3,
    source_revision: 1,
    content_sha256: 'd'.repeat(64),
  })
  const changed = protectMemoryVerification(cache, 'bank', record)
  expect(changed.result).toBe('human_confirmed')
  expect(changed.effective_status).toBe('stale')
  expect(changed.valid_for_current).toBe(false)
  expect(changed.notes).toBe(record.notes)
  cache.setQueryData(memoryRevisionKeys.source('bank', verificationSource), {
    memory_id: 'bank',
    state: 'active',
    generation: 1,
    source_revision: 1,
    content_sha256: 'old',
  })
  expect(protectMemoryVerification(cache, 'bank', record)).toBe(record)
  cache.clear()
})
it('a newer known head fences old in-flight confirmation and snapshot reads without treating SQL readiness as current validity', () => {
  const cache = new QueryClient(),
    newRecord = {
      ...verificationRecord(),
      head_version: '2',
      record_version: '2',
      result: 'disputed' as const,
      effective_status: 'disputed' as const,
    }
  cache.setQueryData(keys.operation('bank', 'new'), {
    status: 'ready',
    record: newRecord,
  })
  const late = protectMemoryVerification(cache, 'bank', {
    status: 'ready',
    record: verificationRecord(),
  })
  expect(late.status).toBe('ready')
  expect(late.record.effective_status).toBe('superseded')
  expect(humanVerificationCurrent(late.record)).toBe(false)
  expect(
    protectMemoryVerification(cache, 'bank', verificationSnapshot()).can_record,
  ).toBe(false)
  cache.clear()
})

it('never puts a superseded old head back in todo after source change and a late response', () => {
  const cache = new QueryClient()
  cache.setQueryData(keys.operation('bank', 'new'), {
    record: {
      ...verificationRecord(),
      head_version: '2',
      record_version: '2',
      verification_id: 'b'.repeat(32),
      result: 'disputed',
      effective_status: 'disputed',
      review_required: true,
    },
  })
  cache.setQueryData(memoryRevisionKeys.source('bank', verificationSource), {
    memory_id: 'bank',
    state: 'active',
    generation: 3,
    source_revision: 1,
    content_sha256: 'new',
  })
  const late = protectMemoryVerification(cache, 'bank', {
    items: [verificationRecord()],
  })
  expect(late.items).toEqual([])
  const history = protectMemoryVerification(cache, 'bank', {
    records: [verificationRecord()],
  })
  expect(history.records[0]).toMatchObject({
    is_current: false,
    effective_status: 'superseded',
    review_required: false,
  })
  cache.clear()
})
it('a known safe-view invalidation fences another query with the same immutable record ID', () => {
  const cache = new QueryClient()
  cache.setQueryData(keys.todos('bank'), {
    items: [
      {
        ...verificationRecord(),
        effective_status: 'stale',
        valid_for_current: false,
        review_required: true,
      },
    ],
  })
  const late = protectMemoryVerification(cache, 'bank', {
    record: verificationRecord(),
  })
  expect(late.record.effective_status).toBe('stale')
  expect(humanVerificationCurrent(late.record)).toBe(false)
  cache.clear()
})

it('a redacted record safe-view fences an already prepared snapshot with exactly the same binding, even before source state refetch', () => {
  const cache = new QueryClient(),
    record = verificationRecord()
  cache.setQueryData(keys.operation('bank', 'withdrawn'), {
    status: 'ready',
    record: {
      ...record,
      state: 'redacted',
      effective_status: 'redacted',
      notes: null,
      applicability: null,
      evidence: [],
      valid_for_current: false,
    },
  })
  const snapshot = protectMemoryVerification(cache, 'bank', {
    ...verificationSnapshot(),
    current_record: record,
  })
  expect(snapshot.entry_content).toBeNull()
  expect(snapshot.can_record).toBe(false)
  const unrelated = verificationSnapshot()
  unrelated.binding_sha256 = '0'.repeat(64)
  unrelated.binding.entry.revision = '2'
  expect(
    protectMemoryVerification(cache, 'bank', unrelated).entry_content,
  ).toBe(unrelated.entry_content)
  cache.clear()
})
