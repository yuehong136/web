import { DocumentParserType } from '@/types/document-parser'

const parserImagePrefixes: Partial<Record<DocumentParserType, string>> = {
  [DocumentParserType.Book]: 'book',
  [DocumentParserType.Laws]: 'law',
  [DocumentParserType.Manual]: 'manual',
  [DocumentParserType.Picture]: 'media',
  [DocumentParserType.Naive]: 'naive',
  [DocumentParserType.Paper]: 'paper',
  [DocumentParserType.Presentation]: 'presentation',
  [DocumentParserType.Qa]: 'qa',
  [DocumentParserType.Resume]: 'resume',
  [DocumentParserType.Table]: 'table',
  [DocumentParserType.One]: 'one',
  [DocumentParserType.KnowledgeGraph]: 'knowledge-graph',
  [DocumentParserType.Audio]: 'media',
  [DocumentParserType.Email]: 'naive',
  [DocumentParserType.Tag]: 'tag',
}

const parserImageCounts: Partial<Record<DocumentParserType, number>> = {
  [DocumentParserType.Book]: 4,
  [DocumentParserType.Laws]: 2,
  [DocumentParserType.Manual]: 4,
  [DocumentParserType.Picture]: 2,
  [DocumentParserType.Naive]: 2,
  [DocumentParserType.Paper]: 2,
  [DocumentParserType.Presentation]: 2,
  [DocumentParserType.Qa]: 2,
  [DocumentParserType.Resume]: 2,
  [DocumentParserType.Table]: 2,
  [DocumentParserType.One]: 4,
  [DocumentParserType.KnowledgeGraph]: 2,
  [DocumentParserType.Audio]: 2,
  [DocumentParserType.Email]: 2,
  [DocumentParserType.Tag]: 2,
}

export const getParserImageFileNames = (
  parserType: DocumentParserType | string,
) => {
  const type = parserType as DocumentParserType
  const prefix = parserImagePrefixes[type]
  const count = parserImageCounts[type] ?? 0

  if (!prefix || count <= 0) return []

  return Array.from({ length: count }, (_, index) => `${prefix}-0${index + 1}`)
}
