import { expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { memoryMaintenanceKeys } from '../memory-maintenance-keys'
import { filterMaintenanceWithdrawals } from '../memory-maintenance-cache'
import { redactWithdrawnSource } from '../memory-withdrawal-cache'
import { clearDeletedMemory } from '../memory-deletion-cache'
import type { MemorySourceState } from '@/types/memory-revisions'

const source: MemorySourceState = {
  managed: true,
  memory_id: 'bank',
  source_id: '9007199254740993',
  source_revision: 1,
  generation: 2,
  state: 'forgotten',
  content_sha256: 'a'.repeat(64),
  scope: {},
}
const candidate = (id: string, sources: string[]) => ({
  candidate_id: id,
  state: 'approved',
  content: 'Private proposal',
  base_content: 'Private original',
  reason: 'Private explanation',
  patch: { old_text: 'Private', new_text: 'Changed' },
  diff: { old_text: 'Private original', new_text: 'Private proposal' },
  redacted: false,
  sources: sources.map((source_id) => ({ source_id })),
})

it('clears every affected candidate body before failed/offline refetch while preserving other sources and banks', async () => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  try {
    const key = memoryMaintenanceKeys.candidates('bank', 'job')
    const otherKey = memoryMaintenanceKeys.candidates('other', 'job')
    const original = {
      candidates: [
        candidate('multi-source', ['other', source.source_id]),
        candidate('other-source', ['other']),
      ],
    }
    cache.setQueryData(key, original)
    cache.setQueryData(otherKey, original)
    await redactWithdrawnSource(cache, 'bank', source)
    const read = cache.getQueryData<typeof original>(key)!
    expect(read.candidates[0]).toMatchObject({
      state: 'redacted',
      redacted: true,
      content: null,
      base_content: null,
      reason: null,
      patch: null,
      diff: null,
    })
    expect(read.candidates[1]).toEqual(original.candidates[1])
    expect(cache.getQueryData(otherKey)).toBe(original)
    await expect(
      cache.fetchQuery({
        queryKey: key,
        queryFn: async () => {
          throw new Error('offline')
        },
      }),
    ).rejects.toThrow('offline')
    expect(cache.getQueryData(key)).toEqual(read)
  } finally {
    cache.clear()
  }
})

it('fences an old first GET that settles after source withdrawal without requiring prior cached candidates', async () => {
  const cache = new QueryClient()
  let resolve!: (value: { candidates: ReturnType<typeof candidate>[] }) => void
  const response = new Promise<{ candidates: ReturnType<typeof candidate>[] }>(
    (done) => {
      resolve = done
    },
  )
  try {
    const pending = cache.fetchQuery({
      queryKey: memoryMaintenanceKeys.candidates('bank', 'new-job'),
      queryFn: async () =>
        filterMaintenanceWithdrawals(cache, 'bank', await response),
    })
    await redactWithdrawnSource(cache, 'bank', source)
    resolve({ candidates: [candidate('late', [source.source_id])] })
    expect((await pending).candidates[0]).toMatchObject({
      content: null,
      redacted: true,
    })
  } finally {
    cache.clear()
  }
})

it('confirmed deletion removes maintenance caches without clearing another bank', async () => {
  const cache = new QueryClient()
  try {
    cache.setQueryData(memoryMaintenanceKeys.candidates('bank', 'job'), {
      candidates: [candidate('private', [source.source_id])],
    })
    cache.setQueryData(memoryMaintenanceKeys.candidates('other', 'job'), {
      candidates: [],
    })
    await clearDeletedMemory(cache, 'bank')
    expect(
      cache.getQueriesData({ queryKey: memoryMaintenanceKeys.bank('bank') }),
    ).toEqual([])
    expect(
      cache.getQueryData(memoryMaintenanceKeys.candidates('other', 'job')),
    ).toEqual({ candidates: [] })
  } finally {
    cache.clear()
  }
})

it('redacts cached and late fragment candidates by their whole-source dependency without affecting another source', async () => {
  const cache = new QueryClient()
  try {
    const key = memoryMaintenanceKeys.candidates('bank', 'fragments')
    const fragmentCandidate = (index: number) => ({
      ...candidate(`fragment-${index}`, [source.source_id]),
      sources: [
        {
          source_id: source.source_id,
          fragment: {
            fragment_id: String(index).repeat(64),
            part_index: index,
            part_count: 3,
          },
        },
      ],
    })
    const response = {
      candidates: [
        fragmentCandidate(0),
        fragmentCandidate(2),
        candidate('unrelated', ['other']),
      ],
    }
    cache.setQueryData(key, response)
    await redactWithdrawnSource(cache, 'bank', source)
    const read = cache.getQueryData<typeof response>(key)!
    expect(read.candidates.slice(0, 2)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          candidate_id: 'fragment-0',
          content: null,
          redacted: true,
        }),
        expect.objectContaining({
          candidate_id: 'fragment-2',
          content: null,
          redacted: true,
        }),
      ]),
    )
    expect(read.candidates[2]).toEqual(response.candidates[2])
    const late = filterMaintenanceWithdrawals(cache, 'bank', response)
    expect(late.candidates[0]).toMatchObject({ content: null, redacted: true })
    expect(late.candidates[1]).toMatchObject({ content: null, redacted: true })
    expect(late.candidates[2]).toEqual(response.candidates[2])
  } finally {
    cache.clear()
  }
})
