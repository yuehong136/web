import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ParserFileType,
  parserDefaultVisibleFileTypes,
  getDefaultParserSetup,
  initialParserFormValues,
  ParserPreprocessValue,
  normalizeParserSetupsForStore,
  serializeParserSetupsForDsl,
  supportsParserMediaFlattening,
} from '../parser/utils'
import {
  normalizeTitleChunkerFormForStore,
  serializeTitleChunkerFormForDsl,
} from '../title-chunker/utils'
import {
  normalizeTokenChunkerFormForStore,
  serializeTokenChunkerFormForDsl,
} from '../token-chunker/utils'
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
      flatten_media_to_text: true,
    },
    [ParserFileType.Image]: {
      system_prompt: 'describe image',
    },
  })

  const pdfSetup = normalized.find(
    (item) => item.fileFormat === ParserFileType.PDF,
  )
  const imageSetup = normalized.find(
    (item) => item.fileFormat === ParserFileType.Image,
  )

  assert.deepEqual(pdfSetup?.preprocess, [
    ParserPreprocessValue.MainContent,
    ParserPreprocessValue.SectionTitle,
  ])
  assert.equal(pdfSetup?.output_format, 'markdown')
  assert.equal(pdfSetup?.flatten_media_to_text, true)
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
  assert.equal(serialized.pdf?.flatten_media_to_text, true)
  assert.equal(serialized.image?.parse_method, 'ocr')
  assert.equal(serialized.image?.output_format, 'json')
  assert.equal('fileFormat' in (serialized.pdf || {}), false)
})

test('parser media-flattening capability drives defaults and serialization consistently', () => {
  const supportedFileTypes = [
    ParserFileType.PDF,
    ParserFileType.Spreadsheet,
    ParserFileType.TextMarkdown,
    ParserFileType.Docx,
  ]

  for (const fileType of supportedFileTypes) {
    assert.equal(supportsParserMediaFlattening(fileType), true)
    const defaultSetup = getDefaultParserSetup(fileType)
    assert.equal(defaultSetup.flatten_media_to_text, false)
    assert.equal(
      serializeParserSetupsForDsl([defaultSetup])[fileType]
        ?.flatten_media_to_text,
      false,
    )
  }

  assert.equal(supportsParserMediaFlattening(ParserFileType.Doc), false)
  const serialized = serializeParserSetupsForDsl([
    { fileFormat: ParserFileType.Doc, flatten_media_to_text: true },
  ])
  assert.equal('flatten_media_to_text' in (serialized.doc || {}), false)
})

test('parser defaults only expand the nine visible ragflow-aligned cards in order', () => {
  const defaultSetups = normalizeParserSetupsForStore(undefined)

  assert.equal(defaultSetups.length, 9)
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

test('token chunker bridge converts delimiter cards into backend string arrays', () => {
  const normalized = normalizeTokenChunkerFormForStore({
    delimiters: ['\n', '---'],
    children_delimiters: ['##'],
    image_table_context_window: 6,
  })

  assert.equal(normalized.delimiter_mode, 'delimiter')
  assert.deepEqual(normalized.delimiters, [{ value: '\n' }, { value: '---' }])
  assert.equal(normalized.enable_children, true)
  assert.equal(normalized.image_table_context_window, 6)
  assert.equal('table_context_size' in normalized, false)
  assert.equal('image_context_size' in normalized, false)

  const serialized = serializeTokenChunkerFormForDsl(normalized)

  assert.deepEqual(serialized.delimiters, ['\n', '---'])
  assert.deepEqual(serialized.children_delimiters, ['##'])
  assert.equal('enable_children' in serialized, false)
  assert.equal('image_table_context_window' in serialized, false)
  assert.equal(serialized.table_context_size, 6)
  assert.equal(serialized.image_context_size, 6)
})

test('token chunker token-size mode clears delimiter-only backend fields', () => {
  const normalized = normalizeTokenChunkerFormForStore({
    delimiter_mode: 'token_size',
    delimiters: ['\n'],
    table_context_size: 10,
    image_context_size: 4,
    overlapped_percent: 0.2,
  })

  assert.equal(normalized.delimiter_mode, 'token_size')
  assert.equal(normalized.overlapped_percent, 20)
  assert.equal(normalized.image_table_context_window, 10)

  const serialized = serializeTokenChunkerFormForDsl(normalized)
  assert.deepEqual(serialized.delimiters, [])
  assert.deepEqual(serialized.children_delimiters, [])
  assert.equal(serialized.overlapped_percent, 0.2)
  assert.equal(serialized.table_context_size, 10)
  assert.equal(serialized.image_context_size, 10)
})

test('token chunker one mode disables overlap and child delimiters', () => {
  const serialized = serializeTokenChunkerFormForDsl({
    delimiter_mode: 'one',
    overlapped_percent: 20,
    enable_children: true,
    children_delimiters: [{ value: '##' }],
  })

  assert.equal(serialized.overlapped_percent, 0)
  assert.deepEqual(serialized.delimiters, [])
  assert.deepEqual(serialized.children_delimiters, [])
})

test('title chunker bridge converts legacy levels into active rule arrays', () => {
  const normalized = normalizeTitleChunkerFormForStore({
    hierarchy: 2,
    levels: [['^#[^#]'], ['^##[^#]', '^###[^#]']],
  })

  assert.equal(normalized.method, 'hierarchy')
  assert.equal(normalized.hierarchyHierarchy, '2')
  assert.deepEqual(normalized.hierarchyRules, [
    { levels: [{ expression: '^#[^#]' }] },
    {
      levels: [{ expression: '^##[^#]' }, { expression: '^###[^#]' }],
    },
  ])

  const serialized = serializeTitleChunkerFormForDsl(normalized)

  assert.equal(serialized.method, 'hierarchy')
  assert.equal(serialized.hierarchy, 2)
  assert.equal(serialized.include_heading_content, false)
  assert.deepEqual(serialized.levels, [['^#[^#]'], ['^##[^#]', '^###[^#]']])
})

test('title chunker serializes group mode from group-specific rules', () => {
  const serialized = serializeTitleChunkerFormForDsl({
    method: 'group',
    hierarchyGroup: '0',
    hierarchyRules: [{ levels: [{ expression: '^#[^#]' }] }],
    groupRules: [{ levels: [{ expression: '^##[^#]' }] }],
    include_heading_content: true,
    root_chunk_as_heading: true,
  })

  assert.equal(serialized.method, 'group')
  assert.equal(serialized.hierarchy, 0)
  assert.equal(serialized.include_heading_content, true)
  assert.deepEqual(serialized.levels, [['^##[^#]']])
  assert.equal(serialized.root_chunk_as_heading, true)
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

test('invoke serializer omits datatype when it defaults to json', () => {
  const serialized = serializeInvokeFormForDsl({
    url: 'https://api.example.com',
    method: 'get',
    timeout: 10,
    headers: '{}',
    proxy: '',
    clean_html: false,
    datatype: 'json',
    variables: [],
  })

  assert.equal(
    Object.prototype.hasOwnProperty.call(serialized, 'datatype'),
    false,
    'datatype should be omitted when it equals the implicit json default',
  )
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

  const outputs = buildVariableAggregatorOutputs(groups, [
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
  ] as unknown as QueryVariableOptionGroup[])

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
  assert.equal(
    normalized.meta_data_filter.method,
    retrievalMetaDataMethod.SemiAuto,
  )

  const serialized = serializeRetrievalFormForDsl(normalized)

  assert.deepEqual(serialized.meta_data_filter, metadataFilter)
  assert.deepEqual(Object.keys(serialized.outputs), [
    'formalized_content',
    'json',
  ])
})

test('retrieval normalizer bridges legacy kb_ids to dataset_ids', () => {
  const normalized = normalizeRetrievalFormForStore({
    kb_ids: ['kb-1', '', 'kb-2'],
  })

  assert.deepEqual(normalized.dataset_ids, ['kb-1', 'kb-2'])
  assert.deepEqual(normalized.kb_ids, ['kb-1', 'kb-2'])

  const serialized = serializeRetrievalFormForDsl({
    dataset_ids: ['dataset-1'],
    kb_ids: ['legacy-kb'],
  })

  assert.deepEqual(serialized.dataset_ids, ['dataset-1'])
  assert.deepEqual(serialized.kb_ids, ['dataset-1'])
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
      order: 0,
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
      order: 1,
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
      order: 0,
      options: [],
    },
    attachments: {
      name: 'Attachments',
      type: 'file',
      value: '',
      optional: true,
      label: undefined,
      required: undefined,
      order: 1,
      options: [],
    },
  })
})

test('begin input bridge sorts object inputs by explicit order metadata', () => {
  const normalized = normalizeBeginInputsForEditor({
    10: {
      name: 'Tenth',
      type: 'line',
      value: '',
      optional: false,
      order: 2,
    },
    2: {
      name: 'Second',
      type: 'line',
      value: '',
      optional: false,
      order: 0,
    },
    alpha: {
      name: 'Alpha',
      type: 'line',
      value: '',
      optional: false,
      order: 1,
    },
  })

  assert.deepEqual(
    normalized.map((item) => item.key),
    ['2', 'alpha', '10'],
  )
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
