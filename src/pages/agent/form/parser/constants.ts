import type { TFunction } from 'i18next'
import {
  MineruLanguageOptions,
  MineruParseMethodOptions,
} from '@/types/knowledge-form'
import {
  ParserEmailField,
  type ParserSetupValue,
  ParserFileType,
  ParserParseMethod,
  ParserPreprocessValue,
  parserDefaultVisibleFileTypes,
  parserFileTypeOrder,
  type ParserFileTypeValue,
} from './utils'

const parserFileTypeLabelKeyMap: Record<ParserFileTypeValue, string> = {
  [ParserFileType.Html]: 'html',
  [ParserFileType.PDF]: 'pdf',
  [ParserFileType.Spreadsheet]: 'spreadsheet',
  [ParserFileType.Image]: 'image',
  [ParserFileType.Email]: 'email',
  [ParserFileType.TextMarkdown]: 'markdown',
  [ParserFileType.TextCode]: 'textCode',
  [ParserFileType.Doc]: 'doc',
  [ParserFileType.Docx]: 'docx',
  [ParserFileType.Slides]: 'slides',
  [ParserFileType.Audio]: 'audio',
  [ParserFileType.Video]: 'video',
}

const parserFileTypeFallbackLabelMap: Record<ParserFileTypeValue, string> = {
  [ParserFileType.Html]: 'HTML',
  [ParserFileType.PDF]: 'PDF',
  [ParserFileType.Spreadsheet]: 'Spreadsheet',
  [ParserFileType.Image]: 'Image',
  [ParserFileType.Email]: 'Email',
  [ParserFileType.TextMarkdown]: 'Markdown',
  [ParserFileType.TextCode]: 'Text & Code',
  [ParserFileType.Doc]: 'DOC',
  [ParserFileType.Docx]: 'DOCX',
  [ParserFileType.Slides]: 'Slides',
  [ParserFileType.Audio]: 'Audio',
  [ParserFileType.Video]: 'Video',
}

const parserFileTypeBadgeClassNameMap: Record<ParserFileTypeValue, string> = {
  [ParserFileType.Html]: 'bg-avatar-7-bg text-avatar-7-fg',
  [ParserFileType.PDF]: 'bg-avatar-6-bg text-avatar-6-fg',
  [ParserFileType.Spreadsheet]: 'bg-avatar-4-bg text-avatar-4-fg',
  [ParserFileType.Image]: 'bg-avatar-7-bg text-avatar-7-fg',
  [ParserFileType.Email]: 'bg-avatar-2-bg text-avatar-2-fg',
  [ParserFileType.TextMarkdown]: 'bg-avatar-7-bg text-avatar-7-fg',
  [ParserFileType.TextCode]: 'bg-avatar-7-bg text-avatar-7-fg',
  [ParserFileType.Doc]: 'bg-avatar-6-bg text-avatar-6-fg',
  [ParserFileType.Docx]: 'bg-avatar-6-bg text-avatar-6-fg',
  [ParserFileType.Slides]: 'bg-avatar-2-bg text-avatar-2-fg',
  [ParserFileType.Audio]: 'bg-avatar-2-bg text-avatar-2-fg',
  [ParserFileType.Video]: 'bg-fg text-fg-inverse',
}

const parserParseMethodLabelMap: Record<string, string> = {
  [ParserParseMethod.DeepDOC]: 'DeepDOC',
  [ParserParseMethod.PlainText]: 'Plain Text',
  [ParserParseMethod.Docling]: 'Docling',
  [ParserParseMethod.TCADPParser]: 'TCADP Parser',
  [ParserParseMethod.OCR]: 'OCR',
  mineru: 'MinerU',
  paddleocr: 'PaddleOCR',
  opendataloader: 'OpenDataLoader',
}

const preprocessLabelKeyMap: Record<string, string> = {
  [ParserPreprocessValue.MainContent]: 'mainContent',
  [ParserPreprocessValue.SectionTitle]: 'sectionTitle',
  [ParserPreprocessValue.Abstract]: 'abstract',
  [ParserPreprocessValue.Author]: 'author',
}

export const parserFileTypeOptions = parserFileTypeOrder
export const parserAddableFileTypeOptions = [
  ParserFileType.Html,
  ...parserDefaultVisibleFileTypes,
  ParserFileType.Audio,
  ParserFileType.Video,
]

export const parserLanguageOptions = MineruLanguageOptions.map((item) => ({
  label: item.label,
  value: item.value,
}))

export const parserMineruParseMethodOptions = MineruParseMethodOptions.map(
  (item) => ({
    label: item.label,
    value: item.value,
  }),
)

export const parserDoclingParseMethodOptions = [{ label: 'Raw', value: 'raw' }]

export const parserPaddleOCRParseMethodOptions = [
  { label: 'Raw', value: 'raw' },
]

export const parserTableResultTypeOptions = [
  { label: 'Markdown', value: '0' },
  { label: 'HTML', value: '1' },
]

export const parserMarkdownImageResponseTypeOptions = [
  { label: 'URL', value: '0' },
  { label: 'Text', value: '1' },
]

export const parserPdfBuiltInParseMethodOptions = [
  { label: 'DeepDOC', value: ParserParseMethod.DeepDOC },
  { label: 'Plain Text', value: ParserParseMethod.PlainText },
  { label: 'Docling', value: ParserParseMethod.Docling },
  { label: 'TCADP Parser', value: ParserParseMethod.TCADPParser },
]

export const emailFieldOptions = Object.values(ParserEmailField).map(
  (value) => ({
    label: value,
    value,
  }),
)

export const FIELD_LABEL_CLASSNAME =
  'text-base font-medium leading-7 text-fg-muted'

export const SELECT_TRIGGER_CLASSNAME =
  'h-12 rounded-radius-xl border-line bg-surface px-space-base py-space-sm text-base shadow-none'

export const INPUT_CLASSNAME =
  'h-12 rounded-radius-xl border-line bg-surface px-space-base py-space-sm text-base shadow-none'

export type ParserFileMeta = {
  label: string
  badgeClassName: string
}

export function getParserFileTypeLabel(t: TFunction, fileFormat?: string) {
  if (!fileFormat || !(fileFormat in parserFileTypeLabelKeyMap)) {
    return fileFormat || t('common.unassigned', 'Unassigned')
  }

  const typedFileFormat = fileFormat as ParserFileTypeValue
  return t(
    `flow.fileFormatOptions.${parserFileTypeLabelKeyMap[typedFileFormat]}`,
    parserFileTypeFallbackLabelMap[typedFileFormat],
  )
}

export function getParserMeta(
  t: TFunction,
  fileFormat?: string,
): ParserFileMeta {
  if (!fileFormat || !(fileFormat in parserFileTypeBadgeClassNameMap)) {
    return {
      label: getParserFileTypeLabel(t, fileFormat),
      badgeClassName: 'bg-sunken text-fg-muted',
    }
  }

  return {
    label: getParserFileTypeLabel(t, fileFormat),
    badgeClassName:
      parserFileTypeBadgeClassNameMap[fileFormat as ParserFileTypeValue],
  }
}

export function getParserPreprocessLabel(t: TFunction, value: string) {
  const labelKey = preprocessLabelKeyMap[value]
  if (!labelKey) {
    return value
  }

  return t(`flow.preprocess.${labelKey}`, value)
}

export function getParserParseMethodLabel(value?: string) {
  if (!value) {
    return ''
  }

  return parserParseMethodLabelMap[value] || value
}

export function getParserOutputFormatLabel(value?: string) {
  if (!value) {
    return ''
  }

  if (value === 'json' || value === 'html') {
    return value.toUpperCase()
  }

  if (value === 'markdown') {
    return 'Markdown'
  }

  if (value === 'text') {
    return 'Text'
  }

  return value
}

function getCompactParserModelLabel(value?: string) {
  if (!value) {
    return ''
  }

  const [modelName] = value.split('@')
  return modelName || value
}

export function getParserSetupSummary(
  t: TFunction,
  setup?: Pick<
    ParserSetupValue,
    'fileFormat' | 'output_format' | 'parse_method' | 'llm_id'
  >,
) {
  if (!setup) {
    return t('common.unassigned', 'Unassigned')
  }

  const summaryParts = [
    [
      getParserFileTypeLabel(t, setup.fileFormat),
      getParserOutputFormatLabel(setup.output_format),
    ]
      .filter(Boolean)
      .join(' -> '),
    getParserParseMethodLabel(setup.parse_method) ||
      getCompactParserModelLabel(setup.llm_id),
  ].filter(Boolean)

  return summaryParts.join(' · ')
}

export function getParserControlClassName() {
  return 'border-line bg-surface'
}

export function getParserControlStyle() {
  return {
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-line)',
  }
}
