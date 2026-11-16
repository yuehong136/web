import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import english from '../../../locales/en-US/settings'
import chinese from '../../../locales/zh-CN/settings'
import { apiKeysCapabilities } from '../api-keys-capabilities'

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')
const keysPage = source('../api-keys/api-keys-page.tsx')
const keyRows = source('../api-keys/api-key-rows.tsx')
const rowActions = source('../components/api-key-row-actions.tsx')
const docsPage = [
  '../api-docs/api-docs-page.tsx',
  '../api-docs/api-endpoint-section.tsx',
  '../api-docs/api-docs-toc.tsx',
]
  .map(source)
  .join('\n')

const lookup = (catalog: unknown, key: string) =>
  key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object'
          ? (node as Record<string, unknown>)[part]
          : undefined,
      catalog,
    )

test('the capability map matches what the token endpoints support', () => {
  const enabled = Object.entries(apiKeysCapabilities)
    .filter(([, capability]) => capability.enabled)
    .map(([name]) => name)
  assert.deepEqual(enabled.sort(), ['copy', 'create', 'regenerate', 'revoke'])
  assert.equal(apiKeysCapabilities.edit.enabled, false)
  assert.equal(apiKeysCapabilities.scopes.enabled, false)
  assert.equal(apiKeysCapabilities.liveRequest.enabled, false)
})

test('every unavailable capability explains itself in both languages', () => {
  for (const capability of Object.values(apiKeysCapabilities)) {
    if (capability.enabled) continue
    for (const catalog of [english, chinese]) {
      const text = lookup(catalog, capability.reasonKey)
      assert.equal(typeof text, 'string', capability.reasonKey)
      assert.ok((text as string).trim().length > 0, capability.reasonKey)
    }
  }
})

test('each available capability gates the control that uses it', () => {
  assert.match(keysPage, /apiKeysCapabilities\.create\.enabled/)
  assert.match(keyRows, /apiKeysCapabilities\.copy\.enabled/)
  assert.match(rowActions, /apiKeysCapabilities\.regenerate\.enabled/)
  assert.match(rowActions, /apiKeysCapabilities\.revoke\.enabled/)
  // Unavailable ones are explained, never offered as controls.
  assert.match(keysPage, /apiKeysCapabilities\.scopes\.reasonKey/)
  assert.match(keysPage, /apiKeysCapabilities\.edit\.reasonKey/)
  assert.doesNotMatch(
    keysPage + keyRows + rowActions,
    /EditApiKeyDialog|handleEditApiKey|actions\.edit/,
  )
})

test('the API docs describe requests without a placeholder or simulated runner', () => {
  for (const forbidden of [
    /MonacoEditor/,
    /handleTestAPI|mockResponse|setTestResponse/,
    /Math\.random\s*\(/,
    /liveRequest/,
    /bg-linear|from-blue|to-purple/,
  ])
    assert.doesNotMatch(docsPage, forbidden)
})
