import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialConfig } from '../constants'
import { configSignature, hasRequiredPreviewVariables } from '../editor-state'
import { normalizeDialogConfig } from '../data'
import { studioEditor as chinese } from '@/locales/zh-CN/studio-editor'
import { studioEditor as english } from '@/locales/en-US/studio-editor'

test('disabled parameter values do not make a saved configuration dirty', () => {
  const config = createInitialConfig({})
  config.llm_setting.max_tokens_enabled = false
  const changed = {
    ...config,
    llm_setting: { ...config.llm_setting, max_tokens: 9999 },
  }
  assert.equal(configSignature(config, ''), configSignature(changed, ''))
  changed.llm_setting.max_tokens_enabled = true
  assert.notEqual(configSignature(config, ''), configSignature(changed, ''))
})
test('wire equality tolerates object property order but preserves array order', () => {
  const first = createInitialConfig({})
  const second = {
    ...first,
    search_mode: {
      weight_sparse: 0.3,
      weight_dense: 0.7,
      type: 'hybrid' as const,
    },
  }
  first.search_mode = { type: 'hybrid', weight_dense: 0.7, weight_sparse: 0.3 }
  assert.equal(configSignature(first, ''), configSignature(second, ''))
  second.kb_ids = ['b', 'a']
  first.kb_ids = ['a', 'b']
  assert.notEqual(
    configSignature(first, '{knowledge}'),
    configSignature(second, '{knowledge}'),
  )
})
test('system knowledge variable is not a required custom preview input', () => {
  const config = createInitialConfig({})
  config.prompt_config.parameters = [
    { key: 'knowledge', optional: false },
    { key: 'department', optional: true },
  ]
  assert.equal(hasRequiredPreviewVariables(config), false)
  config.prompt_config.parameters[1].optional = false
  assert.equal(hasRequiredPreviewVariables(config), true)
})
test('saved zero thresholds and vector weights survive normalization', () => {
  const { config } = normalizeDialogConfig({
    similarity_threshold: 0,
    vector_similarity_weight: 0,
    llm_setting: { temperature: 0, max_tokens: 64 },
  })
  assert.equal(config.similarity_threshold, 0)
  assert.equal(config.vector_similarity_weight, 0)
  assert.equal(config.llm_setting.temperature, 0)
})
test('editor resources have matching nonempty Chinese and English keys', () => {
  assert.deepEqual(Object.keys(chinese).sort(), Object.keys(english).sort())
  assert.ok(Object.values(chinese).every((value) => value.length > 0))
  assert.ok(Object.values(english).every((value) => value.length > 0))
})
