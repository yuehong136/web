import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { apiKeysCapabilities } from '../api-keys-capabilities'

const apiKeysPageSource = readFileSync(
  new URL('../ApiKeysPage.tsx', import.meta.url),
  'utf8',
)

test('unimplemented API key workbench capabilities stay disabled with an explanation', () => {
  for (const capability of Object.values(apiKeysCapabilities)) {
    assert.equal(capability.enabled, false)
    assert.ok(capability.reason.trim().length > 0)
  }
})

test('API key editing and live requests cannot be presented as completed features', () => {
  assert.deepEqual(apiKeysCapabilities.edit, {
    enabled: false,
    reason: '后端暂未提供 API Key 更新接口',
  })
  assert.deepEqual(apiKeysCapabilities.liveRequest, {
    enabled: false,
    reason: '在线接口调试尚未开放',
  })
})

test('the API key workbench contains no simulated success implementation', () => {
  for (const forbidden of [
    'handleTestAPI',
    'mockResponse',
    'setTestResponse',
    'API测试成功',
    'EditApiKeyDialog',
    'handleEditApiKey',
  ]) {
    assert.doesNotMatch(apiKeysPageSource, new RegExp(forbidden))
  }

  assert.doesNotMatch(apiKeysPageSource, /Math\.random\s*\(/)
  assert.match(
    apiKeysPageSource,
    /disabled=\{!apiKeysCapabilities\.liveRequest\.enabled\}/,
  )
  assert.match(apiKeysPageSource, /在线接口调试（尚未开放）/)
})
