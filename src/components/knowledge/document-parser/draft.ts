import { APIError } from '@/api/client'
import type { DocumentParserPatch } from '@/api/knowledge-document-parser'
import type { Document } from '@/types/api'
import { DocumentParserType } from '@/types/document-parser'

export type ParserFormValues = {
  parseType: 1 | 2
  parser_id: string
  pipeline_id: string
  parser_config: Record<string, unknown>
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export function sameParserValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (Array.isArray(a) && Array.isArray(b))
    return (
      a.length === b.length &&
      a.every((value, i) => sameParserValue(value, b[i]))
    )
  if (isRecord(a) && isRecord(b)) {
    const keys = Object.keys(a)
    return (
      keys.length === Object.keys(b).length &&
      keys.every(
        (key) => Object.hasOwn(b, key) && sameParserValue(a[key], b[key]),
      )
    )
  }
  return false
}

export function hydrateParserDraft(document: Document): ParserFormValues {
  const config = isRecord(document.parser_config)
    ? structuredClone(document.parser_config)
    : {}
  const children = config.parent_child
  if (isRecord(children)) {
    if (Object.hasOwn(children, 'use_parent_child'))
      config.enable_children = children.use_parent_child
    if (Object.hasOwn(children, 'children_delimiter'))
      config.children_delimiter = children.children_delimiter
  }
  if (
    !Object.hasOwn(config, 'image_table_context_window') &&
    sameParserValue(config.image_context_size, config.table_context_size)
  )
    config.image_table_context_window = config.image_context_size
  return {
    parseType: document.pipeline_id ? 2 : 1,
    parser_id: typeof document.parser_id === 'string' ? document.parser_id : '',
    pipeline_id:
      typeof document.pipeline_id === 'string' ? document.pipeline_id : '',
    parser_config: config,
  }
}

function invalidDraft(): never {
  throw new APIError(
    400,
    'DOCUMENT_UPDATE_INVALID',
    'Invalid document parser configuration',
  )
}

/** Only explicitly edited leaves are eligible; controller display defaults are not intent. */
function editedValue(
  initial: unknown,
  current: unknown,
  dirty: unknown,
): unknown {
  if (!dirty || sameParserValue(initial, current)) return undefined
  if (dirty === true) {
    if (current === undefined) return invalidDraft()
    return structuredClone(current)
  }
  if (!isRecord(dirty) || !isRecord(current)) return invalidDraft()
  const patch: Record<string, unknown> = {}
  for (const [key, marker] of Object.entries(dirty)) {
    const value = editedValue(
      isRecord(initial) ? initial[key] : undefined,
      current[key],
      marker,
    )
    if (value !== undefined) patch[key] = value
  }
  return Object.keys(patch).length ? patch : undefined
}

const integerRanges: Record<string, [number, number]> = {
  chunk_token_num: [1, 8192],
  auto_keywords: [0, 32],
  auto_questions: [0, 10],
  image_context_size: [0, Number.MAX_SAFE_INTEGER],
  table_context_size: [0, Number.MAX_SAFE_INTEGER],
  topn_tags: [1, 10],
  task_page_size: [1, Number.MAX_SAFE_INTEGER],
}
const booleans = new Set([
  'html4excel',
  'toc_extraction',
  'enable_children',
  'mineru_formula_enable',
  'mineru_table_enable',
  'enable_metadata',
  'analyze_hyperlink',
  'hyperlink_urls',
])
const languages = new Set([
  'English',
  'Chinese',
  'Traditional Chinese',
  'Russian',
  'Ukrainian',
  'Indonesian',
  'Spanish',
  'Vietnamese',
  'Japanese',
  'Korean',
  'Portuguese BR',
  'German',
  'French',
  'Italian',
  'Tamil',
  'Telugu',
  'Kannada',
  'Thai',
  'Greek',
  'Hindi',
  'Bulgarian',
  'Turkish',
])
const strings = new Set([
  'delimiter',
  'layout_recognize',
  'children_delimiter',
  'llm_id',
  'video_prompt',
])
const objectFields = new Set(['parent_child', 'raptor', 'graphrag'])

export function validateParserConfigPatch(
  config: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(config)) {
    if (value === null || value === undefined) return invalidDraft()
    if (integerRanges[key]) {
      const [min, max] = integerRanges[key]
      if (
        typeof value !== 'number' ||
        !Number.isSafeInteger(value) ||
        value < min ||
        value > max
      )
        return invalidDraft()
    } else if (booleans.has(key)) {
      if (typeof value !== 'boolean') return invalidDraft()
    } else if (strings.has(key)) {
      if (
        typeof value !== 'string' ||
        (['delimiter', 'layout_recognize'].includes(key) && !value)
      )
        return invalidDraft()
    } else if (key === 'overlapped_percent' || key === 'filename_embd_weight') {
      if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > (key === 'overlapped_percent' ? 90 : 1)
      )
        return invalidDraft()
    } else if (key === 'mineru_parse_method') {
      if (
        !['auto', 'txt', 'ocr'].includes(String(value)) ||
        typeof value !== 'string'
      )
        return invalidDraft()
    } else if (key === 'mineru_lang') {
      if (typeof value !== 'string' || !languages.has(value))
        return invalidDraft()
    } else if (objectFields.has(key)) {
      if (!isRecord(value)) return invalidDraft()
    } else if (key === 'metadata') {
      if (!isRecord(value) && !Array.isArray(value)) return invalidDraft()
      if (
        isRecord(value) &&
        ((Object.hasOwn(value, 'type') && value.type !== 'object') ||
          (Object.hasOwn(value, 'properties') && !isRecord(value.properties)))
      )
        return invalidDraft()
    } else if (['built_in_metadata', 'tag_kb_ids', 'pages'].includes(key)) {
      if (!Array.isArray(value)) return invalidDraft()
      if (
        key === 'pages' &&
        value.some(
          (pair) =>
            !Array.isArray(pair) ||
            pair.length !== 2 ||
            pair.some((n) => !Number.isSafeInteger(n) || n < 1) ||
            pair[0] >= pair[1],
        )
      )
        return invalidDraft()
    } else return invalidDraft()
  }
  const nested = config.parent_child
  if (isRecord(nested)) {
    if (
      Object.keys(nested).some(
        (key) => !['use_parent_child', 'children_delimiter'].includes(key),
      ) ||
      (Object.hasOwn(nested, 'use_parent_child') &&
        typeof nested.use_parent_child !== 'boolean') ||
      (Object.hasOwn(nested, 'children_delimiter') &&
        (typeof nested.children_delimiter !== 'string' ||
          !nested.children_delimiter))
    )
      return invalidDraft()
    if (
      (Object.hasOwn(nested, 'use_parent_child') &&
        Object.hasOwn(config, 'enable_children') &&
        nested.use_parent_child !== config.enable_children) ||
      (Object.hasOwn(nested, 'children_delimiter') &&
        Object.hasOwn(config, 'children_delimiter') &&
        nested.children_delimiter !== config.children_delimiter)
    )
      return invalidDraft()
  }
  if (
    config.children_delimiter === '' &&
    config.enable_children !== false &&
    (!isRecord(nested) || nested.use_parent_child !== false)
  )
    return invalidDraft()
}

export function serializeParserDraft(
  initial: ParserFormValues,
  current: ParserFormValues,
  dirty: unknown,
): DocumentParserPatch {
  const patch: DocumentParserPatch = {}
  if (current.parseType === 2) {
    if (!/^[0-9a-f]{32}$/.test(current.pipeline_id)) return invalidDraft()
    if (initial.parseType !== 2 || initial.pipeline_id !== current.pipeline_id)
      patch.pipeline_id = current.pipeline_id
  } else if (current.parseType === 1) {
    if (initial.parseType !== 1 || initial.parser_id !== current.parser_id) {
      if (
        !Object.values(DocumentParserType).includes(
          current.parser_id as DocumentParserType,
        )
      )
        return invalidDraft()
      patch.chunk_method = current.parser_id
      if (initial.parseType === 2) patch.pipeline_id = ''
    }
  } else return invalidDraft()
  const configDirty = isRecord(dirty) ? dirty.parser_config : undefined
  const config = editedValue(
    initial.parser_config,
    current.parser_config,
    configDirty,
  )
  if (config !== undefined) {
    if (!isRecord(config)) return invalidDraft()
    if (Object.hasOwn(config, 'image_table_context_window')) {
      const value = config.image_table_context_window
      config.image_context_size = value
      config.table_context_size = value
      delete config.image_table_context_window
    }
    // Switching the child toggle explicitly owns its delimiter too, not mount defaults.
    if (Object.hasOwn(config, 'enable_children'))
      config.children_delimiter =
        config.enable_children === false
          ? ''
          : current.parser_config.children_delimiter
    for (const [key, value] of Object.entries(config))
      if (isRecord(value) && !Object.keys(value).length) delete config[key]
    validateParserConfigPatch(config)
    if (Object.keys(config).length) patch.parser_config = config
  }
  return patch
}

/** Display constraints are hints; the real source File remains the API authority. */
export function requiredSourceParser(
  document: Pick<Document, 'name' | 'type'>,
): string | undefined {
  const suffix = document.name.split('.').at(-1)?.toLowerCase()
  if (
    document.type === 'visual' ||
    [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'bmp',
      'tif',
      'tiff',
      'webp',
      'svg',
      'ico',
      'mp4',
      'mov',
      'avi',
      'flv',
      'mpeg',
      'mpg',
      'webm',
      'wmv',
      '3gp',
      '3gpp',
      'mkv',
    ].includes(suffix ?? '')
  )
    return 'picture'
  if (
    document.type === 'aural' ||
    [
      'mp3',
      'wav',
      'aac',
      'flac',
      'ogg',
      'aiff',
      'au',
      'midi',
      'wma',
      'da',
      'wave',
      'realaudio',
      'vqf',
      'oggvorbis',
      'ape',
    ].includes(suffix ?? '')
  )
    return 'audio'
  if (['ppt', 'pptx', 'pages'].includes(suffix ?? '')) return 'presentation'
  if (['eml', 'msg'].includes(suffix ?? '')) return 'email'
  return undefined
}
