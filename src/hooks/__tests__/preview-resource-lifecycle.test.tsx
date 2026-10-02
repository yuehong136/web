// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { usePreviewResource } from '../use-preview-resource'
import * as resources from '@/lib/knowledge/preview-resource'
vi.mock('@/lib/knowledge/preview-resource', async (load) => ({
  ...(await load<typeof import('@/lib/knowledge/preview-resource')>()),
  fetchPreviewResource: vi.fn(),
  createPreviewObjectUrl: vi.fn(() => 'blob:preview'),
  revokePreviewObjectUrl: vi.fn(),
}))
let root: Root
let container: HTMLDivElement
function Probe({ id, name = 'document.pdf' }: { id?: string; name?: string }) {
  const resource = usePreviewResource({ docId: id, docName: name })
  return <output>{JSON.stringify(resource)}</output>
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.clearAllMocks()
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(() => act(() => root.unmount()))
function deferredResponse() {
  let resolve!: (response: Response) => void
  const promise = new Promise<Response>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
const response = () =>
  new Response('document bytes', {
    headers: { 'content-type': 'application/pdf' },
  })
const state = () => JSON.parse(container.textContent || '{}')
it('hides the previous resource immediately and revokes its URL when identity changes', async () => {
  const next = deferredResponse()
  vi.mocked(resources.fetchPreviewResource)
    .mockResolvedValueOnce(response())
    .mockReturnValueOnce(next.promise)
  await act(async () => root.render(<Probe id="first" />))
  expect(state().kind).toBe('ready')
  await act(async () => root.render(<Probe id="second" />))
  expect(state().kind).toBe('loading')
  expect(state().sourceUrl).toContain('/second')
  expect(state().objectUrl).toBeUndefined()
  expect(resources.revokePreviewObjectUrl).toHaveBeenCalledWith('blob:preview')
  await act(async () => next.resolve(response()))
  expect(state().kind).toBe('ready')
  expect(state().sourceUrl).toContain('/second')
})
it('aborts a replaced request and discards its late response', async () => {
  const first = deferredResponse(),
    second = deferredResponse()
  vi.mocked(resources.fetchPreviewResource)
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise)
  await act(async () => root.render(<Probe id="first" />))
  const signal = vi.mocked(resources.fetchPreviewResource).mock.calls[0]?.[1]
  await act(async () => root.render(<Probe id="second" />))
  expect(signal?.aborted).toBe(true)
  await act(async () => first.resolve(response()))
  expect(state().kind).toBe('loading')
  expect(state().sourceUrl).toContain('/second')
  await act(async () => second.resolve(response()))
  expect(state().kind).toBe('ready')
})
it('derives idle and unsupported states without requesting content', async () => {
  await act(async () => root.render(<Probe />))
  expect(state().kind).toBe('idle')
  await act(async () => root.render(<Probe id="unknown" name="file.bin" />))
  expect(state().kind).toBe('unsupported')
  expect(resources.fetchPreviewResource).not.toHaveBeenCalled()
})
