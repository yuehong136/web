import assert from 'node:assert/strict'
import test from 'node:test'
import { QueryClient } from '@tanstack/react-query'
import { memoryKeys } from '@/hooks/use-memory'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import {
  confirmedWithdrawnSource,
  operationWithdrawnSource,
  redactWithdrawnSource,
} from '@/hooks/memory-withdrawal-cache'
import type { MemorySourceState } from '@/types/memory-revisions'

const source: MemorySourceState = {
  managed: true,
  memory_id: 'bank',
  source_id: '10',
  source_revision: 1,
  generation: 2,
  state: 'forgotten',
  content_sha256: 'a'.repeat(64),
  scope: {},
}
const derived = (id: number, anchor: number, content: string) => ({
  memory_id: 'bank',
  message_id: id,
  source_id: anchor,
  message_type: 'semantic',
  content,
})
const raw = (
  id: number,
  content: string,
  extract = [derived(id + 1, id, `${content} derived`)],
) => ({
  memory_id: 'bank',
  message_id: id,
  message_type: 'raw',
  content,
  status: true,
  extract,
})
const listKey = memoryKeys.messageList('bank', {})
const recallKey = [
  ...memoryKeys.messages('bank'),
  'recall',
  { query: 'controlled' },
]
const entryKey = memoryRevisionKeys.entry('bank', '22')
const historyKey = memoryRevisionKeys.history('bank', 'entry')
const entry = {
  memory_id: 'bank',
  entry_id: 'entry',
  legacy_message_id: '22',
  current_message_id: '22',
  state: 'active',
  current: {
    message_id: '22',
    content: 'multi-source private',
    redacted: false,
    sources: [{ source_id: '10' }, { source_id: '20' }],
    assessment: {
      verification_status: 'user_asserted',
      reason: 'private reason',
    },
  },
}
const original = () => ({
  message_list: [
    raw(10, 'target private'),
    raw(20, 'other source', [
      derived(21, 20, 'keep derived'),
      derived(22, 20, 'multi-source private'),
    ]),
  ],
  total_count: 2,
})
const client = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } })
function seed(cache: QueryClient) {
  cache.setQueryData(listKey, original())
  cache.setQueryData(recallKey, [
    derived(11, 10, 'target private'),
    derived(21, 20, 'keep derived'),
    derived(22, 20, 'multi-source private'),
  ])
  cache.setQueryData(entryKey, entry)
  cache.setQueryData(historyKey, {
    revisions: [
      entry.current,
      {
        message_id: '21',
        content: 'keep history',
        sources: [{ source_id: '20' }],
      },
    ],
  })
  for (const id of ['10', '11', '22', '21'])
    cache.setQueryData(memoryKeys.messageContent('bank', id), {
      content: id === '21' ? 'keep body' : 'private cached body',
    })
  cache.setQueryData(memoryKeys.messageList('other-bank', {}), {
    message_list: [{ ...raw(10, 'other bank'), memory_id: 'other-bank' }],
  })
}
function assertRedacted(cache: QueryClient) {
  const list = cache.getQueryData<ReturnType<typeof original>>(listKey)!
  assert.equal('content' in list.message_list[0], false)
  assert.deepEqual(list.message_list[0].extract, [])
  assert.equal(list.message_list[1].content, 'other source')
  assert.deepEqual(
    list.message_list[1].extract.map((row) => row.message_id),
    [21],
  )
  assert.deepEqual(
    cache
      .getQueryData<ReturnType<typeof derived>[]>(recallKey)!
      .map((row) => row.message_id),
    [21],
  )
  assert.equal(
    cache.getQueryData<{ content: string }>(
      memoryKeys.messageContent('bank', '22'),
    )!.content,
    '',
  )
  assert.equal(
    cache.getQueryData<{ content: string }>(
      memoryKeys.messageContent('bank', '21'),
    )!.content,
    'keep body',
  )
  assert.equal(
    cache.getQueryData<typeof entry>(entryKey)!.current.content,
    null,
  )
  assert.equal(
    JSON.stringify(cache.getQueryData(entryKey)).includes('private reason'),
    false,
  )
  assert.equal(
    JSON.stringify(cache.getQueryData(historyKey)).includes(
      'multi-source private',
    ),
    false,
  )
  assert.equal(
    JSON.stringify(cache.getQueryData(historyKey)).includes('keep history'),
    true,
  )
  assert.equal(
    JSON.stringify(
      cache.getQueryData(memoryKeys.messageList('other-bank', {})),
    ).includes('other bank'),
    true,
  )
}

test('confirmed withdrawal synchronously redacts only the source closure, including cached multi-source dependencies', async () => {
  const cache = client()
  seed(cache)
  await redactWithdrawnSource(cache, 'bank', source)
  assertRedacted(cache)
  assert.equal(
    cache.getQueryData<MemorySourceState>(
      memoryRevisionKeys.source('bank', '10'),
    )!.state,
    'forgotten',
  )
  cache.clear()
})

test('late pre-withdrawal list and selected-body GET results cannot refill redacted cache', async () => {
  const cache = client()
  seed(cache)
  let listResolve!: (value: ReturnType<typeof original>) => void,
    bodyResolve!: (value: { content: string }) => void
  const listRead = cache
    .fetchQuery({
      queryKey: listKey,
      queryFn: () =>
        new Promise<ReturnType<typeof original>>((resolve) => {
          listResolve = resolve
        }),
    })
    .catch(() => null)
  const bodyRead = cache
    .fetchQuery({
      queryKey: memoryKeys.messageContent('bank', '11'),
      queryFn: () =>
        new Promise<{ content: string }>((resolve) => {
          bodyResolve = resolve
        }),
    })
    .catch(() => null)
  await redactWithdrawnSource(cache, 'bank', source)
  listResolve(original())
  bodyResolve({ content: 'late private body' })
  await Promise.all([listRead, bodyRead])
  await Promise.resolve()
  assertRedacted(cache)
  assert.equal(
    cache.getQueryData<{ content: string }>(
      memoryKeys.messageContent('bank', '11'),
    )!.content,
    '',
  )
  cache.clear()
})

test('failed or offline refetch retains the redaction and keeps unrelated sources', async () => {
  const cache = client()
  seed(cache)
  await redactWithdrawnSource(cache, 'bank', source)
  await assert.rejects(
    cache.fetchQuery({
      queryKey: listKey,
      queryFn: async () => {
        throw new Error('Controlled offline refetch')
      },
    }),
  )
  assertRedacted(cache)
  cache.clear()
})

test('repeated permanent-source GETs are idempotent and do not cancel a new healthy read', async () => {
  const cache = client()
  seed(cache)
  await redactWithdrawnSource(cache, 'bank', source, 'source-read')
  cache.setQueryData(memoryRevisionKeys.source('bank', '10'), source)
  let resolve!: (value: unknown) => void
  const read = cache.fetchQuery({
    queryKey: listKey,
    queryFn: () =>
      new Promise((done) => {
        resolve = done
      }),
  })
  await redactWithdrawnSource(cache, 'bank', source, 'source-read')
  assert.equal(cache.getQueryState(listKey)!.fetchStatus, 'fetching')
  resolve(cache.getQueryData(listKey))
  await read
  assertRedacted(cache)
  cache.clear()
})

test('unknown, pending-only and unmanaged source data never imply withdrawal', async () => {
  const cache = client()
  seed(cache)
  const previous = cache.getQueryData(listKey)
  assert.equal(
    operationWithdrawnSource('bank', {
      status: 'accepted',
      index_sync_status: 'pending',
    }),
    null,
  )
  assert.equal(
    operationWithdrawnSource('bank', {
      status: 'persistence_unknown',
      source: { ...source, state: 'active' },
    }),
    null,
  )
  assert.equal(
    confirmedWithdrawnSource('bank', { ...source, managed: false }),
    null,
  )
  assert.equal(confirmedWithdrawnSource('wrong-bank', source), null)
  await redactWithdrawnSource(cache, 'bank', { ...source, state: 'active' })
  assert.equal(cache.getQueryData(listKey), previous)
  cache.clear()
})

test('unsafe legacy numeric ID buckets only purge local bodies and never become server identities', async () => {
  const cache = client(),
    high = '9007199254740993',
    rounded = Number(high)
  const highSource = { ...source, source_id: high }
  const list = {
    message_list: [
      raw(rounded, 'ambiguous private'),
      { ...raw(777, 'keep exact source'), message_id: '9007199254740992' },
    ],
    total_count: 2,
  }
  cache.setQueryData(listKey, list)
  cache.setQueryData(memoryKeys.messageContent('bank', String(rounded)), {
    content: 'ambiguous cached body',
  })
  await redactWithdrawnSource(cache, 'bank', highSource)
  const next = cache.getQueryData<typeof list>(listKey)!
  assert.equal(next.message_list[0].message_id, rounded)
  assert.equal('content' in next.message_list[0], false)
  assert.equal(next.message_list[1].content, 'keep exact source')
  assert.equal(next.message_list[1].message_id, '9007199254740992')
  assert.equal(
    cache.getQueryData<{ content: string }>(
      memoryKeys.messageContent('bank', String(rounded)),
    )!.content,
    '',
  )
  assert.equal(
    cache.getQueryData<MemorySourceState>(
      memoryRevisionKeys.source('bank', high),
    )!.source_id,
    high,
  )
  cache.clear()
})
