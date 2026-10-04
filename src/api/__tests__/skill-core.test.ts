import assert from 'node:assert/strict'
import test from 'node:test'
import { z } from 'zod'
import { apiClient, APIError } from '../client'
import { skillCoreAPI, coreResponse, allCoreFiles } from '../skill-core'
import {
  coreSpaceSchema,
  coreConfigSchema,
  coreVersions,
} from '../skill-core-types'

const id = 'a'.repeat(32)
const folder = 'b'.repeat(32)
const space = {
  id,
  tenant_id: id,
  folder_id: folder,
  name: 'Design',
  top_k: 10,
  status: 'active',
}
const envelope = (data: unknown, status = 200, code = 0) =>
  new Response(JSON.stringify({ code, data, message: 'private server text' }), {
    status,
    headers: { 'content-type': 'application/json' },
  })

test('core Space accepts upstream fields and cannot silently accept asset DTOs', async () => {
  const read = coreResponse(coreSpaceSchema)
  assert.deepEqual(await read(envelope(space)), space)
  await assert.rejects(
    read(
      envelope({
        id,
        name: 'Design',
        root_folder_id: folder,
        state: 'active',
        revision: 1,
      }),
    ),
  )
  await assert.rejects(
    read(envelope(space, 200, 102)),
    (error: unknown) =>
      error instanceof APIError &&
      error.code === 'CORE_REQUEST_FAILED' &&
      !error.message.includes('private'),
  )
  await assert.rejects(
    read(envelope({ error_code: 'NOT_FOUND' }, 404, 102)),
    (error: unknown) =>
      error instanceof APIError &&
      error.status === 404 &&
      error.code === 'NOT_FOUND',
  )
})

test('core deletion requires real 202 deleting acknowledgement, not an operation or success boolean', async () => {
  const reader = coreResponse(
    z.object({ deleting: z.literal(true), space_id: z.string() }),
    202,
  )
  assert.deepEqual(
    await reader(envelope({ deleting: true, space_id: id }, 202)),
    { deleting: true, space_id: id },
  )
  for (const response of [
    envelope({ deleting: true, space_id: id }),
    envelope({ operation_id: id }, 202),
    envelope(true, 202),
  ])
    await assert.rejects(reader(response))
})

test('core API uses explicit namespace and upstream HTTP methods without probing aliases', async () => {
  const previous = globalThis.fetch
  apiClient.setAuthToken('test-core-token')
  const calls: { path: string; method: string; body: unknown }[] = []
  const cfg = {
    id,
    tenant_id: id,
    space_id: id,
    embd_id: '9007199254740993',
    vector_similarity_weight: 0.3,
    similarity_threshold: 0.2,
    field_config: Object.fromEntries(
      ['name', 'tags', 'description', 'content'].map((field) => [
        field,
        { enabled: true, weight: 1 },
      ]),
    ),
    rerank_id: '',
    top_k: 10,
    index_version: '1.0.0',
    status: '1',
  }
  globalThis.fetch = (async (url, options) => {
    const parsed = new URL(String(url)),
      method = options?.method || 'GET'
    assert.equal(
      new Headers(options?.headers).get('authorization'),
      'Bearer test-core-token',
    )
    assert.equal(new Headers(options?.headers).has('idempotency-key'), false)
    const body =
      typeof options?.body === 'string' ? JSON.parse(options.body) : undefined
    calls.push({ path: parsed.pathname + parsed.search, method, body })
    const end = parsed.pathname.split('/').pop()
    if (end === 'config') return envelope(cfg)
    if (end === 'search')
      return envelope({
        skills: [],
        total: 0,
        query: body.query,
        search_type: 'keyword',
      })
    if (end === 'index')
      return envelope(method === 'DELETE' ? true : { indexed_count: 0 })
    if (end === 'reindex')
      return envelope({
        indexed_count: 1,
        total_skills: 2,
        failed_count: 1,
        version: '1.0.0',
      })
    if (method === 'DELETE')
      return envelope({ deleting: true, space_id: id }, 202)
    if (end === 'spaces' && method === 'GET')
      return envelope({ spaces: [space], total: 1 })
    return envelope(space)
  }) as typeof fetch
  try {
    await skillCoreAPI.spaces()
    await skillCoreAPI.createSpace({ name: 'Design', description: '' })
    await skillCoreAPI.space(id)
    await skillCoreAPI.updateSpace(id, { name: 'Updated' })
    await skillCoreAPI.deleteSpace(id)
    await skillCoreAPI.byFolder(folder)
    const config = await skillCoreAPI.config(id)
    await skillCoreAPI.updateConfig(id, config)
    await skillCoreAPI.search(id, '', 2)
    await skillCoreAPI.index(id, [])
    await skillCoreAPI.deleteIndex(id, 'my-skill')
    assert.equal((await skillCoreAPI.reindex(id)).failed_count, 1)
    assert.equal(calls.length, 12)
    assert.ok(
      calls.every((call) => call.path.startsWith('/api/v1/skill-core/')),
    )
    assert.equal(calls[3].method, 'PUT')
    assert.deepEqual(calls[3].body, { name: 'Updated' })
    assert.deepEqual(calls[7].body, {
      space_id: id,
      embd_id: '9007199254740993',
      rerank_id: '',
      top_k: 10,
      field_config: cfg.field_config,
      vector_similarity_weight: 0.3,
      similarity_threshold: 0.2,
    })
    assert.deepEqual(calls[8].body, {
      space_id: id,
      query: '',
      page: 2,
      page_size: 20,
      sort_by: 'name',
      sort_order: 'asc',
    })
    assert.match(calls[10].path, /skill_id=my-skill/)
  } finally {
    globalThis.fetch = previous
    apiClient.setAuthToken(null)
  }
})

test('Files list drains all pages and never truncates a 101-entry directory', async () => {
  const previous = globalThis.fetch
  const pages: string[] = []
  globalThis.fetch = (async (url) => {
    const parsed = new URL(String(url)),
      page = parsed.searchParams.get('page')!
    pages.push(page)
    assert.equal(parsed.pathname, '/api/v1/files')
    assert.equal(parsed.searchParams.get('page_size'), '100')
    return envelope({
      total: 101,
      parent_folder: { id: folder, name: 'root', type: 'folder' },
      files: Array.from({ length: page === '1' ? 100 : 1 }, (_, index) => ({
        id: `${page}-${index}`,
        name: `${index}.md`,
        type: 'doc',
      })),
    })
  }) as typeof fetch
  try {
    assert.equal((await allCoreFiles(folder)).length, 101)
    assert.deepEqual(pages, ['1', '2'])
  } finally {
    globalThis.fetch = previous
  }
})

test('Files create/upload/delete preserve upstream shapes and reject HTTP 200 partial business failure', async () => {
  const previous = globalThis.fetch
  const calls: RequestInit[] = []
  globalThis.fetch = (async (_url, options) => {
    calls.push(options || {})
    if (options?.method === 'DELETE')
      return envelope({ success_count: 0, errors: [{ id }] }, 200, 102)
    const file = { id, name: 'SKILL.md', type: 'doc' }
    return envelope(
      options?.body instanceof FormData ? [file] : { ...file, type: 'folder' },
    )
  }) as typeof fetch
  try {
    await skillCoreAPI.folder(folder, '1.2.0')
    await skillCoreAPI.upload(folder, new File(['# Text'], 'SKILL.md'))
    await assert.rejects(skillCoreAPI.removeFiles([id]))
    assert.deepEqual(JSON.parse(String(calls[0].body)), {
      parent_id: folder,
      name: '1.2.0',
      type: 'folder',
    })
    assert.ok(calls[1].body instanceof FormData)
    assert.equal(calls[1].body.get('parent_id'), folder)
    assert.equal(calls[1].body.getAll('file').length, 1)
    assert.deepEqual(JSON.parse(String(calls[2].body)), { ids: [id] })
  } finally {
    globalThis.fetch = previous
  }
})

test('core defaults to highest numeric folder, retaining large version component precision', () => {
  const names = [
    '1.2.0',
    '1.10.0',
    'draft',
    '1.2.0-beta',
    '9007199254740993.0.0',
    '9007199254740992.0.0',
  ]
  const files = names.map((name) => ({ id: name, name, type: 'folder' }))
  assert.deepEqual(
    coreVersions(files).map((item) => item.name),
    ['9007199254740993.0.0', '9007199254740992.0.0', '1.10.0', '1.2.0'],
  )
})

test('core unsaved default config has no persisted ID; Space still requires a real ID', () => {
  const fields = Object.fromEntries(
    ['name', 'tags', 'description', 'content'].map((field) => [
      field,
      { enabled: true, weight: 1 },
    ]),
  )
  assert.equal(
    coreConfigSchema.parse({
      id: '',
      tenant_id: id,
      space_id: id,
      embd_id: '',
      vector_similarity_weight: 0.3,
      similarity_threshold: 0.2,
      field_config: fields,
      top_k: 10,
      status: '',
      index_version: '',
    }).id,
    '',
  )
  assert.equal(coreSpaceSchema.safeParse({ ...space, id: '' }).success, false)
})

test('file JSON business failure is never downloaded as an attachment', async () => {
  const previous = globalThis.fetch
  globalThis.fetch = (async () => envelope(null, 200, 102)) as typeof fetch
  try {
    await assert.rejects(skillCoreAPI.file(id))
  } finally {
    globalThis.fetch = previous
  }
})

test('Files delete accepts upstream boolean and enhanced batch result without inventing counts', async () => {
  const previous = globalThis.fetch
  try {
    for (const data of [
      true,
      { success_count: 1, errors: [] },
      { success_count: 4, errors: [] },
    ]) {
      globalThis.fetch = (async () =>
        new Response(JSON.stringify({ code: 0, data }), {
          status: 200,
        })) as typeof fetch
      assert.deepEqual(await skillCoreAPI.removeFiles([id]), data)
    }
    for (const [data, code] of [
      [false, 0],
      [{ success_count: 0, errors: [{ id, message: 'failed' }] }, 102],
      [true, 102],
    ]) {
      globalThis.fetch = (async () =>
        envelope(data, 200, code as number)) as typeof fetch
      await assert.rejects(skillCoreAPI.removeFiles([id]))
    }
  } finally {
    globalThis.fetch = previous
  }
})
