import assert from 'node:assert/strict'
import test from 'node:test'
import { load } from '../node-test-css-hooks.mjs'

test('stylesheet imports load as empty modules in the node:test lane', async () => {
  const next = () => {
    throw new Error('stylesheets must not reach the default loader')
  }
  for (const url of [
    'file:///repo/src/components/patterns/resource-presence.css',
    'file:///repo/src/styles/theme.scss?inline',
  ]) {
    assert.deepEqual(await load(url, {}, next), {
      format: 'module',
      source: '',
      shortCircuit: true,
    })
  }
})

test('other modules go to the next loader unchanged', async () => {
  const context = { format: 'module' }
  const result = { format: 'module', source: 'export {}' }
  assert.equal(
    await load('file:///repo/src/main.tsx', context, (url, seen) => {
      assert.equal(url, 'file:///repo/src/main.tsx')
      assert.equal(seen, context)
      return result
    }),
    result,
  )
})
