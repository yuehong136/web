import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPDFParserOptions } from '@/lib/knowledge/pdf-parser-options'
import type {
  LLMCatalog,
  LLMCatalogModel,
  MyLLMModel,
  MyLLMProvider,
} from '@/stores/model'

const configuredModel = (
  name: string,
  type: MyLLMModel['type'],
  extra: Partial<MyLLMModel> = {},
): MyLLMModel & { id: number } => ({
  id: 42,
  name,
  type,
  used_token: 0,
  status: '1',
  ...extra,
})

const provider = (...llm: MyLLMModel[]) => ({ tags: '', llm })

const catalogModel = (
  llm_name: string,
  fid: string,
  mdl_type: string,
  extra: Partial<LLMCatalogModel> = {},
): LLMCatalogModel => ({ llm_name, fid, mdl_type, available: true, ...extra })

const values = (configured: MyLLMProvider, catalog: LLMCatalog) =>
  buildPDFParserOptions(configured, catalog).map((option) => option.value)

test('the baseline contains only the two supported built-in PDF parsers', () => {
  assert.deepEqual(
    buildPDFParserOptions({}, {}).map(({ value, kind }) => ({ value, kind })),
    [
      { value: 'DeepDOC', kind: 'builtin' },
      { value: 'Plain Text', kind: 'builtin' },
    ],
  )
})

test('multiple OCR models in each factory retain exact names instead of sharing a factory value or row ID', () => {
  const configured: MyLLMProvider = {
    PaddleOCR: provider(
      configuredModel('PaddleOCR-VL', 'ocr'),
      configuredModel('PP-OCRv5', 'ocr'),
    ),
    MinerU: provider(
      configuredModel('scan@east', 'ocr'),
      configuredModel('scan@west', 'ocr'),
    ),
  }
  const catalog: LLMCatalog = {
    PaddleOCR: [
      catalogModel('PaddleOCR-VL', 'PaddleOCR', 'ocr'),
      catalogModel('PP-OCRv5', 'PaddleOCR', 'ocr'),
    ],
    MinerU: [
      catalogModel('scan@east', 'MinerU', 'ocr'),
      catalogModel('scan@west', 'MinerU', 'ocr'),
    ],
  }

  assert.deepEqual(buildPDFParserOptions(configured, catalog).slice(2), [
    {
      value: 'PaddleOCR-VL@PaddleOCR@PaddleOCR',
      label: 'PaddleOCR-VL',
      provider: 'PaddleOCR',
      kind: 'ocr',
    },
    {
      value: 'PP-OCRv5@PaddleOCR@PaddleOCR',
      label: 'PP-OCRv5',
      provider: 'PaddleOCR',
      kind: 'ocr',
    },
    {
      value: 'scan@east@MinerU@MinerU',
      label: 'scan@east',
      provider: 'MinerU',
      kind: 'ocr',
    },
    {
      value: 'scan@west@MinerU@MinerU',
      label: 'scan@west',
      provider: 'MinerU',
      kind: 'ocr',
    },
  ])
})

test('vision model identities preserve embedded @ names and deployment suffixes across providers', () => {
  const configured: MyLLMProvider = {
    LocalAI: provider(configuredModel('vision@east___LocalAI', 'image2text')),
    'OpenAI-API-Compatible': provider(
      configuredModel('vision@east___OpenAI-API', 'image2text'),
    ),
    OpenAI: provider(configuredModel('same-name', 'image2text')),
    Ollama: provider(configuredModel('same-name', 'image2text')),
  }
  const catalog: LLMCatalog = {
    LocalAI: [catalogModel('vision@east___LocalAI', 'LocalAI', 'image2text')],
    'OpenAI-API-Compatible': [
      catalogModel(
        'vision@east___OpenAI-API',
        'OpenAI-API-Compatible',
        'image2text',
      ),
    ],
    OpenAI: [catalogModel('same-name', 'OpenAI', 'image2text')],
    Ollama: [catalogModel('same-name', 'Ollama', 'image2text')],
  }
  const options = buildPDFParserOptions(configured, catalog).slice(2)

  assert.deepEqual(
    options.map((option) => option.value),
    [
      'vision@east___LocalAI@LocalAI',
      'vision@east___OpenAI-API@OpenAI-API-Compatible',
      'same-name@OpenAI',
      'same-name@Ollama',
    ],
  )
  assert.ok(options.every((option) => option.kind === 'vision'))
})

test('OCR routing preserves factory qualification for cross-factory same names and names ending in a recognized factory', () => {
  const configured: MyLLMProvider = {
    MinerU: provider(configuredModel('shared-name', 'ocr')),
    PaddleOCR: provider(
      configuredModel('shared-name', 'ocr'),
      configuredModel('custom@LocalAI', 'ocr'),
      configuredModel('custom@PaddleOCR', 'ocr'),
    ),
  }
  const catalog: LLMCatalog = {
    MinerU: [catalogModel('shared-name', 'MinerU', 'ocr')],
    PaddleOCR: [
      catalogModel('shared-name', 'PaddleOCR', 'ocr'),
      catalogModel('custom@LocalAI', 'PaddleOCR', 'ocr'),
      catalogModel('custom@PaddleOCR', 'PaddleOCR', 'ocr'),
    ],
  }
  // Outer suffix selects the parser; inner suffix binds the exact tenant factory.
  assert.deepEqual(values(configured, catalog), [
    'DeepDOC',
    'Plain Text',
    'shared-name@MinerU@MinerU',
    'shared-name@PaddleOCR@PaddleOCR',
    'custom@LocalAI@PaddleOCR@PaddleOCR',
    'custom@PaddleOCR@PaddleOCR@PaddleOCR',
  ])
})

test('catalog availability cannot reintroduce disabled or unconfirmed tenant model rows', () => {
  const configured: MyLLMProvider = {
    PaddleOCR: provider(
      configuredModel('disabled', 'ocr', { status: '0' }),
      configuredModel('not-available', 'ocr', { available: false }),
      configuredModel('unconfirmed', 'ocr', { status: undefined }),
      configuredModel('enabled', 'ocr'),
    ),
  }
  // MultiRAG /list can re-add disabled custom rows as available; my_llms wins.
  const catalog: LLMCatalog = {
    PaddleOCR: configured.PaddleOCR.llm.map((model) =>
      catalogModel(model.name, 'PaddleOCR', 'ocr'),
    ),
  }
  assert.deepEqual(values(configured, catalog), [
    'DeepDOC',
    'Plain Text',
    'enabled@PaddleOCR@PaddleOCR',
  ])
})

test('availability requires matching configured provider, exact name, type, and an affirmative catalog flag', () => {
  const configured: MyLLMProvider = {
    OpenAI: provider(configuredModel('vision', 'image2text')),
  }
  const cases: LLMCatalog[] = [
    {},
    { Ollama: [catalogModel('vision', 'Ollama', 'image2text')] },
    { OpenAI: [catalogModel('vision', 'Ollama', 'image2text')] },
    { OpenAI: [catalogModel('vision-other', 'OpenAI', 'image2text')] },
    { OpenAI: [catalogModel('vision', 'OpenAI', 'chat')] },
    { OpenAI: [catalogModel('vision', 'OpenAI', 'notimage2text')] },
    {
      OpenAI: [
        catalogModel('vision', 'OpenAI', 'image2text', { available: false }),
      ],
    },
    {
      OpenAI: [
        catalogModel('vision', 'OpenAI', 'image2text', {
          available: undefined,
        }),
      ],
    },
  ]
  for (const catalog of cases) {
    assert.deepEqual(values(configured, catalog), ['DeepDOC', 'Plain Text'])
  }
  assert.deepEqual(
    values(configured, {
      OpenAI: [catalogModel('vision', 'OpenAI', 'chat, image2text')],
    }),
    ['DeepDOC', 'Plain Text', 'vision@OpenAI'],
  )
  assert.deepEqual(
    values({}, { OpenAI: [catalogModel('vision', 'OpenAI', 'image2text')] }),
    ['DeepDOC', 'Plain Text'],
  )
})

test('wrong model types and OCR providers without a supported named PDF route are excluded', () => {
  const configured: MyLLMProvider = {
    OpenAI: provider(
      ...(
        ['chat', 'embedding', 'rerank', 'tts', 'speech2text', 'ocr'] as const
      ).map((type) => configuredModel(type, type)),
    ),
    MinerU: provider(configuredModel('not-an-ocr-model', 'image2text')),
    PaddleOCR: provider(configuredModel('not-an-ocr-model', 'image2text')),
    OpenDataLoader: provider(configuredModel('configured-loader', 'ocr')),
  }
  const catalog = Object.fromEntries(
    Object.entries(configured).map(([fid, data]) => [
      fid,
      data.llm.map((model) => catalogModel(model.name, fid, model.type)),
    ]),
  )
  assert.deepEqual(values(configured, catalog), ['DeepDOC', 'Plain Text'])
})

test('duplicate rows collapse only the same qualified identity without modifying API data', () => {
  const configured: MyLLMProvider = {
    PaddleOCR: provider(
      configuredModel('same', 'ocr'),
      configuredModel('same', 'ocr'),
      configuredModel('other', 'ocr'),
    ),
  }
  const catalog: LLMCatalog = {
    PaddleOCR: [
      catalogModel('same', 'PaddleOCR', 'ocr'),
      catalogModel('other', 'PaddleOCR', 'ocr'),
    ],
  }
  const snapshot = structuredClone({ configured, catalog })
  assert.deepEqual(values(configured, catalog), [
    'DeepDOC',
    'Plain Text',
    'same@PaddleOCR@PaddleOCR',
    'other@PaddleOCR@PaddleOCR',
  ])
  assert.deepEqual({ configured, catalog }, snapshot)
})
