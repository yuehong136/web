import assert from 'node:assert/strict'
import test from 'node:test'
import { isExpectedRendererDocument } from '../../electron/main/windows/readiness-policy'

test('smoke readiness requires the exact packaged Renderer document', () => {
  assert.equal(isExpectedRendererDocument('app://bundle/'), true)

  for (const url of [
    'about:blank',
    'app://bundle',
    'app://bundle/agent',
    'app://other/',
    'https://example.com/',
  ]) {
    assert.equal(isExpectedRendererDocument(url), false, url)
  }
})
