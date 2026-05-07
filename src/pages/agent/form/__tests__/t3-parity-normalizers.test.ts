import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ParserFileType,
  parserDefaultVisibleFileTypes,
  initialParserFormValues,
  ParserPreprocessValue,
  normalizeParserSetupsForStore,
  serializeParserSetupsForDsl,
} from '../parser/utils'
import {
  normalizeSplitterFormForStore,
  serializeSplitterFormForDsl,
} from '../splitter/utils'
import {
  normalizeHierarchicalMergerFormForStore,
  serializeHierarchicalMergerFormForDsl,
} from '../hierarchical-merger/utils'
import {
  normalizeInvokeFormForStore,
  serializeInvokeFormForDsl,
} from '../invoke/utils'
import {
  buildIterationOutputs,
  buildSuggestedIterationOutputItems,
  normalizeIterationOutputItems,
} from '../iteration/utils'
import type { QueryVariableOptionGroup } from '../components/query-variable-utils'
import { filterQueryVariableOptionGroupsByTypes } from '../components/query-variable-utils'
import {
  buildVariableAggregatorOutputs,
  normalizeVariableAggregatorGroups,
} from '../variable-aggregator/utils'
import {
  normalizeMetadataFilter,
  normalizeRetrievalFormForStore,
  retrievalMetaDataLogic,
  retrievalMetaDataMethod,
  serializeRetrievalFormForDsl,
} from '../retrieval/utils'
import {
  buildBeginWebhookOutputs,
  normalizeBeginInputsForEditor,
  serializeBeginInputsForStore,
} from '../begin/utils'

test('query variable type filtering keeps agent structured output drilldown entry', () => {
  const groups: QueryVariableOptionGroup[] = [
    {
      label: 'Agent',
      title: 'Agent',
      options: [
        {
          label: 'structured',
          value: 'Agent:demo@structured',
          type: 'object',
        },
        {
          label: 'content',
          value: 'Agent:demo@content',
          type: 'string',
        },
      ],
    },
  ]

  const filtered = filterQueryVariableOptionGroupsByTypes(groups, ['number'])

  assert.deepEqual(
    filtered.flatMap((group) => group.options.map((option) => option.value)),
    ['Agent:demo@structured'],
  )
})

test('parser normalizer rebuilds keyed backend setups into file-type cards and back', () => {
  const normalized = normalizeParserSetupsForStore({
    [ParserFileType.PDF]: {
      preprocess: [ParserPreprocessValue.SectionTitle],
      output_format: 'markdown',
    },
    [ParserFileType.Image]: {
      system_prompt: 'describe image',
    },
  })

  const pdfSetup = normalized.find((item) => item.fileFormat === ParserFileType.PDF)
  const imageSetup = normalized.find(
    (item) => item.fileFormat === ParserFileType.Image,
  )

  assert.deepEqual(pdfSetup?.preprocess, [
    ParserPreprocessValue.MainContent,
    ParserPreprocessValue.SectionTitle,
  ])
  assert.equal(pdfSetup?.output_format, 'markdown')
  assert.deepEqual(pdfSetup?.suffix, ['pdf'])
  assert.equal(imageSetup?.parse_method, 'ocr')
  assert.equal(imageSetup?.output_format, 'json')
  assert.equal(imageSetup?.system_prompt, 'describe image')

  const serialized = serializeParserSetupsForDsl(normalized)

  assert.deepEqual(serialized.pdf?.preprocess, [
    ParserPreprocessValue.MainContent,
    ParserPreprocessValue.SectionTitle,
  ])
  assert.deepEqual(serialized.pdf?.suffix, ['pdf'])
  assert.equal(serialized.image?.parse_method, 'ocr')
  assert.equal(serialized.image?.output_format, 'json')
  assert.equal('fileFormat' in (serialized.pdf || {}), false)
})

test('parser defaults only expand the seven visible ragflow-aligned cards in order', () => {
  const defaultSetups = normalizeParserSetupsForStore(undefined)

  assert.equal(defaultSetups.length, 7)
  assert.deepEqual(
    defaultSetups.map((item) => item.fileFormat),
    parserDefaultVisibleFileTypes,
  )
  assert.deepEqual(
    initialParserFormValues.setups.map((item) => item.fileFormat),
    parserDefaultVisibleFileTypes,
  )
})

test('parser serializer preserves hidden round-trip fields and parser-specific advanced options', () => {
  const serialized = serializeParserSetupsForDsl([
    {
      fileFormat: ParserFileType.Video,
      llm_id: 'vision-model@OpenAI',
      prompt: 'describe every frame',
    },
    {
      fileFormat: ParserFileType.PDF,
      parse_method: 'paddle-model@PaddleOCR',
      paddleocr_parse_method: 'raw',
    },
  ])

  assert.equal(serialized.video?.prompt, 'describe every frame')
  assert.equal(serialized.video?.llm_id, 'vision-model@OpenAI')
  assert.deepEqual(serialized.video?.suffix, ['mp4', 'avi', 'mkv'])
  assert.equal(serialized.pdf?.parse_method, 'paddle-model@PaddleOCR')
  assert.equal(serialized.pdf?.paddleocr_parse_method, 'raw')
})

test('parser serializer injects suffix and preserves pdf advanced options for keyed setup payloads', () => {
  const serialized = serializeParserSetupsForDsl([
    {
      fileFormat: ParserFileType.PDF,
      parse_method: 'mineru-model@MinerU',
      mineru_parse_method: 'ocr',
      mineru_formula_enable: false,
      mineru_table_enable: true,
      mineru_lang: 'Japanese',
    },
  ])

  assert.deepEqual(serialized.pdf?.suffix, ['pdf'])
  assert.equal(serialized.pdf?.parse_method, 'mineru-model@MinerU')
  assert.equal(serialized.pdf?.lang, 'Japanese')
  assert.equal(serialized.pdf?.mineru_parse_method, 'ocr')
  assert.equal(serialized.pdf?.mineru_formula_enable, false)
  assert.equal(serialized.pdf?.mineru_table_enable, true)
  assert.equal(serialized.pdf?.mineru_lang, 'Japanese')
})

test('splitter bridge converts delimiter cards into backend string arrays', () => {
  const normalized = normalizeSplitterFormForStore({
    delimiters: ['\n', '---'],
    children_delimiters: ['##'],
    image_table_context_window: 6,
  })

  assert.deepEqual(normalized.delimiters, [{ value: '\n' }, { value: '---' }])
  assert.equal(normalized.enable_children, true)
  assert.equal(normalized.image_table_context_window, 6)
  assert.equal('table_context_size' in normalized, false)
  assert.equal('image_context_size' in normalized, false)

  const serialized = serializeSplitterFormForDsl(normalized)

  assert.deepEqual(serialized.delimiters, ['\n', '---'])
  assert.deepEqual(serialized.children_delimiters, ['##'])
  assert.equal('enable_children' in serialized, false)
  assert.equal(serialized.image_table_context_window, 6)
  assert.equal('table_context_size' in serialized, false)
  assert.equal('image_context_size' in serialized, false)
})

test('splitter normalizer merges legacy split table/image fields into single window', () => {
  const normalized = normalizeSplitterFormForStore({
    delimiters: ['\n'],
    table_context_size: 10,
    image_context_size: 4,
  })

  assert.equal(normalized.image_table_context_window, 10)
  assert.equal('table_context_size' in normalized, false)
  assert.equal('image_context_size' in normalized, false)
})

test('hierarchical merger bridge converts regex cards into nested level arrays', () => {
  const normalized = normalizeHierarchicalMergerFormForStore({
    hierarchy: 2,
    levels: [['^#[^#]'], ['^##[^#]', '^###[^#]']],
  })

  assert.deepEqual(normalized.levels, [
    { expressions: [{ expression: '^#[^#]' }] },
    {
      expressions: [{ expression: '^##[^#]' }, { expression: '^###[^#]' }],
    },
  ])

  const serialized = serializeHierarchicalMergerFormForDsl(normalized)

  assert.equal(serialized.hierarchy, '2')
  assert.deepEqual(serialized.levels, [['^#[^#]'], ['^##[^#]', '^###[^#]']])
})

test('invoke normalizer keeps monaco headers and variable refs in backend shape', () => {
  const normalized = normalizeInvokeFormForStore({
    url: 'https://api.example.com/{begin@user_id}',
    headers: { Authorization: 'Bearer token' },
    datatype: 'FORMDATA',
    timeout: '30',
    variables: [{ key: 'user_id', ref: '{begin@user_id}', value: '' }],
  })

  assert.equal(normalized.datatype, 'formdata')
  assert.equal(normalized.timeout, 30)
  assert.match(normalized.headers, /Authorization/)
  assert.equal(normalized.variables[0]?.ref, 'begin@user_id')

  const serialized = serializeInvokeFormForDsl(normalized)

  assert.equal(serialized.variables[0]?.ref, 'begin@user_id')
  assert.equal(serialized.datatype, 'formdata')
})

test('iteration utilities derive dynamic outputs from structured output items', () => {
  const normalized = normalizeIterationOutputItems({
    items: {
      ref: '{child@generated_text}',
      type: 'Array<string>',
    },
  })

  assert.deepEqual(normalized, [
    {
      name: 'items',
      ref: 'child@generated_text',
      type: 'Array<string>',
    },
  ])

  const outputs = buildIterationOutputs(normalized)
  assert.deepEqual(outputs, {
    items: {
      ref: 'child@generated_text',
      type: 'Array<string>',
    },
  })

  const suggested = buildSuggestedIterationOutputItems([
    {
      label: 'Generate',
      title: 'Generate',
      options: [{ label: 'text', value: 'generate-1@text', type: 'string' }],
    },
    {
      label: 'Rewrite',
      title: 'Rewrite',
      options: [{ label: 'text', value: 'rewrite-1@text', type: 'string' }],
    },
  ] as unknown as QueryVariableOptionGroup[])

  assert.equal(suggested[0]?.name, 'text')
  assert.equal(suggested[1]?.name, 'Rewrite_text')
})

test('variable aggregator derives outputs from selected variable groups', () => {
  const groups = normalizeVariableAggregatorGroups([
    {
      group_name: 'documents',
      variables: ['{retrieval@json}'],
    },
  ])

  const outputs = buildVariableAggregatorOutputs(
    groups,
    [
      {
        label: 'Retrieval',
        title: 'Retrieval',
        options: [
          {
            label: 'json',
            value: 'retrieval@json',
            type: 'Array<Object>',
          },
        ],
      },
    ] as unknown as QueryVariableOptionGroup[],
  )

  assert.deepEqual(groups, [
    {
      group_name: 'documents',
      type: undefined,
      variables: [{ value: 'retrieval@json' }],
    },
  ])
  assert.deepEqual(outputs, {
    documents: {
      type: 'Array<Object>',
    },
  })
})

test('retrieval normalizer keeps metadata filter bridge at serializer boundary', () => {
  const metadataFilter = normalizeMetadataFilter({
    method: retrievalMetaDataMethod.SemiAuto,
    logic: retrievalMetaDataLogic.Or,
    semi_auto: ['author', '', 42],
  })

  assert.deepEqual(metadataFilter, {
    method: retrievalMetaDataMethod.SemiAuto,
    logic: retrievalMetaDataLogic.Or,
    manual: [],
    semi_auto: ['author'],
  })

  const normalized = normalizeRetrievalFormForStore({
    retrieval_from: 'memory',
    memory_ids: ['memory-1', '', 3],
    cross_languages: ['English', '', 'Japanese'],
    meta_data_filter: metadataFilter,
  })

  assert.equal(normalized.retrieval_from, 'memory')
  assert.deepEqual(normalized.memory_ids, ['memory-1'])
  assert.deepEqual(normalized.cross_languages, ['English', 'Japanese'])
  assert.equal(normalized.meta_data_filter.method, retrievalMetaDataMethod.SemiAuto)

  const serialized = serializeRetrievalFormForDsl(normalized)

  assert.deepEqual(serialized.meta_data_filter, metadataFilter)
  assert.deepEqual(Object.keys(serialized.outputs), ['formalized_content', 'json'])
})

test('begin input bridge converts keyed input objects into compact-record rows and back', () => {
  const normalized = normalizeBeginInputsForEditor({
    user_id: {
      name: 'User ID',
      type: 'line',
      value: '',
      optional: false,
    },
    attachments: {
      name: 'Attachments',
      type: 'file',
      value: '',
      optional: true,
    },
  })

  assert.deepEqual(normalized, [
    {
      key: 'user_id',
      label: undefined,
      name: 'User ID',
      type: 'line',
      value: '',
      optional: false,
      required: undefined,
      options: [],
    },
    {
      key: 'attachments',
      label: undefined,
      name: 'Attachments',
      type: 'file',
      value: '',
      optional: true,
      required: undefined,
      options: [],
    },
  ])

  const serialized = serializeBeginInputsForStore(normalized)

  assert.deepEqual(serialized, {
    user_id: {
      name: 'User ID',
      type: 'line',
      value: '',
      optional: false,
      label: undefined,
      required: undefined,
      options: [],
    },
    attachments: {
      name: 'Attachments',
      type: 'file',
      value: '',
      optional: true,
      label: undefined,
      required: undefined,
      options: [],
    },
  })
})

test('begin webhook schema derives direct outputs for query, headers, and body keys', () => {
  const outputs = buildBeginWebhookOutputs({
    query: [{ key: 'user_id', type: 'string', required: true }],
    headers: [{ key: 'authorization', type: 'string', required: true }],
    body: [{ key: 'payload', type: 'object', required: false }],
  })

  assert.deepEqual(outputs, {
    'query.user_id': { type: 'string' },
    'headers.authorization': { type: 'string' },
    'body.payload': { type: 'object' },
  })
})
