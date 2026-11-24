import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPDFParserOptions } from '@/lib/knowledge/pdf-parser-options'
import type { MyLLMModel, MyLLMProvider } from '@/stores/model'

const fixtureId = (index: number) => index.toString(16).padStart(32, 'a')
const model = (
  index: number,
  name: string,
  type: MyLLMModel['type'],
  extra: Partial<MyLLMModel> = {},
): MyLLMModel => ({
  id: fixtureId(index),
  name,
  type,
  used_token: 0,
  status: '1',
  ...extra,
})
const provider = (...llm: MyLLMModel[]) => ({ tags: '', llm })

test('the baseline contains only the two supported built-in PDF parsers', () => {
  assert.deepEqual(
    buildPDFParserOptions({}).map(({ value, kind }) => ({ value, kind })),
    [
      { value: 'DeepDOC', kind: 'builtin' },
      { value: 'Plain Text', kind: 'builtin' },
    ],
  )
})

test('preserves opaque per-instance IDs across providers and model names with delimiters', () => {
  const configured: MyLLMProvider = {
    PaddleOCR: provider(
      model(1, 'scan@east', 'ocr', { instance_name: 'first' }),
      model(2, 'scan@east', 'ocr', { instance_name: 'second' }),
    ),
    MinerU: provider(model(3, 'scan@east', 'ocr')),
    LocalAI: provider(model(4, 'vision@east___LocalAI', 'image2text')),
    OpenDataLoader: provider(model(5, 'vendor/model', 'ocr')),
  }
  assert.deepEqual(buildPDFParserOptions(configured).slice(2), [
    {
      value: fixtureId(1),
      label: 'scan@east · first',
      provider: 'PaddleOCR',
      kind: 'ocr',
    },
    {
      value: fixtureId(2),
      label: 'scan@east · second',
      provider: 'PaddleOCR',
      kind: 'ocr',
    },
    {
      value: fixtureId(3),
      label: 'scan@east',
      provider: 'MinerU',
      kind: 'ocr',
    },
    {
      value: fixtureId(4),
      label: 'vision@east___LocalAI',
      provider: 'LocalAI',
      kind: 'vision',
    },
    {
      value: fixtureId(5),
      label: 'vendor/model',
      provider: 'OpenDataLoader',
      kind: 'ocr',
    },
  ])
})

test('filters ineligible, disabled and legacy IDs, and deduplicates only the same registration', () => {
  const configured: MyLLMProvider = {
    PaddleOCR: provider(
      model(1, 'disabled', 'ocr', { status: '0' }),
      model(2, 'unavailable', 'ocr', { available: false }),
      model(3, 'chat-only', 'chat'),
      model(4, 'legacy', 'ocr', { id: 4 }),
      model(5, 'legacy-string', 'ocr', { id: '5' }),
      model(6, 'unregistered', 'ocr', { id: undefined }),
      model(7, 'same', 'ocr'),
      model(7, 'same', 'image2text'),
      model(8, 'same', 'ocr'),
    ),
  }
  const snapshot = structuredClone(configured)
  assert.deepEqual(
    buildPDFParserOptions(configured).map((option) => option.value),
    ['DeepDOC', 'Plain Text', fixtureId(7), fixtureId(8)],
  )
  assert.deepEqual(configured, snapshot)
})
