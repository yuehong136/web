import assert from 'node:assert/strict'
import { installMemoryIncrementalFixture } from './memory-incremental-fixture.mjs'
import {
  startupPackage,
  startupCapability,
  sourceExcerpt,
} from '../../src/components/memory/__tests__/memory-startup-fixture.ts'
/** Explicit startup/source reads only; no GET, refresh, polling or fixture timer advances content. */
export async function installMemoryStartupFixture(context, onError) {
  const base = await installMemoryIncrementalFixture(context, onError),
    mid = 'owned-memory',
    calls = { preview: [], source: [] },
    errors = []
  let changed = false
  const pack = () => {
    const value = startupPackage()
    value.memory_id = mid
    value.items.forEach((item) => {
      item.verification.locator.memory_id = mid
      item.sources.forEach((source) => (source.locator.memory_id = mid))
    })
    return value
  }
  await context.route('**/api/v1/memories/owned-memory**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname,
      body = req.postDataJSON()
    const send = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: { 'Cache-Control': 'no-store' },
        body: JSON.stringify({
          retcode: status === 200 ? 0 : status,
          retmsg: status === 200 ? 'success' : 'source_changed',
          data,
        }),
      })
    try {
      if (path.endsWith('/capabilities'))
        return send({
          ...base.capabilities,
          startup_context: startupCapability,
        })
      if (path.endsWith('/startup-context')) {
        assert.equal(req.method(), 'POST')
        calls.preview.push(body)
        assert.equal(body.user_id, ' alpha ')
        assert.equal(body.agent_id, '')
        return send(pack())
      }
      if (path.includes('/sources/')) {
        assert.equal(req.method(), 'GET')
        calls.source.push(Object.fromEntries(url.searchParams))
        assert.equal(url.searchParams.get('user_id'), ' alpha ')
        assert.equal(url.searchParams.get('agent_id'), '')
        assert.equal(url.searchParams.get('session_id'), '')
        assert.equal(
          url.searchParams.get('expected_source_revision'),
          '9007199254741003',
        )
        assert.equal(url.searchParams.get('expected_source_generation'), '1')
        if (changed) return send(null, 409)
        const value = sourceExcerpt(Number(url.searchParams.get('offset')))
        value.locator.memory_id = mid
        return send(value)
      }
      return route.fallback()
    } catch (error) {
      errors.push(error.message)
      onError(error.message)
      return send(null, 500)
    }
  })
  return {
    calls,
    errors,
    changeSource: () => {
      changed = true
    },
  }
}
