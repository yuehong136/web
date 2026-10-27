import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GenerationPresetType,
  generationPresetConfigMapSnake,
  getDefaultEnabledFieldsSnake,
  detectMatchingPresetSnake,
  detectMatchingPreset,
  resolveGenerationPreset,
} from '@/constants/llm'
import { defaultChatSettings } from '@/components/chat/chat-settings.constants'
import { buildChatSaveRequest } from '../save-payload'
import { normalizeDialogConfig, normalizeDialogSearchMode } from '../data'

test('restores a saved flat hybrid search mode into the page config', () => {
  const { config } = normalizeDialogConfig({
    search_mode: {
      type: 'hybrid',
      weight_dense: 0.3,
      weight_sparse: 0.7,
    },
  })

  assert.deepEqual(config.search_mode, {
    type: 'hybrid',
    weight_dense: 0.3,
    weight_sparse: 0.7,
  })
})

test('normalizes the legacy nested hybrid search mode response', () => {
  assert.deepEqual(
    normalizeDialogSearchMode({
      hybrid: {
        weight_dense: 0,
        weight_sparse: 1,
      },
    }),
    {
      type: 'hybrid',
      weight_dense: 0,
      weight_sparse: 1,
    },
  )
})

test('does not expose unknown response keys as select values', () => {
  assert.deepEqual(normalizeDialogSearchMode({ type: 'unexpected' }), {
    type: 'dense',
  })
})

for (const fields of [undefined, null, [], ['author']]) {
  test(`reloads reference metadata field selection: ${JSON.stringify(fields)}`, () => {
    const reference =
      fields === undefined ? { include: true } : { include: true, fields }
    const saved = JSON.parse(
      JSON.stringify({ prompt_config: { reference_metadata: reference } }),
    )
    const { config } = normalizeDialogConfig(saved)
    assert.deepEqual(config.prompt_config.reference_metadata, reference)
  })
}

test('effective preset matching includes the enabled mask and max token override', () => {
  for (const [style, values] of Object.entries(
    generationPresetConfigMapSnake,
  )) {
    const params = {
      ...values,
      ...getDefaultEnabledFieldsSnake(),
    } as Parameters<typeof detectMatchingPresetSnake>[0]
    assert.equal(detectMatchingPresetSnake(params), style)
    for (const key of [
      'temperature_enabled',
      'top_p_enabled',
      'presence_penalty_enabled',
      'frequency_penalty_enabled',
    ] as const) {
      assert.equal(
        detectMatchingPresetSnake({ ...params, [key]: false }),
        GenerationPresetType.Custom,
      )
    }
    assert.equal(
      detectMatchingPresetSnake({ ...params, max_tokens_enabled: true }),
      GenerationPresetType.Custom,
    )
    const settings = {
      ...defaultChatSettings,
      temperature: values.temperature,
      topP: values.top_p,
      presencePenalty: values.presence_penalty,
      frequencyPenalty: values.frequency_penalty,
      temperatureEnabled: true,
      topPEnabled: true,
      presencePenaltyEnabled: true,
      frequencyPenaltyEnabled: true,
      maxTokensEnabled: false,
    }
    assert.equal(detectMatchingPreset(settings), style)
    assert.equal(
      detectMatchingPreset({ ...settings, topPEnabled: false }),
      GenerationPresetType.Custom,
    )
    assert.equal(
      detectMatchingPreset({ ...settings, maxTokensEnabled: true }),
      GenerationPresetType.Custom,
    )
  }
})

test('reload/save preserves zero, disabled mask and unknown imported preset metadata', () => {
  const { config, matchedPreset } = normalizeDialogConfig({
    llm_setting: { temperature: 0, parameter: 'future-style' },
  })
  assert.equal(matchedPreset, GenerationPresetType.Custom)
  assert.equal(config.llm_setting.temperature_enabled, true)
  assert.equal(config.llm_setting.top_p_enabled, false)
  assert.deepEqual(buildChatSaveRequest(config, '').llm_setting, {
    temperature: 0,
    parameter: 'future-style',
  })
  assert.equal(
    normalizeDialogConfig({ llm_setting: {} }).matchedPreset,
    GenerationPresetType.Custom,
  )
})

test('explicit custom and unknown preset metadata never reset saved numeric values', () => {
  assert.equal(
    resolveGenerationPreset('custom', GenerationPresetType.Balance),
    GenerationPresetType.Custom,
  )
  assert.equal(
    resolveGenerationPreset('future-style', GenerationPresetType.Balance),
    GenerationPresetType.Custom,
  )
  assert.equal(
    resolveGenerationPreset('precise', GenerationPresetType.Balance),
    GenerationPresetType.Custom,
  )
  assert.equal(
    resolveGenerationPreset(undefined, GenerationPresetType.Balance),
    GenerationPresetType.Balance,
  )
})
