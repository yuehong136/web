import type { OutputMap } from '../components/output'

export const ParserFileType = {
  PDF: 'pdf',
  Spreadsheet: 'spreadsheet',
  Image: 'image',
  Email: 'email',
  TextMarkdown: 'markdown',
  TextCode: 'text&code',
  Doc: 'doc',
  Docx: 'docx',
  Slides: 'slides',
  Audio: 'audio',
  Video: 'video',
} as const

export const ParserParseMethod = {
  DeepDOC: 'deepdoc',
  PlainText: 'plain_text',
  Docling: 'docling',
  TCADPParser: 'tcadp parser',
  OCR: 'ocr',
} as const

export const ParserPreprocessValue = {
  MainContent: 'main_content',
  SectionTitle: 'title',
  Abstract: 'abstract',
  Author: 'author',
} as const

export const ParserEmailField = {
  From: 'from',
  To: 'to',
  Cc: 'cc',
  Bcc: 'bcc',
  Date: 'date',
  Subject: 'subject',
  Body: 'body',
  Attachments: 'attachments',
  Metadata: 'metadata',
} as const

export type ParserFileTypeValue =
  (typeof ParserFileType)[keyof typeof ParserFileType]

export type ParserSetupValue = {
  fileFormat?: string
  suffix?: string[]
  preprocess?: string[]
  output_format?: string
  parse_method?: string
  lang?: string
  fields?: string[]
  llm_id?: string
  system_prompt?: string
  prompt?: string
  table_result_type?: string
  markdown_image_response_type?: string
  mineru_parse_method?: string
  mineru_formula_enable?: boolean
  mineru_table_enable?: boolean
  mineru_lang?: string
  mineru_llm_name?: string
  paddleocr_parse_method?: string
  paddleocr_llm_name?: string
  docling_parse_method?: string
}

export const parserFileTypeOrder: ParserFileTypeValue[] = [
  ParserFileType.PDF,
  ParserFileType.Spreadsheet,
  ParserFileType.Image,
  ParserFileType.Email,
  ParserFileType.TextMarkdown,
  ParserFileType.TextCode,
  ParserFileType.Doc,
  ParserFileType.Docx,
  ParserFileType.Slides,
  ParserFileType.Audio,
  ParserFileType.Video,
]

export const parserDefaultVisibleFileTypes: ParserFileTypeValue[] =
  parserFileTypeOrder.slice(0, 9)

export const parserOutputs: OutputMap = {
  markdown: { type: 'string', value: '' },
  text: { type: 'string', value: '' },
  html: { type: 'string', value: '' },
  json: { type: 'Array<object>', value: [] },
}

export const parserFileTypeSuffixMap: Record<ParserFileTypeValue, string[]> = {
  [ParserFileType.PDF]: ['pdf'],
  [ParserFileType.Spreadsheet]: ['xls', 'xlsx', 'csv'],
  [ParserFileType.Image]: ['jpg', 'jpeg', 'png', 'gif'],
  [ParserFileType.Email]: ['eml', 'msg'],
  [ParserFileType.TextMarkdown]: ['md', 'markdown', 'mdx'],
  [ParserFileType.TextCode]: [
    'txt',
    'py',
    'js',
    'java',
    'c',
    'cpp',
    'h',
    'php',
    'go',
    'ts',
    'sh',
    'cs',
    'kt',
    'sql',
  ],
  [ParserFileType.Doc]: ['doc'],
  [ParserFileType.Docx]: ['docx'],
  [ParserFileType.Slides]: ['pptx', 'ppt'],
  [ParserFileType.Audio]: [
    'da',
    'wave',
    'wav',
    'mp3',
    'aac',
    'flac',
    'ogg',
    'aiff',
    'au',
    'midi',
    'wma',
    'realaudio',
    'vqf',
    'oggvorbis',
    'ape',
  ],
  [ParserFileType.Video]: ['mp4', 'avi', 'mkv'],
}

export const parserVisibleOutputFormatsMap: Record<
  ParserFileTypeValue,
  string[]
> = {
  [ParserFileType.PDF]: ['json', 'markdown'],
  [ParserFileType.Spreadsheet]: ['json', 'html'],
  [ParserFileType.Image]: ['json'],
  [ParserFileType.Email]: ['text', 'json'],
  [ParserFileType.TextMarkdown]: ['text', 'json'],
  [ParserFileType.TextCode]: ['text', 'json'],
  [ParserFileType.Doc]: ['json', 'markdown'],
  [ParserFileType.Docx]: ['json', 'markdown'],
  [ParserFileType.Slides]: ['json'],
  [ParserFileType.Audio]: ['text'],
  [ParserFileType.Video]: ['text'],
}

export const parserVisibleParseMethodsMap: Partial<
  Record<ParserFileTypeValue, string[]>
> = {
  [ParserFileType.PDF]: [
    ParserParseMethod.DeepDOC,
    ParserParseMethod.PlainText,
    ParserParseMethod.Docling,
    ParserParseMethod.TCADPParser,
  ],
  [ParserFileType.Spreadsheet]: [
    ParserParseMethod.DeepDOC,
    ParserParseMethod.TCADPParser,
  ],
  [ParserFileType.Slides]: [
    ParserParseMethod.DeepDOC,
    ParserParseMethod.TCADPParser,
  ],
  [ParserFileType.Image]: [ParserParseMethod.OCR],
}

export const parserPreprocessOptionsMap: Partial<
  Record<ParserFileTypeValue, string[]>
> = {
  [ParserFileType.PDF]: [
    ParserPreprocessValue.MainContent,
    ParserPreprocessValue.SectionTitle,
    ParserPreprocessValue.Abstract,
    ParserPreprocessValue.Author,
  ],
  [ParserFileType.Spreadsheet]: [ParserPreprocessValue.MainContent],
  [ParserFileType.TextMarkdown]: [
    ParserPreprocessValue.MainContent,
    ParserPreprocessValue.SectionTitle,
  ],
  [ParserFileType.TextCode]: [ParserPreprocessValue.MainContent],
  [ParserFileType.Doc]: [
    ParserPreprocessValue.MainContent,
    ParserPreprocessValue.SectionTitle,
  ],
  [ParserFileType.Docx]: [
    ParserPreprocessValue.MainContent,
    ParserPreprocessValue.SectionTitle,
  ],
  [ParserFileType.Slides]: [ParserPreprocessValue.MainContent],
}

const defaultParserSetupMap: Record<ParserFileTypeValue, ParserSetupValue> = {
  [ParserFileType.PDF]: {
    fileFormat: ParserFileType.PDF,
    output_format: 'json',
    parse_method: ParserParseMethod.DeepDOC,
    lang: 'Chinese',
    preprocess: [ParserPreprocessValue.MainContent],
    suffix: parserFileTypeSuffixMap[ParserFileType.PDF],
    table_result_type: '1',
    markdown_image_response_type: '1',
    mineru_parse_method: 'auto',
    mineru_formula_enable: true,
    mineru_table_enable: true,
    mineru_lang: 'English',
    paddleocr_parse_method: 'raw',
    docling_parse_method: 'raw',
  },
  [ParserFileType.Spreadsheet]: {
    fileFormat: ParserFileType.Spreadsheet,
    output_format: 'html',
    parse_method: ParserParseMethod.DeepDOC,
    preprocess: [ParserPreprocessValue.MainContent],
    suffix: parserFileTypeSuffixMap[ParserFileType.Spreadsheet],
    table_result_type: '1',
    markdown_image_response_type: '1',
  },
  [ParserFileType.Image]: {
    fileFormat: ParserFileType.Image,
    output_format: 'json',
    parse_method: ParserParseMethod.OCR,
    lang: 'Chinese',
    suffix: parserFileTypeSuffixMap[ParserFileType.Image],
    system_prompt: '',
  },
  [ParserFileType.Email]: {
    fileFormat: ParserFileType.Email,
    output_format: 'json',
    suffix: parserFileTypeSuffixMap[ParserFileType.Email],
    fields: Object.values(ParserEmailField),
  },
  [ParserFileType.TextMarkdown]: {
    fileFormat: ParserFileType.TextMarkdown,
    output_format: 'json',
    preprocess: [ParserPreprocessValue.MainContent],
    suffix: parserFileTypeSuffixMap[ParserFileType.TextMarkdown],
  },
  [ParserFileType.TextCode]: {
    fileFormat: ParserFileType.TextCode,
    output_format: 'json',
    preprocess: [ParserPreprocessValue.MainContent],
    suffix: parserFileTypeSuffixMap[ParserFileType.TextCode],
  },
  [ParserFileType.Doc]: {
    fileFormat: ParserFileType.Doc,
    output_format: 'json',
    preprocess: [ParserPreprocessValue.MainContent],
    suffix: parserFileTypeSuffixMap[ParserFileType.Doc],
  },
  [ParserFileType.Docx]: {
    fileFormat: ParserFileType.Docx,
    output_format: 'json',
    preprocess: [ParserPreprocessValue.MainContent],
    suffix: parserFileTypeSuffixMap[ParserFileType.Docx],
  },
  [ParserFileType.Slides]: {
    fileFormat: ParserFileType.Slides,
    output_format: 'json',
    parse_method: ParserParseMethod.DeepDOC,
    preprocess: [ParserPreprocessValue.MainContent],
    suffix: parserFileTypeSuffixMap[ParserFileType.Slides],
    table_result_type: '1',
    markdown_image_response_type: '1',
  },
  [ParserFileType.Audio]: {
    fileFormat: ParserFileType.Audio,
    output_format: 'text',
    suffix: parserFileTypeSuffixMap[ParserFileType.Audio],
    llm_id: '',
  },
  [ParserFileType.Video]: {
    fileFormat: ParserFileType.Video,
    output_format: 'text',
    suffix: parserFileTypeSuffixMap[ParserFileType.Video],
    llm_id: '',
    prompt: '',
  },
}

export const initialParserFormValues = {
  outputs: parserOutputs,
  setups: parserDefaultVisibleFileTypes.map((fileType) =>
    getDefaultParserSetup(fileType),
  ),
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value)) as T
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0,
    )
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function normalizeOptionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function normalizeBoolean(value: unknown, fallback: boolean | undefined) {
  if (typeof value === 'boolean') {
    return value
  }

  return fallback
}

function withRequiredPreprocessValues(
  fileType: string | undefined,
  values: string[],
) {
  const allowedValues =
    parserPreprocessOptionsMap[fileType as ParserFileTypeValue]

  if (!allowedValues?.length) {
    return []
  }

  const allowedValueSet = new Set(allowedValues)
  const nextValues = values.filter((item) => allowedValueSet.has(item))
  if (!allowedValueSet.has(ParserPreprocessValue.MainContent)) {
    return nextValues
  }

  return Array.from(new Set([ParserPreprocessValue.MainContent, ...nextValues]))
}

function buildCommonSerializedSetup(item: ParserSetupValue) {
  return {
    output_format: item.output_format,
    suffix: normalizeStringArray(item.suffix),
  }
}

function stripUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === undefined) {
        return false
      }

      if (item === '') {
        return false
      }

      if (Array.isArray(item) && item.length === 0) {
        return false
      }

      return true
    }),
  ) as T
}

export function getDefaultParserSetup(fileType: string) {
  const setup = defaultParserSetupMap[fileType as ParserFileTypeValue]
  return cloneValue(setup || { fileFormat: fileType })
}

export function getDefaultParserSetups() {
  return parserFileTypeOrder.map((fileType) => getDefaultParserSetup(fileType))
}

export function getDefaultVisibleParserSetups() {
  return parserDefaultVisibleFileTypes.map((fileType) =>
    getDefaultParserSetup(fileType),
  )
}

export function normalizeParserPreprocess(
  fileType: string | undefined,
  value: unknown,
) {
  return withRequiredPreprocessValues(fileType, normalizeStringArray(value))
}

export function isParserMethodEqual(
  value: string | undefined,
  expected: string,
) {
  return value?.trim().toLowerCase() === expected.trim().toLowerCase()
}

export function isParserMethodFromProvider(
  value: string | undefined,
  providerName: string,
) {
  return (
    value?.trim().toLowerCase().endsWith(`@${providerName.toLowerCase()}`) ||
    false
  )
}

export function normalizeParserSetup(
  value: unknown,
  fallbackFileType?: string,
): ParserSetupValue {
  const rawValue = (
    value && typeof value === 'object' ? value : {}
  ) as ParserSetupValue
  const fileFormat = rawValue.fileFormat || fallbackFileType || ''
  const baseValue = getDefaultParserSetup(fileFormat)
  const outputFormat =
    normalizeOptionalString(rawValue.output_format) || baseValue.output_format
  const parseMethod =
    normalizeOptionalString(rawValue.parse_method) || baseValue.parse_method

  return {
    ...baseValue,
    ...rawValue,
    fileFormat,
    suffix: normalizeStringArray(rawValue.suffix ?? baseValue.suffix),
    output_format: outputFormat,
    parse_method: parseMethod,
    preprocess: normalizeParserPreprocess(
      fileFormat,
      rawValue.preprocess ?? baseValue.preprocess,
    ),
    fields: normalizeStringArray(rawValue.fields ?? baseValue.fields),
    mineru_parse_method:
      normalizeOptionalString(rawValue.mineru_parse_method) ||
      baseValue.mineru_parse_method,
    mineru_formula_enable: normalizeBoolean(
      rawValue.mineru_formula_enable,
      baseValue.mineru_formula_enable,
    ),
    mineru_table_enable: normalizeBoolean(
      rawValue.mineru_table_enable,
      baseValue.mineru_table_enable,
    ),
    mineru_lang:
      normalizeOptionalString(rawValue.mineru_lang) || baseValue.mineru_lang,
    paddleocr_parse_method:
      normalizeOptionalString(rawValue.paddleocr_parse_method) ||
      baseValue.paddleocr_parse_method,
    docling_parse_method:
      normalizeOptionalString(rawValue.docling_parse_method) ||
      baseValue.docling_parse_method,
  }
}

export function normalizeParserSetupsForStore(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeParserSetup(item))
  }

  if (value && typeof value === 'object') {
    return parserFileTypeOrder
      .filter((fileType) => fileType in (value as Record<string, unknown>))
      .map((fileType) =>
        normalizeParserSetup(
          (value as Record<string, unknown>)[fileType],
          fileType,
        ),
      )
  }

  return getDefaultVisibleParserSetups()
}

export function serializeParserSetupsForDsl(value: unknown) {
  return normalizeParserSetupsForStore(value).reduce<
    Record<string, ParserSetupValue>
  >((acc, item) => {
    if (!item.fileFormat) {
      return acc
    }

    const commonSetup = buildCommonSerializedSetup(item)
    const normalizedPreprocess = normalizeParserPreprocess(
      item.fileFormat,
      item.preprocess,
    )
    let nextSetup: ParserSetupValue = commonSetup

    switch (item.fileFormat) {
      case ParserFileType.PDF:
        nextSetup = {
          ...commonSetup,
          preprocess: normalizedPreprocess,
          parse_method: item.parse_method,
          lang:
            isParserMethodFromProvider(item.parse_method, 'MinerU') ||
            isParserMethodEqual(item.parse_method, 'mineru')
              ? item.mineru_lang || item.lang
              : item.lang,
        }
        if (
          isParserMethodEqual(item.parse_method, ParserParseMethod.TCADPParser)
        ) {
          nextSetup.table_result_type = item.table_result_type
          nextSetup.markdown_image_response_type =
            item.markdown_image_response_type
        }
        if (isParserMethodFromProvider(item.parse_method, 'MinerU')) {
          nextSetup.mineru_parse_method = item.mineru_parse_method
          nextSetup.mineru_formula_enable = item.mineru_formula_enable
          nextSetup.mineru_table_enable = item.mineru_table_enable
          nextSetup.mineru_lang = item.mineru_lang
          nextSetup.mineru_llm_name = item.mineru_llm_name
        }
        if (isParserMethodFromProvider(item.parse_method, 'PaddleOCR')) {
          nextSetup.paddleocr_parse_method = item.paddleocr_parse_method
          nextSetup.paddleocr_llm_name = item.paddleocr_llm_name
        }
        if (isParserMethodEqual(item.parse_method, ParserParseMethod.Docling)) {
          nextSetup.docling_parse_method = item.docling_parse_method
        }
        break
      case ParserFileType.Spreadsheet:
      case ParserFileType.Slides:
        nextSetup = {
          ...commonSetup,
          preprocess: normalizedPreprocess,
          parse_method: item.parse_method,
        }
        if (
          isParserMethodEqual(item.parse_method, ParserParseMethod.TCADPParser)
        ) {
          nextSetup.table_result_type = item.table_result_type
          nextSetup.markdown_image_response_type =
            item.markdown_image_response_type
        }
        break
      case ParserFileType.Doc:
      case ParserFileType.Docx:
      case ParserFileType.TextMarkdown:
      case ParserFileType.TextCode:
        nextSetup = {
          ...commonSetup,
          preprocess: normalizedPreprocess,
        }
        break
      case ParserFileType.Image:
        nextSetup = {
          ...commonSetup,
          parse_method: item.parse_method,
          lang: item.lang,
          system_prompt: item.system_prompt,
        }
        break
      case ParserFileType.Email:
        nextSetup = {
          ...commonSetup,
          fields: normalizeStringArray(item.fields),
        }
        break
      case ParserFileType.Audio:
        nextSetup = {
          ...commonSetup,
          llm_id: item.llm_id,
        }
        break
      case ParserFileType.Video:
        nextSetup = {
          ...commonSetup,
          llm_id: item.llm_id,
          prompt: item.prompt,
        }
        break
      default:
        break
    }

    acc[item.fileFormat] = stripUndefined(nextSetup)
    return acc
  }, {})
}

export function normalizeParserFormForStore(
  form: Record<string, unknown> = {},
) {
  return {
    ...form,
    outputs: parserOutputs,
    setups: normalizeParserSetupsForStore(form.setups),
  }
}

export function serializeParserFormForDsl(form: Record<string, unknown> = {}) {
  return {
    ...form,
    outputs: parserOutputs,
    setups: serializeParserSetupsForDsl(form.setups),
  }
}
